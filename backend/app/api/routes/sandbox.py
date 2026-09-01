from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid

from app.api import deps
from app.db.session import get_db
from app.models.memolet import User, Memolet
from app.schemas.sandbox import SandboxStateUpdate, MemoletResponse
from app.services.sandbox_service import sandbox_service

router = APIRouter()

@router.get("/state", response_model=List[MemoletResponse])
def get_sandbox_state(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Retrieve all memolets to display on the canvas/sandbox with their positions."""
    memolets = db.query(Memolet).filter(
        (Memolet.user_id == current_user.id) |
        (Memolet.conversation.has(user_id=current_user.id))
    ).all()
    return memolets

@router.post("/state", response_model=List[MemoletResponse])
def update_sandbox_state(
    update_req: SandboxStateUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Save the exact X/Y positions, dimensions, and weights for an array of memolets."""
    updated_memolets = []
    
    for update in update_req.memolet_updates:
        db_memolet = db.query(Memolet).filter(
            Memolet.id == update.id,
            (Memolet.user_id == current_user.id) | (Memolet.conversation.has(user_id=current_user.id))
        ).first()
        
        if not db_memolet:
            continue
            
        if update.pos_x is not None:
            db_memolet.pos_x = update.pos_x
        if update.pos_y is not None:
            db_memolet.pos_y = update.pos_y
        if update.width is not None:
            db_memolet.width = update.width
        if update.height is not None:
            db_memolet.height = update.height
        if update.weight is not None:
            db_memolet.weight = update.weight
        if update.color is not None:
            db_memolet.color = update.color
            
        updated_memolets.append(db_memolet)
        
    db.commit()
    for m in updated_memolets:
        db.refresh(m)
        
    return updated_memolets

@router.post("/auto-organize", response_model=Dict[str, Any])
def auto_organize(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Trigger KMeans and Voronoi logic to cluster scattered Memolets automatically."""
    memolets = db.query(Memolet).filter(
        (Memolet.user_id == current_user.id) |
        (Memolet.conversation.has(user_id=current_user.id))
    ).all()
    
    if not memolets:
        raise HTTPException(status_code=400, detail="No memolets to organize")
        
    organized_memolets = sandbox_service.organize_memolets(db, memolets, n_clusters=min(3, len(memolets)))
    
    return {
        "status": "success", 
        "updated": [{"id": str(m.id), "pos_x": m.pos_x, "pos_y": m.pos_y, "color": m.color} for m in organized_memolets]
    }

@router.post("/context-weights")
def context_weighting(
    memolet_ids: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Calculate and return dictated prompt weights based on layout configuration."""
    valid_ids = [uuid.UUID(mid) for mid in memolet_ids]
    memolets = db.query(Memolet).filter(
        Memolet.id.in_(valid_ids),
        (Memolet.user_id == current_user.id) | (Memolet.conversation.has(user_id=current_user.id))
    ).all()
        
    weights = sandbox_service.calculate_prompt_weights(memolets)
    result = {str(m.id): w for m, w in zip(memolets, weights)}
    
    return {"weights": result}
