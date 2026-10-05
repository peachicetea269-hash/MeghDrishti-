import os
import logging
from pathlib import Path
import joblib

logger = logging.getLogger(__name__)

# Project-root-safe path calculation
# __file__ is in ai/inference/model_loader.py
# parent is ai/inference
# parent.parent is ai
_MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "trained" / "forecast_bust_model_final.joblib"

_model_instance = None

def get_model():
    """
    Returns the loaded model. Loads it if it hasn't been loaded yet.
    """
    global _model_instance
    
    if _model_instance is not None:
        return _model_instance
        
    if not _MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at path: {_MODEL_PATH}")
        
    try:
        logger.info(f"Loading model from {_MODEL_PATH}")
        _model_instance = joblib.load(_MODEL_PATH)
        logger.info("Model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load model from {_MODEL_PATH}: {e}")
        raise RuntimeError(f"Failed to load model: {e}") from e
        
    return _model_instance
