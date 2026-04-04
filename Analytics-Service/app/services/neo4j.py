from neo4j import AsyncGraphDatabase
import os

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

_driver = None

async def init_neo4j():
    global _driver
    _driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

async def get_neo4j_session():
    if not _driver:
        raise Exception("Neo4j not initialized")
    async with _driver.session() as session:
        yield session

async def close_neo4j():
    global _driver
    if _driver:
        await _driver.close()