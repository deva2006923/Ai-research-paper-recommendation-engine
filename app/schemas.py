from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class GoogleAuthRequest(BaseModel):
    token: str = Field(..., description="Google OAuth2 ID token")

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[EmailStr] = None
    user_id: Optional[int] = None

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    picture: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Paper & Repo Schemas ---
class PaperResult(BaseModel):
    title: str
    authors: List[str]
    abstract: Optional[str] = None
    url: Optional[str] = None
    venue: Optional[str] = None
    year: Optional[int] = None
    citation_count: Optional[int] = Field(0, alias="citationCount")
    open_access_pdf: Optional[str] = Field(None, alias="openAccessPdf")
    source: str  # "arxiv" or "semanticscholar" or "merged"

    class Config:
        populate_by_name = True

class RepoResult(BaseModel):
    name: str
    description: Optional[str] = None
    url: str
    stars: int
    forks: int
    language: Optional[str] = None
    owner: str

# --- AI Feature Schemas ---
class DifferentiateRequest(BaseModel):
    problem_statement: str
    papers: List[PaperResult]
    repos: List[RepoResult]

class SuggestedProductDirection(BaseModel):
    title: str
    description: str
    feasibility_score: int
    justification: str

class DifferentiateResponse(BaseModel):
    existing_landscape_summary: str
    identified_gap: str
    why_this_gap_exists: str
    suggested_product_direction: SuggestedProductDirection
    suggestions: str  # Markdown summary

class TechStackRequest(BaseModel):
    problem_statement: str

class TechStackResponse(BaseModel):
    problem_statement: str
    recommendation: Dict[str, Any]  # Structured JSON recommendations
    explanation: str  # Markdown analysis

class CodeGenerateRequest(BaseModel):
    problem_statement: str
    tech_stack: Dict[str, Any]
    format: str = Field("json", pattern="^(json|zip)$", description="Format can be 'json' or 'zip'")

class CodeGenerateResponse(BaseModel):
    files: Dict[str, str]  # Map of file path to file content

# --- Chat Assistant Schemas ---
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = Field(None, description="Provide session_id to continue a conversation, or leave empty to start a new one")

class ChatMessageResponse(BaseModel):
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    session_id: str
    response: str
    history: List[ChatMessageResponse]

class AdminUserActivitySearch(BaseModel):
    id: int
    query: str
    timestamp: datetime

    class Config:
        from_attributes = True

class AdminUserActivityMessage(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True

class AdminUserActivitySession(BaseModel):
    id: str
    title: Optional[str] = None
    created_at: datetime
    messages: List[AdminUserActivityMessage] = []

    class Config:
        from_attributes = True

class AdminUserActivity(BaseModel):
    user: UserResponse
    searches: List[AdminUserActivitySearch] = []
    chat_sessions: List[AdminUserActivitySession] = []

    class Config:
        from_attributes = True

class UserActivityResponse(BaseModel):
    user: UserResponse
    searches: List[AdminUserActivitySearch] = []
    chat_sessions: List[AdminUserActivitySession] = []

    class Config:
        from_attributes = True
class AdminStatsResponse(BaseModel):
    total_users: int
    total_searches: int
    total_sessions: int
    total_messages: int
    recent_searches: List[Dict[str, Any]]
    recent_users: List[UserResponse]
    all_users_activity: List[AdminUserActivity] = []
