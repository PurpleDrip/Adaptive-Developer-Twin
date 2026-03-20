from neo4j import AsyncGraphDatabase
from contextlib import asynccontextmanager
from app.config.settings import settings
from typing import AsyncGenerator

_driver = None

async def init_neo4j():
    global _driver
    _driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri, 
        auth=(settings.neo4j_user, settings.neo4j_password)
    )

@asynccontextmanager
async def get_neo4j_session() -> AsyncGenerator:
    if not _driver:
        raise Exception("Neo4j driver not initialized")
    async with _driver.session() as session:
        yield session

async def close_neo4j():
    global _driver
    if _driver:
        await _driver.close()