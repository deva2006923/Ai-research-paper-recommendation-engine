from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, ChatSession
from app.schemas import GoogleAuthRequest, UserResponse, UserSignup, UserLogin, UserActivityResponse
from app.auth import verify_google_token, create_access_token, get_password_hash, verify_password, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/google")
async def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        # 1. Verify token
        idinfo = verify_google_token(payload.token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # 2. Extract user details
    email = idinfo.get("email")
    name = idinfo.get("name", "Google User")
    picture = idinfo.get("picture")
    google_id = idinfo.get("sub")
    
    if not email or not google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incomplete user profile returned by Google OAuth."
        )

    # 3. Check if user exists, otherwise create
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        # Check by email to link accounts if necessary
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_id = google_id
            if picture:
                user.picture = picture
        else:
            user = User(
                email=email,
                name=name,
                picture=picture,
                google_id=google_id
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
    else:
        # Update user's name/picture if changed on Google
        user.name = name
        if picture:
            user.picture = picture
        db.commit()
        db.refresh(user)

    # 4. Create access token
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.post("/signup")
async def signup(payload: UserSignup, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )
    
    hashed_password = get_password_hash(payload.password)
    
    new_user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(
        data={"sub": new_user.email, "user_id": new_user.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(new_user)
    }

@router.post("/login")
async def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.get("/me/activity", response_model=UserActivityResponse)
async def get_my_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the currently authenticated user's own search history and chat sessions.
    """
    from sqlalchemy.orm import joinedload
    
    # Reload user with related data
    user_with_activity = db.query(User).options(
        joinedload(User.searches),
        joinedload(User.chat_sessions).joinedload(ChatSession.messages)
    ).filter(User.id == current_user.id).first()
    
    if not user_with_activity:
        raise HTTPException(status_code=404, detail="User not found")
        
    return UserActivityResponse(
        user=UserResponse.model_validate(user_with_activity),
        searches=user_with_activity.searches,
        chat_sessions=user_with_activity.chat_sessions
    )
