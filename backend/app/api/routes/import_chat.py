import logging
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.db.session import get_db
from app.models.memolet import User
from app.services.chat_importer_service import chat_importer_service

logger = logging.getLogger(__name__)
router = APIRouter()

class TurnPair(BaseModel):
    user: str
    ai: str

class PreviewRequest(BaseModel):
    url: Optional[str] = None
    text: Optional[str] = None

class PreviewResponse(BaseModel):
    title: str
    source: str
    turns: List[TurnPair]
    total_turns: int

class CommitRequest(BaseModel):
    title: Optional[str] = None
    turns: List[TurnPair]
    create_conversation: bool = True
    save_to_memory: bool = True
    generate_ai_summary: bool = False

class CommitResponse(BaseModel):
    conversation_id: Optional[str] = None
    title: Optional[str] = None
    total_turns: int
    saved_memolets_count: int
    saved_memolets: List[dict] = []

@router.post("/preview", response_model=PreviewResponse)
def preview_chat_import(
    req: PreviewRequest,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Parses either a public share link (via Jina Reader) or raw pasted transcript text.
    Returns structured turn pairs for user preview with ZERO LLM API calls.
    """
    if not req.url and not req.text:
        raise HTTPException(status_code=400, detail="Either 'url' or 'text' must be provided.")

    title = "Imported Conversation"
    source = "clipboard"
    raw_markdown = ""

    turns_data = []
    if req.url and req.url.strip():
        source = "share_link"
        try:
            fetch_result = chat_importer_service.fetch_share_link(req.url)
            title = fetch_result.get("title", title)
            if "turns" in fetch_result and fetch_result["turns"]:
                turns_data = fetch_result["turns"]
            else:
                raw_markdown = fetch_result.get("raw_text", "")
        except Exception as e:
            logger.error(f"Error fetching share link: {e}")
            raise HTTPException(status_code=400, detail=f"Could not fetch share link: {str(e)}")
    elif req.text and req.text.strip():
        raw_markdown = req.text.strip()
        # Derive title from first line or default
        lines = [l.strip() for l in raw_markdown.splitlines() if l.strip()]
        if lines:
            title = lines[0][:40]

    if not turns_data:
        turns_data = chat_importer_service.parse_turns_from_text(raw_markdown)

    if not turns_data:
        raise HTTPException(
            status_code=422,
            detail="Could not detect conversation turns. Please ensure the text or link contains User and AI messages."
        )

    return PreviewResponse(
        title=title,
        source=source,
        turns=[TurnPair(user=t["user"], ai=t["ai"]) for t in turns_data],
        total_turns=len(turns_data)
    )

@router.post("/commit", response_model=CommitResponse)
def commit_chat_import(
    req: CommitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Commits reviewed turns into PostgreSQL:
    1. Creates a Conversation thread (so user can continue the 11th turn immediately).
    2. Indexes turns into Long-Term Memory (Postgres pgvector + Neo4j GraphRAG with user isolation).
    """
    if not req.turns:
        raise HTTPException(status_code=400, detail="No turns provided to import.")

    turns_list = [{"user": t.user, "ai": t.ai} for t in req.turns]

    try:
        result = chat_importer_service.commit_imported_chat(
            db=db,
            current_user=current_user,
            title=req.title,
            turns=turns_list,
            create_conversation=req.create_conversation,
            save_to_memory=req.save_to_memory,
            generate_ai_summary=req.generate_ai_summary,
        )
        return CommitResponse(**result)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to commit chat import: {e}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
