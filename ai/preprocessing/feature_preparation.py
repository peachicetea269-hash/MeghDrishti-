import pandas as pd
import numpy as np
from datetime import datetime

from ai.inference.model_loader import get_model

def get_feature_name_containing(features, keyword):
    for f in features:
        if keyword in f.lower():
            return f
    return None

def prepare_features(input_data: dict) -> pd.DataFrame:
    """
    Converts a normalized input dictionary into the exact pandas DataFrame
    expected by the trained XGBoost model.
    """
    model_data = get_model()
    features = model_data['features']
    medians = model_data['train_medians']
    location_names = model_data['location_names']
    location_cols = model_data['location_feature_columns']
    
    # 1. Initialize with medians (or NaNs) from the model training phase
    prepared_data = {f: medians.get(f, np.nan) for f in features}
    
    # 2. Map input weather fields to model fields
    mapping = {
        'temperature': get_feature_name_containing(features, 'temperature'),
        'humidity': get_feature_name_containing(features, 'humidity'),
        'precipitation': get_feature_name_containing(features, 'precipitation'),
        'pressure': get_feature_name_containing(features, 'pressure'),
        'cloud_cover': get_feature_name_containing(features, 'cloud_cover'),
        'wind_speed': get_feature_name_containing(features, 'wind_speed'),
        'wind_direction': get_feature_name_containing(features, 'wind_direction')
    }
    
    # C. Missing required weather field validation
    required_inputs = ['temperature', 'humidity', 'precipitation', 'pressure', 'cloud_cover', 'wind_speed', 'wind_direction', 'timestamp', 'location']
    missing = [req for req in required_inputs if req not in input_data]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")
        
    for in_key, out_key in mapping.items():
        if out_key is None:
            raise ValueError(f"Could not map input feature '{in_key}' to any known model feature.")
        prepared_data[out_key] = float(input_data[in_key])
            
    # 3. Time features extraction
    try:
        if isinstance(input_data['timestamp'], str):
            dt = pd.to_datetime(input_data['timestamp'])
        else:
            dt = input_data['timestamp']
        prepared_data['month'] = float(dt.month)
        prepared_data['day_of_year'] = float(dt.dayofyear)
        prepared_data['hour'] = float(dt.hour)
    except Exception as e:
        raise ValueError(f"Invalid timestamp format: {e}")
        
    # 4. Location encoding (One-Hot Encoding)
    loc_name = input_data['location']
    
    # Initialize all location columns to 0.0
    for col in location_cols:
        prepared_data[col] = 0.0
        
    # Match location to set 1.0
    matched = False
    for loc_id, name in location_names.items():
        if name.lower() == loc_name.lower():
            col_name = f"location_{loc_id}"
            if col_name in prepared_data:
                prepared_data[col_name] = 1.0
                matched = True
            break
            
    # D. Unknown location: All location_X columns remain 0.0 (OHE standard approach)
    # The requirement says "must be handled according to the model's actual location mapping"
    
    # 5. Build the DataFrame strictly enforcing the model's exact feature order
    df = pd.DataFrame([prepared_data], columns=features)
    
    return df
