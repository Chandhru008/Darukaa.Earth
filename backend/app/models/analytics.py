from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, Date, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class EnvironmentalMetric(Base):
    __tablename__ = "environmental_metrics"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)

    # Temporal
    recorded_at = Column(Date, nullable=False)
    year = Column(Integer, index=True)  # extracted for fast grouping

    # Vegetation / NDVI (source: MODIS MOD13Q1 or equivalent)
    ndvi = Column(Float)          # Normalized Difference Vegetation Index (-1 to 1)

    # Forest metrics (source: Global Forest Data 2001-2022)
    forest_cover = Column(Float)             # Forest cover percentage (%)
    tree_cover_loss_ha = Column(Float)       # Annual tree cover loss (hectares)
    aboveground_biomass_density = Column(Float)  # tC/ha where available

    # Legacy carbon metric column (kept for backward compat, always NULL unless real data)
    carbon_metric = Column(Float)

    # Provenance — critical for transparency
    data_source = Column(String(200))   # e.g. "MODIS MOD13Q1", "Global Forest Data 2001-2022"
    data_quality = Column(String(50))   # "measured" | "modelled" | "estimated" | "national_aggregate"

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    site = relationship("Site", back_populates="analytics")

    __table_args__ = (
        Index("ix_env_metrics_year", "year"),
        Index("ix_env_metrics_site_year", "site_id", "year"),
    )
