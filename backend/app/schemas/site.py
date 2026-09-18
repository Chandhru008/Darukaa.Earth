from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class SiteBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "Active"
    area_hectares: Optional[float] = None
    center_latitude: Optional[float] = None
    center_longitude: Optional[float] = None

class SiteCreate(SiteBase):
    project_id: int
    # We expect GeoJSON dict, e.g. {"type": "Polygon", "coordinates": [[[lon, lat]]]}
    # In Pydantic we can just take it as Any or Dict
    geometry: Any 

class SiteResponse(SiteBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    geometry: Any # We will return GeoJSON

    class Config:
        from_attributes = True
