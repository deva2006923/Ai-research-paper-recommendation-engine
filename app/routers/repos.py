from typing import List
from fastapi import APIRouter, Depends, Query

from app.auth import get_current_user
from app.models import User
from app.schemas import RepoResult
from app.services.github_service import search_github

router = APIRouter(prefix="/repos", tags=["Repositories"])

@router.get("/search", response_model=List[RepoResult])
async def search_repositories(
    query: str = Query(..., description="Query string to search GitHub repositories"),
    limit: int = Query(10, ge=1, le=50, description="Max number of repositories to return"),
    current_user: User = Depends(get_current_user)
):
    """
    Search relevant GitHub repositories based on query keywords.
    Requires authentication.
    """
    return await search_github(query, limit=limit)
