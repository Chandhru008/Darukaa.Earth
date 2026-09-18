# Darukaa.Earth — Import Scripts

## Overview

Three import scripts load real environmental data into the PostGIS database.

---

## Prerequisites

```bash
cd backend
# Install required packages
pip install pandas numpy tqdm requests kaggle
```

---

## Step 1 — Run Schema Migration (always first)

```bash
cd backend
python scripts/migrate_schema.py
```

This is idempotent (safe to run multiple times). Adds:
- `abundance`, `biomass`, `external_id`, `year` to `biodiversity_observations`
- `tree_cover_loss_ha`, `aboveground_biomass_density`, `data_source`, `data_quality`, `year` to `environmental_metrics`
- Spatial GiST indexes on site polygons and biodiversity points

---

## Step 2 — Import MODIS NDVI (no download required)

Uses the Microsoft Planetary Computer STAC API (open, no login).

```bash
python scripts/import_environmental_data.py --ndvi
```

**What it does:**
- Queries Planetary Computer for MODIS MOD13Q1.061 granules over each site centroid
- Fetches real satellite dates (2018–2026) from actual MODIS overpass records
- Stores NDVI values (or published Karnataka FSI study estimates clearly labelled)
- `data_quality = "measured"` for direct satellite pixel values
- `data_quality = "estimated"` for published study values used when pixel extraction needs rasterio

---

## Step 3 — Import Global Forest Data (manual download)

### Download:
1. Go to: https://www.kaggle.com/datasets/karnikakapoor/global-forest-data-2001-2022
2. Download ZIP and extract
3. Place CSV at `backend/data/forest.csv`

### Inspect columns first:
```bash
python scripts/import_environmental_data.py --inspect-forest --file data/forest.csv
```

### Import:
```bash
python scripts/import_environmental_data.py --forest --file data/forest.csv
```

> ⚠ **Data Quality:** Values are India national aggregates, NOT per-site measurements.
> The frontend displays this prominently. Carbon metrics are only shown where the dataset provides them directly.

---

## Step 4 — Import BioTIME Biodiversity Data (manual download)

### Download:
1. Go to: https://www.kaggle.com/datasets/thedevastator/global-species-abundance-and-diversity
2. Download ZIP and extract
3. Place main CSV at `backend/data/biotime.csv`

### Inspect columns first (ALWAYS run this):
```bash
python scripts/import_biodiversity.py --inspect --file data/biotime.csv
```

### Test run (no database writes):
```bash
python scripts/import_biodiversity.py --file data/biotime.csv --dry-run --limit 100000
```

### Full import:
```bash
python scripts/import_biodiversity.py --file data/biotime.csv
```

**What it does:**
- Filters BioTIME to India bounding box (lat 6–37°N, lon 68–98°E)
- Uses PostGIS `ST_Within` to find observations inside each site polygon
- Maps columns: `GENUS + SPECIES` → `species_name`, `LATITUDE/LONGITUDE` → PostGIS POINT
- Maps `sum.allrawdata.ABUNDANCE` → `abundance`, `sum.allrawdata.BIOMASS` → `biomass`
- Prevents duplicates via `external_id`

---

## Verification

After import, verify with these SQL queries:

```bash
# Open psql
psql "postgresql://postgres:1234@localhost:5433/Daaruka_db"
```

```sql
-- Check record counts
SELECT COUNT(*) FROM biodiversity_observations;
SELECT COUNT(*) FROM environmental_metrics;

-- Historical biodiversity
SELECT year, COUNT(*) AS obs, COUNT(DISTINCT species_name) AS species
FROM biodiversity_observations
GROUP BY year ORDER BY year;

-- Historical NDVI
SELECT year, ROUND(AVG(ndvi)::numeric, 3) AS avg_ndvi, data_quality, data_source
FROM environmental_metrics
WHERE ndvi IS NOT NULL
GROUP BY year, data_quality, data_source
ORDER BY year;

-- Spatial check: observations inside site polygons
SELECT s.name, COUNT(b.id) AS obs_count
FROM sites s
LEFT JOIN biodiversity_observations b
  ON ST_Within(b.location, s.geometry)
GROUP BY s.name;
```

---

## Dataset Limitations

| Dataset | Limitation |
|---|---|
| BioTIME | Global coverage but sparse for South India; records may predate 2000 |
| MODIS NDVI | Planetary Computer API limited; pixel extraction needs `rasterio` for exact values |
| Global Forest Data | Country-level only; not per-site measured values |

All limitations are labelled in the `data_quality` column and displayed in the frontend.

---

## API Endpoints Added / Modified

| Endpoint | Description |
|---|---|
| `GET /sites/{id}/analytics` | NDVI + forest metrics (now includes `data_source`, `data_quality`, `year`) |
| `GET /sites/{id}/analytics/history` | Year-by-year aggregated analytics |
| `GET /sites/{id}/summary` | Combined site info + latest metrics + biodiversity counts |
| `GET /sites/{id}/biodiversity` | Spatially filtered (ST_Within) + `abundance`, `biomass`, `year` |
| `GET /sites/{id}/biodiversity/history` | Year-by-year biodiversity aggregates |
| `GET /sites/{id}/biodiversity/species` | Distinct species list with statistics |
