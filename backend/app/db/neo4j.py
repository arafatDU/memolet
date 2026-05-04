import os
from neo4j import GraphDatabase
from fastapi import Request

from app.core.config import settings

class Neo4jConnector:
    def __init__(self, uri, username, password):
        self.driver = GraphDatabase.driver(uri, auth=(username, password))

    def close(self):
        self.driver.close()

    def get_session(self):
        return self.driver.session()

neo4j_connector = Neo4jConnector(
    uri=settings.NEO4J_URI,
    username=settings.NEO4J_USERNAME,
    password=settings.NEO4J_PASSWORD
)

def get_neo4j():
    session = neo4j_connector.get_session()
    try:
        yield session
    finally:
        session.close()
