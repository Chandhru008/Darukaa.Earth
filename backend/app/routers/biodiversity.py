import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from app.database import get_db
from app.models.biodiversity import BiodiversityObservation
from app.models.site import Site
from app.models.project import Project
from app.schemas.biodiversity import (
    BiodiversityObservationCreate, BiodiversityObservationResponse,
    BiodiversityHistoryItem
)
from app.dependencies.auth import get_current_user, get_optional_user
from app.models.user import User
from typing import Optional as _Opt

router = APIRouter(tags=["Biodiversity"])


@router.post("/biodiversity", response_model=BiodiversityObservationResponse)
def create_biodiversity(
    obs_in: BiodiversityObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    site = db.query(Site).join(Project).filter(
        Site.id == obs_in.site_id, Project.created_by == current_user.id
    ).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    geojson_str = json.dumps(obs_in.location)
    yr = obs_in.year or (obs_in.observed_at.year if obs_in.observed_at else None)

    db_obs = BiodiversityObservation(
        site_id=obs_in.site_id,
        species_name=obs_in.species_name,
        scientific_name=obs_in.scientific_name,
        observed_at=obs_in.observed_at,
        year=yr,
        abundance=obs_in.abundance,
        biomass=obs_in.biomass,
        source=obs_in.source,
        external_id=obs_in.external_id,
        location=func.ST_SetSRID(func.ST_GeomFromGeoJSON(geojson_str), 4326)
    )
    db.add(db_obs)
    db.commit()
    db.refresh(db_obs)
    db_obs.location = obs_in.location
    return db_obs


@router.get("/sites/{site_id}/biodiversity", response_model=List[BiodiversityObservationResponse])
def get_site_biodiversity(
    site_id: int,
    year: Optional[int] = Query(None, description="Filter by year"),
    limit: int = Query(200, le=1000),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: _Opt[User] = Depends(get_optional_user)
):
    """
    Returns biodiversity observations spatially within the site polygon.
    Uses ST_Within to ensure only observations inside the polygon are returned.
    """
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    # Build query — use ST_Within for true spatial filtering if geometry exists
    base_query = """
        SELECT
            b.id, b.site_id, b.species_name, b.scientific_name,
            b.observed_at, b.year, b.abundance, b.biomass,
            b.source, b.external_id, b.created_at,
            ST_AsGeoJSON(b.location) AS geojson
        FROM biodiversity_observations b
        JOIN sites s ON s.id = b.site_id
        WHERE b.site_id = :site_id
    """
    params = {"site_id": site_id}

    # Spatial filter: ensure point is within the site polygon
    base_query += """
        AND (
            b.location IS NULL
            OR s.geometry IS NULL
            OR ST_Within(b.location, s.geometry)
        )
    """

    if year is not None:
        base_query += " AND b.year = :year"
        params["year"] = year

    base_query += " ORDER BY b.observed_at DESC LIMIT :limit OFFSET :offset"
    params["limit"] = limit
    params["offset"] = offset

    rows = db.execute(text(base_query), params).fetchall()

    return [
        {
            "id": r.id,
            "site_id": r.site_id,
            "species_name": r.species_name,
            "scientific_name": r.scientific_name,
            "observed_at": r.observed_at,
            "year": r.year,
            "abundance": r.abundance,
            "biomass": r.biomass,
            "source": r.source,
            "external_id": r.external_id,
            "created_at": r.created_at,
            "location": json.loads(r.geojson) if r.geojson else None,
        }
        for r in rows
    ]


@router.get("/sites/{site_id}/biodiversity/history")
def get_site_biodiversity_history(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: _Opt[User] = Depends(get_optional_user)
):
    """
    Returns yearly aggregated biodiversity statistics.
    Only includes years where actual data exists — never fabricates.
    """
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    rows = db.execute(text("""
        SELECT
            year,
            COUNT(*) AS total_observations,
            COUNT(DISTINCT species_name) AS unique_species,
            AVG(abundance) AS avg_abundance,
            AVG(biomass) AS avg_biomass
        FROM biodiversity_observations
        WHERE site_id = :site_id AND year IS NOT NULL
        GROUP BY year
        ORDER BY year ASC
    """), {"site_id": site_id}).fetchall()

    return [
        {
            "year": r.year,
            "total_observations": r.total_observations,
            "unique_species": r.unique_species,
            "avg_abundance": round(float(r.avg_abundance), 2) if r.avg_abundance else None,
            "avg_biomass": round(float(r.avg_biomass), 4) if r.avg_biomass else None,
        }
        for r in rows
    ]


@router.get("/sites/{site_id}/biodiversity/species")
def get_site_species_list(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: _Opt[User] = Depends(get_optional_user)
):
    """Returns distinct species observed at the site with their statistics."""
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    rows = db.execute(text("""
        SELECT
            species_name,
            scientific_name,
            COUNT(*) AS observation_count,
            AVG(abundance) AS avg_abundance,
            AVG(biomass) AS avg_biomass,
            MIN(year) AS first_year,
            MAX(year) AS last_year,
            MAX(source) AS source
        FROM biodiversity_observations
        WHERE site_id = :site_id
        GROUP BY species_name, scientific_name
        ORDER BY observation_count DESC
        LIMIT 100
    """), {"site_id": site_id}).fetchall()

    return [
        {
            "species_name": r.species_name,
            "scientific_name": r.scientific_name,
            "observation_count": r.observation_count,
            "avg_abundance": round(float(r.avg_abundance), 2) if r.avg_abundance else None,
            "avg_biomass": round(float(r.avg_biomass), 4) if r.avg_biomass else None,
            "first_year": r.first_year,
            "last_year": r.last_year,
            "source": r.source,
        }
        for r in rows
    ]
