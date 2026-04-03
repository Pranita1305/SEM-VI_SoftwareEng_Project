import logging
import os

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "srdapo")

logger = logging.getLogger(__name__)

# Single shared Motor client (created once at module load)
_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=3000,   # fail fast (3 s)
            connectTimeoutMS=3000,
            socketTimeoutMS=5000,
        )
    return _client


def get_database():
    """Return the main database instance."""
    return get_client()[DB_NAME]


def get_user_collection():
    """Return the 'users' collection."""
    return get_database()["users"]


async def is_mongo_available() -> bool:
    """Quick async ping — returns True if MongoDB is reachable."""
    try:
        await get_client().admin.command("ping")
        return True
    except Exception:
        return False

