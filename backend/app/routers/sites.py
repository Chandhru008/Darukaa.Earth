import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.analytics import EnvironmentalMetric
from app.models.biodiversity import BiodiversityObservation
from datetime import datetime, timedelta
import random
from app.models.analytics import EnvironmentalMetric
from app.models.biodiversity import BiodiversityObservation
from datetime import datetime, timedelta
import random
from app.models.site import Site
from app.models.project import Project
from app.schemas.site import SiteCreate, SiteResponse
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(tags=["Sites"])

@router.post("/sites", response_model=SiteResponse)
def create_site(site_in: SiteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify project belongs to user
    project = db.query(Project).filter(Project.id == site_in.project_id, Project.created_by == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Geometry parsing using PostGIS ST_GeomFromGeoJSON
    geojson_str = json.dumps(site_in.geometry)
    
    db_site = Site(
        project_id=site_in.project_id,
        name=site_in.name,
        description=site_in.description,
        status=site_in.status,
        area_hectares=site_in.area_hectares,
        center_latitude=site_in.center_latitude,
        center_longitude=site_in.center_longitude,
        geometry=func.ST_GeomFromGeoJSON(geojson_str)
    )
    db.add(db_site)
    db.commit()
    db.refresh(db_site)
    
    # --- ADD MOCK DATA FOR DEMO ---
    # Generate 12 months of mock environmental metrics
    base_date = datetime.utcnow() - timedelta(days=365)
    for i in range(12):
        month_date = base_date + timedelta(days=30 * i)
        metric = EnvironmentalMetric(
            site_id=db_site.id,
            timestamp=month_date,
            ndvi_score=random.uniform(0.4, 0.85),
            forest_cover_percentage=random.uniform(40.0, 95.0),
            carbon_stock_tonnes=random.uniform(100.0, 500.0) * (site_in.area_hectares or 10.0)
        )
        db.add(metric)
        
    # Generate a few mock biodiversity observations
    species_pool = ['Panthera tigris', 'Elephas maximus', 'Macaca mulatta', 'Pavo cristatus', 'Buceros bicornis']
    for _ in range(5):
        obs = BiodiversityObservation(
            site_id=db_site.id,
            species_name=random.choice(species_pool),
            observation_date=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            latitude=site_in.center_latitude + random.uniform(-0.01, 0.01),
            longitude=site_in.center_longitude + random.uniform(-0.01, 0.01),
            confidence_score=random.uniform(0.7, 0.99)
        )
        db.add(obs)
        
    db.commit()
    # --- END MOCK DATA ---
    
        # Reload with GeoJSON output for geometry
    db_site.geometry = site_in.geometry
    return db_site

@router.get("/projects/{project_id}/sites", response_model=List[SiteResponse])
def get_project_sites(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.created_by == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    sites = db.query(Site, func.ST_AsGeoJSON(Site.geometry).label('geojson')).filter(Site.project_id == project_id).all()
    
    result = []
    for site, geojson_str in sites:
        site_dict = {
            "id": site.id,
            "project_id": site.project_id,
            "name": site.name,
            "description": site.description,
            "status": site.status,
            "area_hectares": site.area_hectares,
            "center_latitude": site.center_latitude,
            "center_longitude": site.center_longitude,
            "created_at": site.created_at,
            "updated_at": site.updated_at,
            "geometry": json.loads(geojson_str) if geojson_str else None
        }
        result.append(site_dict)
    return result

@router.get("/sites/{site_id}", response_model=SiteResponse)
def get_site(site_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    res = db.query(Site, func.ST_AsGeoJSON(Site.geometry).label('geojson')).join(Project).filter(Site.id == site_id, Project.created_by == current_user.id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Site not found")
    site, geojson_str = res
    return {
        "id": site.id,
        "project_id": site.project_id,
        "name": site.name,
        "description": site.description,
        "status": site.status,
        "area_hectares": site.area_hectares,
        "center_latitude": site.center_latitude,
        "center_longitude": site.center_longitude,
        "created_at": site.created_at,
        "updated_at": site.updated_at,
        "geometry": json.loads(geojson_str) if geojson_str else None
    }

@router.get("/sites", response_model=List[SiteResponse])
def get_all_sites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sites = db.query(Site, func.ST_AsGeoJSON(Site.geometry).label('geojson')).join(Project).filter(Project.created_by == current_user.id).all()
    
    result = []
    for site, geojson_str in sites:
        site_dict = {
            "id": site.id,
            "project_id": site.project_id,
            "name": site.name,
            "description": site.description,
            "status": site.status,
            "area_hectares": site.area_hectares,
            "center_latitude": site.center_latitude,
            "center_longitude": site.center_longitude,
            "created_at": site.created_at,
            "updated_at": site.updated_at,
            "geometry": json.loads(geojson_str) if geojson_str else None
        }
        result.append(site_dict)
    return result
