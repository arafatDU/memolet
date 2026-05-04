from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
import numpy as np

class RetrievalService:
    def __init__(self):
        # We will load embedding models lazily or globally
        self.encoder = SentenceTransformer("all-MiniLM-L6-v2")

    def encode_text(self, text: str) -> list[float]:
        return self.encoder.encode(text).tolist()

    def hybrid_search(self, query: str, document_texts: list[str], document_embeddings: np.ndarray, alpha: float = 0.5):
        """
        Combines BM25 with Vector Search
        """
        if not document_texts:
            return []
            
        tokenized_corpus = [doc.split(" ") for doc in document_texts]
        bm25 = BM25Okapi(tokenized_corpus)
        tokenized_query = query.split(" ")
        bm25_scores = bm25.get_scores(tokenized_query)

        query_emb = self.encoder.encode(query)
        # Cosine similarity for vectors if document_embeddings present
        # Assuming normalized embeddings -> dot product
        if document_embeddings is not None and len(document_embeddings) > 0:
            vector_scores = np.dot(document_embeddings, query_emb)
            
            # Min-Max Normalization
            if np.max(bm25_scores) > 0:
                bm25_scores = (bm25_scores - np.min(bm25_scores)) / (np.max(bm25_scores) - np.min(bm25_scores) + 1e-9)
            if np.max(vector_scores) > 0:
                vector_scores = (vector_scores - np.min(vector_scores)) / (np.max(vector_scores) - np.min(vector_scores) + 1e-9)
                
            hybrid_scores = (alpha * vector_scores) + ((1 - alpha) * bm25_scores)
            return hybrid_scores.tolist()
            
        return bm25_scores.tolist()

retrieval_service = RetrievalService()
