import uuid
from typing import List, Optional
from pydantic import BaseModel, Field


class MemoletBase(BaseModel):
    text: str
    weight: Optional[float] = 1.0
    keywords: List[str] = Field(default_factory=list)
    color: Optional[str] = None


class MemoletCreate(MemoletBase):
    pass


class ChatIngestRequest(BaseModel):
    conversation_id: Optional[uuid.UUID] = None
    chat_log: str


class Memolet(MemoletBase):
    id: uuid.UUID

    class Config:
        from_attributes = True

