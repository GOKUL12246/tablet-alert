from contextlib import asynccontextmanager
import logging
import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.config import settings
from app.core.exceptions import MedisakhiException, medisakhi_exception_handler
from app.core.scheduler import shutdown_scheduler, start_scheduler
from app.database import Base, engine
import app.models  # Ensure all model tables are registered with Base metadata

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("medisakhi.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and start background scheduler
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    try:
        import seed_data
        seed_data.seed_database()
        logger.info("Default seed database verified.")
    except Exception as e:
        logger.info(f"Database seed skipped: {e}")

    if not os.environ.get("TESTING"):
        logger.info("Starting background scheduler...")
        start_scheduler()
    yield
    # Shutdown
    if not os.environ.get("TESTING"):
        logger.info("Stopping background scheduler...")
        shutdown_scheduler()


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered Medication Assistance & Remote Adherence Platform for Rural, Non-Literate & Differently-Abled Individuals",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware - configured for Vercel deployments and local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Medisakhi Exception Handler
app.add_exception_handler(MedisakhiException, medisakhi_exception_handler)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled exception during {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "An internal server error occurred.",
            "code": "INTERNAL_SERVER_ERROR",
        },
    )


# Include API v1 Routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health_check():
    """Service health check endpoint."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "demo_mode": settings.DEMO_MODE,
        "version": "1.0.0"
    }


@app.get("/", tags=["Root"])
def root():
    """Root welcoming endpoint with documentation link."""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "documentation": "/docs",
        "health": "/health",
        "version": "1.0.0"
    }
