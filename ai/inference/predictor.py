import logging
from typing import Dict, Any

from ai.inference.model_loader import get_model
from ai.preprocessing.feature_preparation import prepare_features

logger = logging.getLogger(__name__)

def predict_forecast_bust(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes a normalized input dictionary containing weather and location data,
    prepares features, and runs the loaded model to predict forecast bust probability.
    """
    try:
        # 1. Load model and metadata (handled cleanly by model_loader)
        model_data = get_model()
        model = model_data['model']
        model_version = model_data.get('version', 'unknown')
        
        # 2. Prepare features via the dedicated layer
        prepared_df = prepare_features(input_data)
        
        # 3. Use numpy array to bypass feature-name string encoding mismatch bug
        X = prepared_df.values
        
        # 4. Run prediction
        prediction = model.predict(X)
        probabilities = model.predict_proba(X)
        
        # Predict_proba returns shape (n_samples, n_classes)
        # We extract the probability of the positive class (index 1) for the single sample
        bust_probability = float(probabilities[0][1])
        prediction_value = int(prediction[0])
        
        # Validate probability bounds
        if not (0.0 <= bust_probability <= 1.0):
            raise ValueError(f"Calculated probability {bust_probability} is out of bounds (0-1).")
            
        # 5. Generate explainability insights
        from ai.inference.explainability import generate_explanation
        explanation = generate_explanation(model_data, prepared_df, top_n=3)
            
        return {
            "prediction": prediction_value,
            "bust_probability": bust_probability,
            "model_version": model_version,
            "explanation": explanation
        }
        
    except ValueError as ve:
        logger.error(f"Validation error during prediction: {ve}")
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise RuntimeError(f"Prediction failed: {e}") from e
