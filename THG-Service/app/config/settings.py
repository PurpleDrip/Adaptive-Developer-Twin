from pydantic import BaseSettings, AnyUrl

class Settings(BaseSettings):
    neo4j_uri: AnyUrl
    neo4j_user: str
    neo4j_password: str

    app_name: str = "ADT THG Service"
    version: str = "1.0.0"

    class Config:
        env_file = ".env"

settings = Settings()