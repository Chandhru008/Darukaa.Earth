from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.project import Project
from app.models.site import Site
from app.models.analytics import EnvironmentalMetric
from app.models.biodiversity import BiodiversityObservation
from app.schemas.project import ProjectCreate, ProjectResponse
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_project = Project(**project.model_dump(), created_by=current_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Project).filter(Project.created_by == current_user.id).all()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.created_by == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.created_by == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    site_ids = [s.id for s in project.sites]
    if site_ids:
        db.query(EnvironmentalMetric).filter(EnvironmentalMetric.site_id.in_(site_ids)).delete(synchronize_session=False)
        db.query(BiodiversityObservation).filter(BiodiversityObservation.site_id.in_(site_ids)).delete(synchronize_session=False)
        db.query(Site).filter(Site.project_id == project_id).delete(synchronize_session=False)
        
    db.delete(project)
    db.commit()
    return None

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.created_by == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    site_ids = [site.id for site in project.sites]
    
    if site_ids:
        db.query(EnvironmentalMetric).filter(EnvironmentalMetric.site_id.in_(site_ids)).delete(synchronize_session=False)
        db.query(BiodiversityObservation).filter(BiodiversityObservation.site_id.in_(site_ids)).delete(synchronize_session=False)
        db.query(Site).filter(Site.project_id == project_id).delete(synchronize_session=False)
        
    db.delete(project)
    db.commit()
    return None
