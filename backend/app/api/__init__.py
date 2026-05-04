from fastapi import APIRouter
from app.api.routes import memories, sandbox, chat, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(memories.router, prefix="/memories", tags=["memories"])
api_router.include_router(sandbox.router, prefix="/sandbox", tags=["sandbox"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
