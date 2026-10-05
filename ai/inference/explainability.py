import logging
import xgboost as xgb
import numpy as np

logger = logging.getLogger(__name__)

# User-friendly mapping of known model substrings to human-readable names
FEATURE_MAPPINGS = {
    "temperature": "Temperature",
    "humidity": "Relative Humidity",
    "precipitation": "Precipitation",
    "pressure": "Atmospheric Pressure",
    "cloud_cover": "Cloud Cover",
    "wind_speed": "Wind Speed",
    "wind_direction": "Wind Direction"
}

# Unit mapping based on the known features
UNIT_MAPPINGS = {
    "Temperature": "°C",
    "Relative Humidity": "%",
    "Precipitation": "mm",
    "Atmospheric Pressure": "hPa",
    "Cloud Cover": "%",
    "Wind Speed": "km/h",
    "Wind Direction": "°"
}

def get_human_readable_name(raw_feature_name: str) -> str:
    lower_name = raw_feature_name.lower()
    for key, label in FEATURE_MAPPINGS.items():
        if key in lower_name:
            return label
    return raw_feature_name

def is_meteorological(label: str) -> bool:
    return label in FEATURE_MAPPINGS.values()

def generate_explanation(model_data: dict, prepared_df, top_n: int = 3) -> dict:
    """
    Generates explainability data using XGBoost native pred_contribs (SHAP values).
    Returns a structured dictionary of the top meteorological contributors.
    """
    try:
        model = model_data.get('model')
        features = model_data.get('features')
        
        if not hasattr(model, 'get_booster'):
            raise ValueError("Model does not support native get_booster() for feature contributions.")
            
        booster = model.get_booster()
        
        # XGBoost DMatrix with exact feature names to bypass pandas string encoding issues
        dmatrix = xgb.DMatrix(prepared_df.values, feature_names=features)
        
        # pred_contribs=True returns matrix of shape (n_samples, n_features + 1)
        # The last column is the bias/base_margin.
        contribs = booster.predict(dmatrix, pred_contribs=True)
        
        # We only care about the first sample since we predict hourly individually
        sample_contribs = contribs[0, :-1] # exclude the bias term
        
        explanations = []
        for i, feature_name in enumerate(features):
            label = get_human_readable_name(feature_name)
            
            # Only include actual meteorological features, not locations/dates
            if not is_meteorological(label):
                continue
                
            contribution = float(sample_contribs[i])
            # XGBoost binary classification contribs represent log-odds.
            # Positive contribution -> pushes probability towards 1 (Bust)
            # Negative contribution -> pushes probability towards 0 (Reliable)
            
            direction = "increases_bust_risk" if contribution > 0 else "decreases_bust_risk"
            
            value = float(prepared_df.iloc[0, i])
            
            explanations.append({
                "feature": feature_name,
                "label": label,
                "value": value,
                "unit": UNIT_MAPPINGS.get(label, ""),
                "contribution": contribution,
                "abs_contribution": abs(contribution),
                "direction": direction
            })
            
        # Sort by absolute contribution (strongest impact regardless of direction)
        explanations.sort(key=lambda x: x["abs_contribution"], reverse=True)
        
        # Keep top N
        top_factors = explanations[:top_n]
        
        # Clean up internal sorting key before returning
        for factor in top_factors:
            del factor["abs_contribution"]
            
        return {
            "available": True,
            "top_factors": top_factors
        }
        
    except Exception as e:
        logger.warning(f"Failed to generate explanation: {e}")
        return {
            "available": False,
            "reasons": [],
            "message": "Model feature contributions are not available for this prediction."
        }
