from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, papers, repos, ai, admin

# Initialize database tables on application start
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Research Paper Recommendation Engine API",
    description="Backend service for querying papers + repos, LLM differentiation, tech stacks, code generation, and chat memory.",
    version="1.0.0"
)

# Set up CORS middleware to support frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all endpoint routes
app.include_router(auth.router)
app.include_router(papers.router)
app.include_router(repos.router)
app.include_router(ai.router)
app.include_router(admin.router)

@app.get("/", tags=["Healthcheck"])
async def root():
    return {
        "status": "healthy",
        "service": "AI Research Paper Recommendation Engine Backend",
        "version": "1.0.0"
    }
