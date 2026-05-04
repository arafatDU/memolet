from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str
    
class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
