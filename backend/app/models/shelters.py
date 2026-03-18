from pydantic import BaseModel, EmailStr, HttpUrl
from datetime import date
from typing import Optional


class ShelterBase(BaseModel):
    id: int
    name: str
    city: str
    address: str
    latitude: float
    longitude: float
    phone_1: Optional[str] = None
    phone_2: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[HttpUrl] = None
    social_media: Optional[str] = None
    operator_name: Optional[str] = None
    operator_type: Optional[str] = None
    owner: Optional[str] = None
    nip: Optional[str] = None
    krs: Optional[str] = None
    license_status: Optional[str] = None
    veterinary_supervision: Optional[str] = None
    municipality_cooperation: Optional[str] = None
    accepted_dogs: bool = False
    accepted_cats: bool = False
    accepted_other: bool = False
    public_access: Optional[str] = None
    public_access_notes: Optional[str] = None
    volunteering: bool = False
    transparency_level: Optional[str] = None
    last_verified: Optional[date] = None


class ShelterCreate(ShelterBase):
    """Для POST запросов — создание нового приюта"""
    pass


class ShelterUpdate(BaseModel):
    """Для PATCH запросов — обновление (все поля опциональны)"""
    name: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone_1: Optional[str] = None
    phone_2: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[HttpUrl] = None
    social_media: Optional[str] = None
    operator_name: Optional[str] = None
    operator_type: Optional[str] = None
    owner: Optional[str] = None
    nip: Optional[str] = None
    krs: Optional[str] = None
    license_status: Optional[str] = None
    veterinary_supervision: Optional[str] = None
    municipality_cooperation: Optional[str] = None
    accepted_dogs: Optional[bool] = None
    accepted_cats: Optional[bool] = None
    accepted_other: Optional[bool] = None
    public_access: Optional[str] = None
    public_access_notes: Optional[str] = None
    volunteering: Optional[bool] = None
    transparency_level: Optional[str] = None
    last_verified: Optional[date] = None


class ShelterResponse(ShelterBase):
    """Для GET запросов — ответ с id из БД"""
    id: int

    class Config:
        from_attributes = True
