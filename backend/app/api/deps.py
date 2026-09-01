from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.memolet import User
from app.schemas.user import TokenData

from app.services.clerk_auth import clerk_auth_service

bearer_scheme = HTTPBearer(auto_error=True)

def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = credentials.credentials

    # 1. First try Clerk RS256 token verification
    clerk_payload = clerk_auth_service.verify_token(token)
    if clerk_payload:
        clerk_user_id = clerk_payload.get("sub")
        if clerk_user_id:
            user = clerk_auth_service.get_or_sync_user(db, clerk_user_id, claims=clerk_payload)
            if user:
                return user

    # 2. Fallback to local HS256 JWT verification (for backwards compatibility)
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=["HS256"]
        )
        username: str = payload.get("sub")
        if username:
            user = db.query(User).filter(User.username == username).first()
            if user:
                return user
    except JWTError:
        pass

    raise credentials_exception

