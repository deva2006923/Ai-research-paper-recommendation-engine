from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import GoogleAuthRequest, UserResponse
from app.auth import verify_google_token, create_access_token

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
