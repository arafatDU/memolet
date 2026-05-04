from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

class MemoletBase(BaseModel):
    text: str
    weight: Optional[float] = 1.0
    keywords: List[str] = Field(default_factory=list)
    
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    color: Optional[str] = None
    
class MemoletCreate(MemoletBase):
    pass

class MemoletUpdate(BaseModel):
    text: Optional[str] = None
    weight: Optional[float] = None
    keywords: Optional[List[str]] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    color: Optional[str] = None
    
class MemoletResponse(MemoletBase):
    id: uuid.UUID
    conversation_id: Optional[uuid.UUID] = None
    created_at: datetime
    last_accessed_at: datetime
    
    class Config:
        from_attributes = True

class SandboxStateUpdate(BaseModel):
    memolet_updates: List["MemoletUpdateWithId"]

class MemoletUpdateWithId(MemoletUpdate):
    id: uuid.UUID

class OrganizeResponse(BaseModel):
    status: str
    updated: List[MemoletResponse]
