from app.services.retrieval import retrieval_service
from app.services.llm_router import llm_router
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class TrustService:
    def __init__(self):
        pass

    def evaluate_conflict(self, memolets_content: list[str]) -> bool:
        """
        Conflicting Memory Detection: Evaluates retrieved Memolets context. 
        If contradictory, flag conflict warning using a fast LLM pass.
        """
        if not memolets_content or len(memolets_content) < 2:
            return False

        # Build a prompt checking for direct contradictions in the retrieved context
        context_str = "\n---\n".join(memolets_content)
        messages = [
            {"role": "system", "content": "You are a factual analysis bot. Your only job is to evaluate whether the provided statements directly contradict each other. Reply exactly with 'YES' if they hold conflicting facts, or 'NO' if they do not."},
            {"role": "user", "content": f"Contexts:\n{context_str}\n\nDo these statements contradict each other?"}
        ]
        
        response = llm_router.generate_response(messages, temperature=0.0)
        try:
            reply_text = response['choices'][0]['message']['content'].strip().upper()
            return "YES" in reply_text
        except (KeyError, IndexError, AttributeError):
            return False
            
    def compute_confidence_heatmap(self, generated_sentences: list[str], retrieved_contexts: list[str]) -> list[float]:
        """
        Confidence Heatmap: Returns max cosine similarity for each generated sentence 
        compared against the retrieved contexts.
        """
        if not generated_sentences or not retrieved_contexts:
            return [0.0] * len(generated_sentences)
            
        gen_embs = retrieval_service.encoder.encode(generated_sentences)
        ctx_embs = retrieval_service.encoder.encode(retrieved_contexts)
        
        similarity_matrix = cosine_similarity(gen_embs, ctx_embs)
        
        # Max semantic similarity for each generated sentence to any piece of retrieved context
        max_similarities = np.max(similarity_matrix, axis=1)
        
        # Clip precision slightly just to be safe
        scores = [round(float(max(0.0, min(1.0, val))), 2) for val in max_similarities]
        return scores
        
    def trace_citations(self, generated_sentences: list[str], retrieved_contexts: list[str], active_memolet_ids: list[str]) -> list[list[str]]:
        """
        Citation & Traceability: Map each generated sentence to the highest similarity Memolet ID.
        """
        if not generated_sentences or not retrieved_contexts or not active_memolet_ids:
            return [[] for _ in generated_sentences]
            
        gen_embs = retrieval_service.encoder.encode(generated_sentences)
        ctx_embs = retrieval_service.encoder.encode(retrieved_contexts)
        
        similarity_matrix = cosine_similarity(gen_embs, ctx_embs)
        
        citations = []
        for i, row in enumerate(similarity_matrix):
            best_idx = np.argmax(row)
            # Only cite if the semantic similarity is somewhat high (> 0.5 for example) to avoid hallucinated citations
            if row[best_idx] > 0.5:
                # Map back to the corresponding memolet id
                citations.append([active_memolet_ids[best_idx]])
            else:
                citations.append([])
                
        return citations

trust_service = TrustService()
