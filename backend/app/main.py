from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.predictions import router as predictions_router
from backend.app.api.geocode import router as geocode_router
from backend.app.api.reliability import router as reliability_router
from backend.app.api.regional import router as regional_router

app = FastAPI(title="MeghDrishti API")

@app.get('/health')
def health_check():
    return {'status': 'healthy', 'api': 'MeghDrishti'}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictions_router)
app.include_router(geocode_router)
app.include_router(reliability_router)
app.include_router(regional_router)

