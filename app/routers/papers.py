import asyncio
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import User, SearchHistory
from app.schemas import PaperResult
from app.services.arxiv_service import search_arxiv
from app.services.semantic_scholar import search_semantic_scholar

router = APIRouter(prefix="/papers", tags=["Papers"])

def normalize_title(title: str) -> str:
    """
    Normalize title to match duplicates from different API sources.
    """
    return "".join(c.lower() for c in title if c.isalnum())

@router.get("/search", response_model=List[PaperResult])
async def search_papers(
    query: str = Query(..., description="Problem statement or search query"),
    limit: int = Query(10, ge=1, le=50, description="Limit of ranked papers to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Query arXiv and Semantic Scholar APIs concurrently, merge, rank, and return the papers.
    Records search history to user profile.
    """
    if not query.strip():
        return []

    # 1. Save query to database search history
    history = SearchHistory(user_id=current_user.id, query=query)
    db.add(history)
    db.commit()

    # 2. Concurrently call arXiv and Semantic Scholar APIs
    arxiv_task = search_arxiv(query, limit=limit)
    ss_task = search_semantic_scholar(query, limit=limit)
    
    arxiv_results, ss_results = await asyncio.gather(arxiv_task, ss_task)
    
    # 3. Deduplicate based on title similarity
    merged_papers = {}
    for paper in arxiv_results + ss_results:
        norm = normalize_title(paper.title)
        if norm in merged_papers:
            # Merge records
            existing = merged_papers[norm]
            existing.source = "merged"
            if not existing.abstract and paper.abstract:
                existing.abstract = paper.abstract
            if not existing.open_access_pdf and paper.open_access_pdf:
                existing.open_access_pdf = paper.open_access_pdf
            if not existing.url and paper.url:
                existing.url = paper.url
            if paper.citation_count > existing.citation_count:
                existing.citation_count = paper.citation_count
            if paper.year and (not existing.year or paper.year > existing.year):
                existing.year = paper.year
        else:
            merged_papers[norm] = paper

    # 4. Rank papers using a heuristic score:
    # - Merged papers (present on both platforms) get +10 points
    # - Citations: 1 point per 10 citations (capped at 20 points)
    # - Year: +0.5 points for each year since 2018 (capped at 5 points)
    def score_paper(p: PaperResult) -> float:
        score = 0.0
        if p.source == "merged":
            score += 10.0
        if p.citation_count:
            score += min(p.citation_count / 10.0, 20.0)
        if p.year:
            score += min(max(p.year - 2018, 0) * 0.5, 5.0)
        return score

    ranked_papers = sorted(merged_papers.values(), key=score_paper, reverse=True)
    return ranked_papers[:limit]
