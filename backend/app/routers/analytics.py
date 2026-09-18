import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from app.database import get_db
from app.models.analytics import EnvironmentalMetric
from app.models.biodiversity import BiodiversityObservation
from app.models.site import Site
from app.models.project import Project
from app.schemas.analytics import (
    EnvironmentalMetricCreate, EnvironmentalMetricResponse,
    EnvironmentalHistoryItem
)
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(tags=["Analytics"])


@router.post("/analytics", response_model=EnvironmentalMetricResponse)
def create_analytics(
    metric_in: EnvironmentalMetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    site = db.query(Site).join(Project).filter(
        Site.id == metric_in.site_id, Project.created_by == current_user.id
    ).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    data = metric_in.model_dump()
    if data.get("recorded_at") and not data.get("year"):
        data["year"] = data["recorded_at"].year

    db_metric = EnvironmentalMetric(**data)
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    return db_metric


@router.get("/sites/{site_id}/analytics", response_model=List[EnvironmentalMetricResponse])
def get_site_analytics(
    site_id: int,
    year_from: Optional[int] = Query(None),
    year_to: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    site = db.query(Site).join(Project).filter(
        Site.id == site_id, Project.created_by == current_user.id
    ).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    q = db.query(EnvironmentalMetric).filter(EnvironmentalMetric.site_id == site_id)
    if year_from:
        q = q.filter(EnvironmentalMetric.year >= year_from)
    if year_to:
        q = q.filter(EnvironmentalMetric.year <= year_to)

    return q.order_by(EnvironmentalMetric.recorded_at.asc()).all()


@router.get("/sites/{site_id}/analytics/history")
def get_site_analytics_history(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns yearly aggregated analytics for a site.
    Only includes years where actual data exists — never fabricates values.
    """
    site = db.query(Site).join(Project).filter(
        Site.id == site_id, Project.created_by == current_user.id
    ).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    rows = db.execute(text("""
        SELECT
            year,
            AVG(ndvi)                      AS avg_ndvi,
            AVG(forest_cover)              AS avg_forest_cover,
            AVG(tree_cover_loss_ha)        AS avg_tree_cover_loss_ha,
            AVG(aboveground_biomass_density) AS avg_biomass_density,
            COUNT(*)                       AS record_count,
            MAX(data_source)               AS data_source,
            MAX(data_quality)              AS data_quality
        FROM environmental_metrics
        WHERE site_id = :site_id AND year IS NOT NULL
        GROUP BY year
        ORDER BY year ASC
    """), {"site_id": site_id}).fetchall()

    return [
        {
            "year": r.year,
            "avg_ndvi": round(float(r.avg_ndvi), 4) if r.avg_ndvi is not None else None,
            "forest_cover": round(float(r.avg_forest_cover), 2) if r.avg_forest_cover is not None else None,
            "tree_cover_loss_ha": round(float(r.avg_tree_cover_loss_ha), 2) if r.avg_tree_cover_loss_ha is not None else None,
            "aboveground_biomass_density": round(float(r.avg_biomass_density), 2) if r.avg_biomass_density is not None else None,
            "record_count": r.record_count,
            "data_source": r.data_source,
            "data_quality": r.data_quality,
        }
        for r in rows
    ]


@router.get("/sites/{site_id}/summary")
def get_site_summary(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Combined endpoint: site info + latest metrics + biodiversity counts.
    Used by the site detail page for a single efficient API call.
    """
    site = db.query(Site).join(Project).filter(
        Site.id == site_id, Project.created_by == current_user.id
    ).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    project = db.query(Project).filter(Project.id == site.project_id).first()

    # Latest environmental metric
    latest_metric = db.query(EnvironmentalMetric).filter(
        EnvironmentalMetric.site_id == site_id,
        EnvironmentalMetric.ndvi.isnot(None)
    ).order_by(EnvironmentalMetric.recorded_at.desc()).first()

    # Biodiversity counts
    bio_stats = db.execute(text("""
        SELECT
            COUNT(*) AS total_observations,
            COUNT(DISTINCT species_name) AS unique_species,
            MIN(year) AS first_year,
            MAX(year) AS last_year
        FROM biodiversity_observations
        WHERE site_id = :site_id
    """), {"site_id": site_id}).fetchone()

    # Year range for environmental data
    env_years = db.execute(text("""
        SELECT MIN(year), MAX(year) FROM environmental_metrics WHERE site_id = :site_id
    """), {"site_id": site_id}).fetchone()

    return {
        "site": {
            "id": site.id,
            "name": site.name,
            "description": site.description,
            "status": site.status,
            "area_hectares": site.area_hectares,
            "center_latitude": site.center_latitude,
            "center_longitude": site.center_longitude,
            "created_at": site.created_at.isoformat() if site.created_at else None,
        },
        "project": {
            "id": project.id if project else None,
            "name": project.name if project else None,
            "region": project.region if project else None,
        },
        "latest_env_metric": {
            "ndvi": latest_metric.ndvi if latest_metric else None,
            "forest_cover": latest_metric.forest_cover if latest_metric else None,
            "tree_cover_loss_ha": latest_metric.tree_cover_loss_ha if latest_metric else None,
            "recorded_at": str(latest_metric.recorded_at) if latest_metric else None,
            "data_source": latest_metric.data_source if latest_metric else None,
            "data_quality": latest_metric.data_quality if latest_metric else None,
        },
        "biodiversity": {
            "total_observations": bio_stats.total_observations if bio_stats else 0,
            "unique_species": bio_stats.unique_species if bio_stats else 0,
            "first_year": bio_stats.first_year if bio_stats else None,
            "last_year": bio_stats.last_year if bio_stats else None,
        },
        "data_coverage": {
            "env_year_from": env_years[0] if env_years else None,
            "env_year_to": env_years[1] if env_years else None,
        },
    }


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Aggregate dashboard KPIs for the authenticated user."""
    user_project_ids = [
        pid for (pid,) in db.query(Project.id).filter(Project.created_by == current_user.id).all()
    ]
    total_projects = len(user_project_ids)

    active_sites = (
        db.query(func.count(Site.id))
        .filter(Site.project_id.in_(user_project_ids), Site.status == "Active")
        .scalar() or 0
    )
    total_area = (
        db.query(func.coalesce(func.sum(Site.area_hectares), 0))
        .filter(Site.project_id.in_(user_project_ids))
        .scalar() or 0
    )
    user_site_ids = [
        sid for (sid,) in db.query(Site.id).filter(Site.project_id.in_(user_project_ids)).all()
    ]
    biodiversity_count = (
        db.query(func.count(BiodiversityObservation.id))
        .filter(BiodiversityObservation.site_id.in_(user_site_ids))
        .scalar() or 0
    )
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    sites_updated_30d = (
        db.query(func.count(Site.id))
        .filter(
            Site.project_id.in_(user_project_ids),
            Site.updated_at >= thirty_days_ago,
        )
        .scalar() or 0
    )

    # Latest NDVI across user's sites
    latest_ndvi = None
    if user_site_ids:
        ndvi_row = (
            db.query(EnvironmentalMetric.ndvi)
            .filter(
                EnvironmentalMetric.site_id.in_(user_site_ids),
                EnvironmentalMetric.ndvi.isnot(None)
            )
            .order_by(EnvironmentalMetric.recorded_at.desc())
            .first()
        )
        if ndvi_row:
            latest_ndvi = round(float(ndvi_row.ndvi), 4)

    return {
        "total_projects": total_projects,
        "active_sites": active_sites,
        "total_area_ha": round(float(total_area), 1),
        "biodiversity_observations": biodiversity_count,
        "sites_updated_30d": sites_updated_30d,
        "latest_ndvi": latest_ndvi,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
