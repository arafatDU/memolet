from sqlalchemy.orm import Session
from app.models.memolet import Memolet
import numpy as np

class GraphRAGService:
    def __init__(self):
        pass
        
    def add_concepts_to_graph(self, neo4j_session, memolet: Memolet, user_id: str = None):
        """
        Converts the memolet into concept nodes and relations and updates the Neo4j graph with user_id ownership.
        """
        uid = str(user_id) if user_id else (str(memolet.user_id) if getattr(memolet, 'user_id', None) else None)
        query = '''
        MERGE (m:Memolet {id: $id})
        SET m.text = $text, m.user_id = $user_id
        WITH m
        UNWIND $keywords AS kw
        MERGE (k:Concept {name: kw})
        MERGE (m)-[:HAS_CONCEPT]->(k)
        '''
        neo4j_session.run(query, id=str(memolet.id), text=memolet.text, keywords=memolet.keywords or [], user_id=uid)

    def retrieve_context_subgraph(self, neo4j_session, query_keywords: list[str], user_id: str = None):
        """
        Retrieves local neighborhood around the matched keywords, filtered to the specific user.
        """
        uid = str(user_id) if user_id else None
        query = '''
        MATCH (k:Concept)-[:HAS_CONCEPT]-(m:Memolet)
        WHERE k.name IN $keywords AND ($user_id IS NULL OR m.user_id = $user_id)
        RETURN m.id AS memolet_id, collect(k.name) as concepts, m.text as string_content
        '''
        result = neo4j_session.run(query, keywords=query_keywords, user_id=uid)
        return [record.data() for record in result]

graphrag_service = GraphRAGService()
