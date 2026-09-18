from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class EnvironmentalMetricBase(BaseModel):
    ndvi: Optional[float] = None
    forest_cover: Optional[float] = None
    carbon_metric: Optional[float] = None
    tree_cover_loss_ha: Optional[float] = None
    aboveground_biomass_density: Optional[float] = None
    data_source: Optional[str] = None
    data_quality: Optional[str] = None


class EnvironmentalMetricCreate(EnvironmentalMetricBase):
    site_id: int
    recorded_at: date
    year: Optional[int] = None


class EnvironmentalMetricResponse(EnvironmentalMetricBase):
    id: int
    site_id: int
    recorded_at: Optional[date] = None
    year: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EnvironmentalHistoryItem(BaseModel):
    year: int
    avg_ndvi: Optional[float] = None
    forest_cover: Optional[float] = None
    tree_cover_loss_ha: Optional[float] = None
    aboveground_biomass_density: Optional[float] = None
    data_source: Optional[str] = None
    data_quality: Optional[str] = None
    record_count: int = 0

    class Config:
        from_attributes = True
