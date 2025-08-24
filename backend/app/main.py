# backend/app/main.py
# ENHANCED VERSION with proper error logging

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging
import traceback

from .models import *
from .db import get_session
from .routers import auth as auth_router
from .routers import schools as schools_router
from .routers import admin as admin_router
from .routers import dashboard as dashboard_router
from .routers import classrooms as classrooms_router
from .routers import students as students_router
from .routers import academic_years as academic_years_router
from .routers import subjects as subjects_router
from .routers import rooms as rooms_router
from .routers import special_needs as special_needs_router
from .routers import parents as parents_router
from .routers import student_services as student_services_router
from .routers import enrollments as enrollments_router
from .routers import users as users_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="SIS API - Phase A.2")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error", 
            "path": request.url.path,
            "error_type": type(exc).__name__
        }
    )

@app.get("/health") 
async def health(session: AsyncSession = Depends(get_session)):
    await session.execute(text("SELECT 1"))
    return {"status": "ok"}

# Include routers with prefixes
app.include_router(auth_router.router)
app.include_router(schools_router.router)
app.include_router(admin_router.router)
app.include_router(dashboard_router.router)
app.include_router(classrooms_router.router)
app.include_router(students_router.router)
app.include_router(academic_years_router.router)
app.include_router(subjects_router.router)
app.include_router(rooms_router.router)
app.include_router(special_needs_router.router)
app.include_router(parents_router.router)
app.include_router(student_services_router.router)
app.include_router(enrollments_router.router)
app.include_router(users_router.router)


# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("SIS API starting up...")
    logger.info("Enrollment endpoints registered at /enrollments")


for r in app.router.routes:
    if getattr(r, "path", None):
        print("ROUTE:", r.path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)