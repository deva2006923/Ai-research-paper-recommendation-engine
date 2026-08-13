from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.auth import get_admin_user
from app.models import User, SearchHistory, ChatSession, ChatMessage
from app.schemas import AdminStatsResponse, UserResponse

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregated system statistics.
    Restricted to prakasshdeva876@gmail.com only.
    """
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_searches = db.query(func.count(SearchHistory.id)).scalar() or 0
    total_sessions = db.query(func.count(ChatSession.id)).scalar() or 0
    total_messages = db.query(func.count(ChatMessage.id)).scalar() or 0

    # Fetch top 10 recent searches
    recent_searches_query = db.query(SearchHistory).order_by(SearchHistory.timestamp.desc()).limit(10).all()
    recent_searches = [
        {
            "id": h.id,
            "user_id": h.user_id,
            "query": h.query,
            "timestamp": h.timestamp
        }
        for h in recent_searches_query
    ]

    # Fetch top 10 recent registered users
    recent_users_query = db.query(User).order_by(User.created_at.desc()).limit(10).all()
    recent_users = [UserResponse.model_validate(u) for u in recent_users_query]

    # Fetch all users and their activity
    all_users_query = db.query(User).options(
        joinedload(User.searches),
        joinedload(User.chat_sessions).joinedload(ChatSession.messages)
    ).all()
    
    all_users_activity = []
    for u in all_users_query:
        all_users_activity.append({
            "user": UserResponse.model_validate(u),
            "searches": u.searches,
            "chat_sessions": u.chat_sessions
        })

    return AdminStatsResponse(
        total_users=total_users,
        total_searches=total_searches,
        total_sessions=total_sessions,
        total_messages=total_messages,
        recent_searches=recent_searches,
        recent_users=recent_users,
        all_users_activity=all_users_activity
    )
