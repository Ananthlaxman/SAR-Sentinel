
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.nisar import router as nisar_router

app = FastAPI(
    title="SAR-Sentinel API",
    description="NASA NISAR Earth Surface Change Detection Platform",
    version="1.0.0"
)

# Allow the Vite frontend development ports.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "project": "SAR-Sentinel",
        "team": "Alpha6Gen",
        "status": "Running",
        "message": "Welcome to SAR-Sentinel"
    }


@app.get("/health")
def health():
    return {
        "backend": "Online",
        "status": "Healthy"
    }


app.include_router(nisar_router)
