import re
from typing import List, Dict

class ChunkingService:
    def __init__(self):
        pass

    def clean_log(self, text: str) -> str:
        # Step1: Strip whitespace, normalize newlines
        cleaned = re.sub(r'\n+', '\n', text.strip())
        return cleaned

    def chunk_into_concepts(self, chat_log: str) -> List[Dict[str, str]]:
        """
        Dynamically chunk text into logical concepts.
        For MVP, we split by paragraphs or double newlines,
        and optionally run an offline fast model for summarization.
        """
        cleaned = self.clean_log(chat_log)
        
        # naive paragraph splitting for now
        paragraphs = cleaned.split('\n')
        chunks = []
        for p in paragraphs:
            if p.strip():
                chunks.append({"text": p.strip()})
        return chunks

chunking_service = ChunkingService()
