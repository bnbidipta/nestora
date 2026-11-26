"""
NESTORA - Phase 1 Mumbai Pilot Backend
FastAPI Modular Monolith wiring 14 task models, Judge, and Orchestrator.
Day-1 Security: CORS protection, Pydantic validation, safe error masking.
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging

from backend.app.api import house, swipe, design, family

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("nestora_api")

# On Render (production) never fall back to local JSON files: they vanish on every restart.
if os.environ.get("RENDER") and not (os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_ROLE_KEY")):
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in production.")

if os.environ.get("SENTRY_DSN"):  # crash reports (free plan); off when unset
    import sentry_sdk

    def _scrub(event, _hint):
        h = (event.get("request") or {}).get("headers") or {}
        for k in list(h):
            if k.lower() in ("x-edit-token", "authorization", "cookie"):
                h[k] = "[removed]"
        (event.get("request") or {}).pop("data", None)  # request bodies may hold briefs or emails
        return event
    sentry_sdk.init(dsn=os.environ["SENTRY_DSN"], send_default_pii=False, traces_sample_rate=0, before_send=_scrub,
                    environment=os.environ.get("RENDER", "") and "production" or "development")

app = FastAPI(
    title="NESTORA API - Architectural Intelligence Platform",
    description="Backend API for Nestora Phase 1 (Mumbai Pilot) - From Plot to Keys.",
    version="1.0.0"
)

# Day-1 Security: CORS Middleware
app.add_middleware(
    CORSMiddleware,
    # Comma-separated in prod, e.g. "https://nestora.vercel.app,https://www.nestora.in"
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    # Optional, for per-branch preview URLs, e.g. ^https://frontend(-[a-z0-9-]+)?-bnbidipta\.vercel\.app$
    allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX") or None,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Global Exception Handler (No raw stack trace leakage to client)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred. Our engineering team has been notified."
            }
        }
    )


# System Health Check
@app.get("/health", tags=["System"])
def root_health_check():
    return {
        "status": "healthy",
        "service": "nestora_backend",
        "pilot": "Mumbai",
        "version": "1.0.0"
    }


# Mount all public and internal task routers
app.include_router(house.router)
app.include_router(swipe.router)
app.include_router(design.router)
app.include_router(family.router)
