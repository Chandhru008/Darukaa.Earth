from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String)
    project_type = Column(String, nullable=False)
    region = Column(String, nullable=False)
    status = Column(String, default="Draft")
    start_date = Column(Date)
    end_date = Column(Date)
    
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="projects")
    sites = relationship("Site", back_populates="project")
