import os

from asyncpg import connect
from fastapi import APIRouter, HTTPException
from aiocache import cached, Cache
from dotenv import load_dotenv
from pathlib import Path

from models.reports import ReportResponse, ReportCreate

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / '.env')

POSTGRESQL_URL = os.getenv('POSTGRESQL_URL')

reports_router = APIRouter()


@cached(ttl=10, cache=Cache.MEMORY)
@reports_router.get("/reports", tags=["Reports"], summary="Get all reports")
async def get_reports():
    conn = await connect(f"{POSTGRESQL_URL}/schronisko")
    records = await conn.fetch('SELECT * FROM reports ORDER BY created_at DESC')
    reports = [ReportResponse(**dict(record)).model_dump() for record in records]
    await conn.close()
    return reports


@reports_router.post("/reports", tags=["Reports"], summary="Create a new report", status_code=201)
async def create_report(report: ReportCreate):
    conn = await connect(f"{POSTGRESQL_URL}/schronisko")
    try:
        record = await conn.fetchrow(
            """
            INSERT INTO reports
                (report_scope, shelter_id, category, severity, title, description,
                 incident_date, latitude, longitude, address, status)
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending_review')
            RETURNING *
            """,
            report.report_scope.value,
            report.shelter_id,
            report.category,
            report.severity.value if report.severity else None,
            report.title,
            report.description,
            report.incident_date,
            report.latitude,
            report.longitude,
            report.address,
        )
        if record is None:
            raise HTTPException(status_code=500, detail="Failed to create report")
        return ReportResponse(**dict(record)).model_dump()
    finally:
        await conn.close()
