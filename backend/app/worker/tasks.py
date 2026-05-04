import logging
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.worker.celery_app import celery_app
from app.core.config import settings

# Note: Celery worker needs standalone initialization of services/db
from app.db.session import SessionLocal
from app.db.neo4j import neo4j_connector
from app.models.memolet import Memolet as MemoletModel
from app.services.chunking import chunking_service
from app.services.retrieval import retrieval_service
from app.services.graphrag import graphrag_service

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3)
def process_memory_task(self, messages: list, conversation_id: str, user_id: str):
    """
    Background Task:
    1. Iterate over selected memory pairs.
    2. Summarize each interaction natively.
    3. Generate vector embeddings for each chunk.
    4. Save the chunks to Postgres/NeonDB (pgvector).
    5. Extract concepts and update the Neo4j Graph.
    """
    logger.info(f"Starting structured memory processing for user: {user_id}")
    
    from litellm import completion
    # Determine model dynamically or fallback to groq
    summary_model = "gemini/gemini-2.5-flash" if settings.GEMINI_API_KEY else "groq/llama3-8b-8192"
    
    # 1. Provide standalone DB & Neo4j sessions for worker process
    db = SessionLocal()
    with neo4j_connector.get_session() as neo4j_session:
        try:
            processed_chunks = []
            
            for pair in messages:
                user_msg = pair.get("user", "").strip()
                ai_msg = pair.get("ai", "").strip()
                
                if not user_msg and not ai_msg:
                    continue
                    
                # Summarize the interaction using liteLLM
                summary_prompt = f"Summarize the following interaction concisely in 1-2 short sentences:\nUser: {user_msg}\nAI: {ai_msg}"
                try:
                    response = completion(
                        model=summary_model,
                        messages=[{"role": "user", "content": summary_prompt}],
                        temperature=0.3
                    )
                    summary = response['choices'][0]['message']['content'].strip()
                except Exception as e:
                    logger.error(f"Failed to generate summary: {str(e)}")
                    summary = "Summary unavailable due to LLM error."
                
                # We serialize the full structure into the text field so retrievers have full context
                serialized_text = f"Summary: {summary}\nUser: {user_msg}\nAI: {ai_msg}"
                logger.info(f"Processing structured chunk: {summary[:30]}...")
                
                # Mock NLP logic for keyword extracting
                keywords = [word.strip(".,;:?!") for word in summary.split() if len(word) > 4]
                
                # Embedding creation
                embedding = retrieval_service.encode_text(serialized_text)
                
                # Store in Postgres (Vector DB)
                db_memolet = MemoletModel(
                    conversation_id=conversation_id if conversation_id else None,
                    text=serialized_text,
                    keywords=keywords[:8], 
                    embedding=embedding
                )
                db.add(db_memolet)
                db.commit()
                db.refresh(db_memolet)
                
                # Update GraphRAG (Neo4j)
                try:
                    graphrag_service.add_concepts_to_graph(neo4j_session, db_memolet)
                except Exception as e:
                    logger.error(f"Failed to update Neo4j for memolet {db_memolet.id}: {str(e)}")
                    # Continue anyway, vectors are safely saved
                    
                processed_chunks.append({
                    "id": str(db_memolet.id),
                    "text": summary
                })
                
            return {"status": "success", "processed_chunks": len(processed_chunks)}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error processing memory: {str(e)}")
            # Retry exponentially on fail (e.g. timeout or connection drop)
            raise self.retry(exc=e, countdown=2 ** self.request.retries)
        finally:
            db.close()
