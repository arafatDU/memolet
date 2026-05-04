from sqlalchemy.orm import Session
from app.models.memolet import Memolet
import datetime

class ReinforcementService:
    DECAY_RATE = 0.05
    REINFORCE_RATE = 0.2

    def __init__(self):
        pass

    def apply_decay(self, db: Session, days_elapsed: int = 1):
        """
        Memory Decay Algorithm
        Unused Memolets fade in priority/weight.
        """
        memolets = db.query(Memolet).all()
        for m in memolets:
            if m.weight is None:
                continue
            # Apply decay function for every day elapsed
            m.weight = m.weight * ((1 - self.DECAY_RATE) ** days_elapsed)
            # Threshold to avoid approaching zero too closely if needed
        db.commit()

    def reinforce_memory(self, db: Session, memolet_id: str):
        """
        Memory Reinforcement Algorithm
        Frequently used 'Memolets' gain priority
        """
        m = db.query(Memolet).filter(Memolet.id == memolet_id).first()
        if m:
            if m.weight is None:
                m.weight = 1.0
            m.weight += self.REINFORCE_RATE
            m.last_accessed_at = datetime.datetime.utcnow()
            db.commit()

reinforcement_service = ReinforcementService()
