from pydantic import BaseModel
from datetime import date
from typing import Optional


class CommentBase(BaseModel):
    shelter_id: int
    author:     Optional[str]  = None
    rating:     Optional[int]  = None
    comment:    Optional[str]  = None
    created_at: Optional[date] = None


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    author:     Optional[str]  = None
    rating:     Optional[int]  = None
    comment:    Optional[str]  = None
    created_at: Optional[date] = None


class CommentResponse(CommentBase):
    id: int

    class Config:
        from_attributes = True