import io
import uuid
import zipfile
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User, ChatSession, ChatMessage
from app.schemas import DifferentiateRequest, DifferentiateResponse, TechStackRequest, TechStackResponse, CodeGenerateRequest, CodeGenerateResponse, ChatRequest, ChatResponse, ChatMessageResponse
from app.services.llm_service import get_differentiation_suggestions, get_tech_stack_recommendation, generate_code_scaffold, get_chat_response

router = APIRouter(tags=["AI Features & Assistant"])

@router.post("/differentiate", response_model=DifferentiateResponse)
async def differentiate(
    payload: DifferentiateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate product differentiation suggestions using Gemini LLM,
    based on the problem statement, relevant research papers, and current repositories.
    Requires authentication.
    """
    try:
        data = await get_differentiation_suggestions(
            problem_statement=payload.problem_statement,
            papers=payload.papers,
            repos=payload.repos
        )
        return DifferentiateResponse(
            existing_landscape_summary=data.get("existing_landscape_summary", "N/A"),
            identified_gap=data.get("identified_gap", "N/A"),
            why_this_gap_exists=data.get("why_this_gap_exists", "N/A"),
            suggested_product_direction=data.get("suggested_product_direction", {
                "title": "N/A", "description": "N/A", "feasibility_score": 0, "justification": "N/A"
            }),
            suggestions=data.get("suggestions", "")
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate differentiation suggestions: {str(e)}"
        )

@router.post("/tech-stack", response_model=TechStackResponse)
async def tech_stack(
    payload: TechStackRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Recommend a software architecture and tech stack based on a problem statement.
    Requires authentication.
    """
    try:
        data = await get_tech_stack_recommendation(payload.problem_statement)
        recommendation = data.get("recommendation", {})
        explanation = data.get("explanation", "")
        if isinstance(explanation, dict):
            explanation_md = ""
            for k, v in explanation.items():
                explanation_md += f"### {k.replace('_', ' ').title()}\n{str(v)}\n\n"
            explanation = explanation_md
        elif not isinstance(explanation, str):
            explanation = str(explanation)
            
        return TechStackResponse(
            problem_statement=payload.problem_statement,
            recommendation=recommendation,
            explanation=explanation
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate tech stack recommendation: {str(e)}"
        )

@router.post("/generate-code")
async def generate_code(
    payload: CodeGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a starter code scaffold.
    Returns either a JSON structure mapping file paths to file contents,
    or a downloadable zip archive containing the directory structure.
    Requires authentication.
    """
    try:
        files = await generate_code_scaffold(
            problem_statement=payload.problem_statement,
            tech_stack=payload.tech_stack
        )
        
        if payload.format == "zip":
            zip_io = io.BytesIO()
            with zipfile.ZipFile(zip_io, "w", zipfile.ZIP_DEFLATED) as zip_file:
                created_dirs = set()
                for file_path, file_content in files.items():
                    file_path = file_path.replace("\\", "/")
                    parts = file_path.split("/")
                    for i in range(1, len(parts)):
                        dir_path = "/".join(parts[:i]) + "/"
                        if dir_path not in created_dirs:
                            zinfo = zipfile.ZipInfo(dir_path)
                            zip_file.writestr(zinfo, "")
                            created_dirs.add(dir_path)
                    zip_file.writestr(file_path, str(file_content))
            zip_io.seek(0)
            
            clean_name = "".join(c for c in payload.problem_statement if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")[:30]
            filename = f"{clean_name or 'scaffold'}_scaffold.zip"
            
            return StreamingResponse(
                zip_io,
                media_type="application/zip",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        else:
            files_str = {str(k): str(v) for k, v in files.items()}
            return CodeGenerateResponse(files=files_str)
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate code scaffold: {str(e)}"
        )

@router.post("/assistant/chat", response_model=ChatResponse)
async def assistant_chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Multi-turn AI Assistant Chat endpoint.
    Maintains user conversation history in the database per session.
    If session_id is not provided, a new session is initialized.
    Requires authentication.
    """
    try:
        session_id = payload.session_id
        
        # 1. Fetch or create chat session
        if not session_id:
            session_id = str(uuid.uuid4())
            title = payload.message[:30] + "..." if len(payload.message) > 30 else payload.message
            session = ChatSession(id=session_id, user_id=current_user.id, title=title)
            db.add(session)
            db.commit()
        else:
            session = db.query(ChatSession).filter(
                ChatSession.id == session_id,
                ChatSession.user_id == current_user.id
            ).first()
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat session not found or does not belong to this user."
                )

        # 2. Retrieve session message history
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in session.messages
        ]

        # 3. Call LLM service to get the response
        response_text = await get_chat_response(history, payload.message)

        # 4. Save both new messages to the database
        user_message = ChatMessage(session_id=session_id, role="user", content=payload.message)
        assistant_message = ChatMessage(session_id=session_id, role="assistant", content=response_text)
        db.add(user_message)
        db.add(assistant_message)
        db.commit()

        # 5. Fetch updated messages list and return
        db.refresh(session)
        updated_history = [
            ChatMessageResponse.model_validate(msg)
            for msg in session.messages
        ]

        return ChatResponse(
            session_id=session_id,
            response=response_text,
            history=updated_history
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate assistant response: {str(e)}"
        )



