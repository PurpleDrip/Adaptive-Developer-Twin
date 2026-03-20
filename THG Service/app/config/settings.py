from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Neo4j AuraDB
    neo4j_uri: str = "neo4j+s://xxxxx.databases.neo4j.io"
    neo4j_user: str = "neo4j" 
    neo4j_password: str = "your_aura_password"
    
    # App
    app_name: str = "ADT THG Service"
    version: str = "1.0.0"
    
    class Config:
        env_file = ".env"

settings = Settings()