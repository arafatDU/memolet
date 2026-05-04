from sqlalchemy.orm import Session
from app.models.memolet import Memolet
import numpy as np

class GraphRAGService:
    def __init__(self):
        pass
        
    def add_concepts_to_graph(self, neo4j_session, memolet: Memolet):
        """
        Converts the memolet into concept nodes and relations and updates the Neo4j graph.
        """
        query = '''
        MERGE (m:Memolet {id: $id})
        SET m.text = $text
        WITH m
        UNWIND $keywords AS kw
        MERGE (k:Concept {name: kw})
        MERGE (m)-[:HAS_CONCEPT]->(k)
        '''
        neo4j_session.run(query, id=str(memolet.id), text=memolet.text, keywords=memolet.keywords or [])

    def retrieve_context_subgraph(self, neo4j_session, query_keywords: list[str]):
        """
        Retrieves local neighborhood around the matched keywords.
        """
        query = '''
        MATCH (k:Concept)-[:HAS_CONCEPT]-(m:Memolet)
        WHERE k.name IN $keywords
        RETURN m.id AS memolet_id, collect(k.name) as concepts, m.text as string_content
        '''
        result = neo4j_session.run(query, keywords=query_keywords)
        return [record.data() for record in result]

graphrag_service = GraphRAGService()
