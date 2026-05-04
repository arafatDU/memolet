from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

class ChatMessageBase(BaseModel):
    role: str
    content: str
    citations: Optional[List[str]] = None

class ChatMessageResponse(ChatMessageBase):
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: Optional[str]
    created_at: datetime
    messages: List[ChatMessageResponse] = []
    
    class Config:
        from_attributes = True

class ConversationListResponse(BaseModel):
    id: uuid.UUID
    title: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
