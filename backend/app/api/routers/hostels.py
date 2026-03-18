import os

from asyncpg import connect
from fastapi import APIRouter
from aiocache import cached, Cache
from dotenv import load_dotenv
from pathlib import Path

from models.shelters import ShelterResponse

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / '.env')

POSTGRESQL_URL = os.getenv('POSTGRESQL_URL')

hostels_router = APIRouter()


@cached(ttl=10, cache=Cache.MEMORY)
@hostels_router.get("/hostels", tags=["Hostels"], summary="Get all animal hostels",
                    description="Returns a list of all animal hostels in the system.")
async def get_hostels():
    conn = await connect(f"{POSTGRESQL_URL}/schronisko")
    records = await conn.fetch(
        'SELECT * FROM shelters')
    shelters = [ShelterResponse(**dict(record)).model_dump() for record in records]
    await conn.close()
    return shelters
