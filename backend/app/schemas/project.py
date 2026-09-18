from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    project_type: str
    region: str
    status: str = "Draft"
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
