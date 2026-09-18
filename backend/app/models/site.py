from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.database import Base

class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String, nullable=False)
    description = Column(String)
    status = Column(String, default="Active")
    area_hectares = Column(Float)
    
    geometry = Column(Geometry('POLYGON', srid=4326))
    center_latitude = Column(Float)
    center_longitude = Column(Float)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="sites")
    analytics = relationship("EnvironmentalMetric", back_populates="site")
    biodiversity = relationship("BiodiversityObservation", back_populates="site")
