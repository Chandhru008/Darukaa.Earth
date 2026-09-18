from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Date, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.database import Base


class BiodiversityObservation(Base):
    __tablename__ = "biodiversity_observations"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)

    # Species identification
    species_name = Column(String(200), nullable=False)
    scientific_name = Column(String(200))

    # Temporal
    observed_at = Column(Date)
    year = Column(Integer, index=True)  # extracted for fast grouping

    # Measurement values (from BioTIME: sum.allrawdata.ABUNDANCE / BIOMASS)
    abundance = Column(Float)    # observation count / abundance value
    biomass = Column(Float)      # biomass (g/m²) where available

    # Spatial
    location = Column(Geometry('POINT', srid=4326))

    # Provenance
    source = Column(String(100))       # dataset source (e.g. "BioTIME")
    external_id = Column(String(200))  # original record ID to prevent duplicates

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    site = relationship("Site", back_populates="biodiversity")

    __table_args__ = (
        Index("ix_biodiversity_location", "location", postgresql_using="gist"),
        Index("ix_biodiversity_year", "year"),
        Index("ix_biodiversity_external_id", "external_id"),
    )
