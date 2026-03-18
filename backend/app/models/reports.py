from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from enum import Enum


class ReportScope(str, Enum):
    shelter = "shelter"
    area    = "area"


class Severity(str, Enum):
    low      = "low"
    medium   = "medium"
    high     = "high"
    critical = "critical"


class ReportStatus(str, Enum):
    pending_review = "pending_review"
    in_progress    = "in_progress"
    resolved       = "resolved"
    rejected       = "rejected"


class ReportBase(BaseModel):
    report_scope:  ReportScope
    shelter_id:    Optional[int]          = None
    category:      Optional[str]          = None
    severity:      Optional[Severity]     = None
    title:         Optional[str]          = None
    description:   Optional[str]          = None
    incident_date: Optional[date]         = None
    latitude:      Optional[float]        = None
    longitude:     Optional[float]        = None
    address:       Optional[str]          = None
    status:        Optional[ReportStatus] = ReportStatus.pending_review
    created_at:    Optional[datetime]     = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    category:      Optional[str]          = None
    severity:      Optional[Severity]     = None
    title:         Optional[str]          = None
    description:   Optional[str]          = None
    incident_date: Optional[date]         = None
    latitude:      Optional[float]        = None
    longitude:     Optional[float]        = None
    address:       Optional[str]          = None
    status:        Optional[ReportStatus] = None


class ReportResponse(ReportBase):
    id: int

    class Config:
        from_attributes = True