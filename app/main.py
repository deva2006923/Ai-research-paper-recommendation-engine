from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, papers, repos, ai, admin
from contextlib import asynccontextmanager
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed admin user if it doesn't exist
    db = SessionLocal()
    try:
        admin_email = "prakasshdeva876@gmail.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
            admin = User(
                email=admin_email,
                name="Admin User",
                hashed_password=hashed_password
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()
    yield

# Initialize database tables on application start
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Research Paper Recommendation Engine API",
    description="Backend service for querying papers + repos, LLM differentiation, tech stacks, code generation, and chat memory.",
    version="1.0.0",
    lifespan=lifespan
)

# Set up CORS middleware to support frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

# Include all endpoint routes
app.include_router(auth.router)
app.include_router(papers.router)
app.include_router(repos.router)
app.include_router(ai.router)
app.include_router(admin.router)

@app.get("/api/health", tags=["Healthcheck"])
async def healthcheck():
    return {
        "status": "healthy",
        "service": "AI Research Paper Recommendation Engine Backend",
        "version": "1.0.0"
    }

# Static files & SPA fallback for frontend integration
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API endpoints, docs, and openapi schema to bypass SPA fallback
        api_prefixes = ("auth/", "papers/", "repos/", "differentiate", "tech-stack", "generate-code", "assistant/", "admin/stats", "docs", "openapi.json", "redoc", "api/")
        if full_path.startswith(api_prefixes):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Frontend index.html not found"})

