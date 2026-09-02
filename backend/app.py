from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import Base, engine
from routes.auth import router as auth_router
from routes.applications import router as applications_router, jobs_router
from utils.logger import logger

# === Initialize FastAPI ===
app = FastAPI(
    title="Resume Intelligence API",
    description="Evidence-based resume analysis against job descriptions",
    version="1.0.0",
)

# === Enable CORS for frontend access ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === Startup Event ===
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    logger.info("PostgreSQL tables initialized (User + Application).")


# === Health Check ===
@app.get("/")
def read_root():
    return {"message": "Resume Intelligence API is running.", "version": "1.0.0"}


# === Routers ===
app.include_router(auth_router, prefix="/auth")
app.include_router(applications_router)
app.include_router(jobs_router)
