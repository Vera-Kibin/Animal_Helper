import uvicorn
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from asyncpg import connect
from dotenv import load_dotenv

from api.routers import *
from core.config import API_VERSION
from services.quality_scoring import calculate_quality_scores, ensure_scores_table

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

POSTGRESQL_URL = os.getenv('POSTGRESQL_URL')


async def calculate_scores_on_startup():
    """Расчет оценок качества при запуске приложения"""
    try:
        conn = await connect(f"{POSTGRESQL_URL}/schronisko")
        await ensure_scores_table(conn)
        result = await calculate_quality_scores(conn)
        await conn.close()
        print(f"✓ Оценки качества рассчитаны при запуске:")
        print(f"  - Обработано приютов: {result['shelters_processed']}")
        print(f"  - Обработано отзывов: {result['reviews_processed']}")
        print(f"  - Обновлено оценок: {result['scores_updated']}")
    except Exception as e:
        print(f"✗ Ошибка при расчете оценок: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    # Startup
    print("🚀 Запуск приложения...")
    await calculate_scores_on_startup()
    yield
    # Shutdown
    print("👋 Остановка приложения...")


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(prefix=API_VERSION, router=hostels_router)
app.include_router(prefix=API_VERSION, router=comments_router)
app.include_router(prefix=API_VERSION, router=reports_router)

if __name__ == '__main__':
    uvicorn.run(app="main:app", reload=True)
