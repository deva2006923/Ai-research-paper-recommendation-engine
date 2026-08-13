from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
import hashlib
import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        if hashed_password.startswith("pbkdf2:"):
            parts = hashed_password.split(":")
            if len(parts) == 3:
                _, salt, original_hash = parts
                check_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
                return check_hash == original_hash
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"Warning: verify_password fallback triggered: {e}", flush=True)
        return False

def get_password_hash(password: str) -> str:
    try:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    except Exception as e:
        print(f"Warning: bcrypt hash failed ({e}), using pbkdf2 fallback", flush=True)
        salt = os.urandom(16).hex()
        hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
        return f"pbkdf2:{salt}:{hashed}"

from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/google", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_google_token(token: str) -> dict:
    # Allow mock tokens for development testing
    if token.startswith("mock_"):
        # expected format: mock_Name_email@domain.com
        parts = token.split("_")
        name = parts[1].replace("-", " ") if len(parts) > 1 else "Mock User"
        email = parts[2] if len(parts) > 2 else "mock@example.com"
        return {
            "sub": f"mock_google_id_{email}",
            "email": email,
            "name": name,
            "picture": f"https://api.dicebear.com/7.x/initials/svg?seed={name}",
            "email_verified": True
        }

    try:
        # Perform live Google ID token verification
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
        return idinfo
    except Exception as e:
        raise ValueError(f"Google ID token verification failed: {str(e)}")

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        if email is None or user_id is None:
            raise credentials_exception
        token_data = TokenData(email=email, user_id=user_id)
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.email != "prakasshdeva876@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Admin access restricted to prakasshdeva876@gmail.com",
        )
    return current_user
