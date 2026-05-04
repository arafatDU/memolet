from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.memolet import User
from app.schemas.user import AuthResponse, Token, UserCreate, UserResponse, LoginRequest

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    login_data: LoginRequest, db: Session = Depends(deps.get_db)
) -> Any:
    """JSON-based token login. Pass username and password in request body."""
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.username, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=AuthResponse)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """Create a new user and return an access token for immediate login."""
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = User(
        username=user_in.username,
        hashed_password=security.get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.username, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user": user,
    }
