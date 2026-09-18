from pydantic import BaseModel
from typing import Optional, Any
from datetime import date, datetime


class BiodiversityObservationBase(BaseModel):
    species_name: str
    scientific_name: Optional[str] = None
    source: Optional[str] = None
    abundance: Optional[float] = None
    biomass: Optional[float] = None


class BiodiversityObservationCreate(BiodiversityObservationBase):
    site_id: int
    observed_at: Optional[date] = None
    year: Optional[int] = None
    location: Any  # GeoJSON point
    external_id: Optional[str] = None


class BiodiversityObservationResponse(BiodiversityObservationBase):
    id: int
    site_id: int
    observed_at: Optional[date] = None
    year: Optional[int] = None
    location: Optional[Any] = None  # GeoJSON point
    external_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BiodiversityHistoryItem(BaseModel):
    year: int
    species_count: int
    total_observations: int
    avg_abundance: Optional[float] = None
    avg_biomass: Optional[float] = None

    class Config:
        from_attributes = True
