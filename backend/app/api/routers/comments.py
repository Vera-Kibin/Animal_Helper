import os

from asyncpg import connect
from fastapi import APIRouter
from aiocache import cached, Cache
from dotenv import load_dotenv
from pathlib import Path

from models.comments import CommentResponse

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / '.env')

POSTGRESQL_URL = os.getenv('POSTGRESQL_URL')

comments_router = APIRouter()


@cached(ttl=10, cache=Cache.MEMORY)
@comments_router.get("/comments/{shelter_id}", tags=["Comments"], summary="Get all comments")
async def get_comments(shelter_id: int):
    conn = await connect(f"{POSTGRESQL_URL}/schronisko")
    records = await conn.fetch(
        'SELECT * FROM comments WHERE shelter_id = $1', shelter_id)
    shelters = [CommentResponse(**dict(record)).model_dump() for record in records]
    await conn.close()
    return shelters
