from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    import bcrypt
    try:
        # Fallback to bcrypt directly to bypass passlib 1.7.4 bug with bcrypt 4.0+
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        # Fallback back to passlib if format differs
        return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    import bcrypt
    # Hash directly using bcrypt to avoid passlib 1.7.4 __about__ attribute error with bcrypt 4.0+
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_bytes.decode('utf-8')

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt
