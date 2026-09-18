# Darukaa.Earth 🌍

A full-stack geospatial environmental analytics platform for managing carbon and biodiversity projects, visualizing geographical sites, and understanding environmental performance over time.

## Overview

Darukaa.Earth lets administrators:
- Register and log in securely.
- Create environmental projects.
- Add multiple geographical sites.
- Draw site boundaries as polygons on an interactive Mapbox map.
- Store boundaries using PostgreSQL + PostGIS.
- View biodiversity observations within a selected site.
- Analyze vegetation and environmental metrics.
- Compare available data across years.
- Visualize trends with Chart.js.

Core flow: Create Project → Draw Site → Store Polygon → Match Environmental Data → Analyze → Visualize Historical Changes.

## Architecture

```text
User 
 | 
 v 
Next.js / React | REST API + JWT 
 v 
FastAPI | SQL + PostGIS 
 v 
PostgreSQL + PostGIS 
 | 
 +-- users 
 +-- projects 
 +-- sites 
 +-- environmental_metrics 
 +-- biodiversity_observations 

External Data 
 +-- NASA MODIS 
 +-- Biodiversity Dataset 
 +-- Global Forest Data 
 +-- Mapbox
```

## Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Mapbox GL JS
- Chart.js
- Tailwind CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- GeoAlchemy2
- JWT Authentication

### Database
- PostgreSQL
- PostGIS
- GiST spatial indexes

### Development
- GitHub
- GitHub Actions
- ESLint
- Prettier
- Pre-commit/code-quality checks

## Database Schema

The application uses one PostgreSQL database with PostGIS.

### 1. users
Stores registered users.

| Column | Purpose |
| :--- | :--- |
| id | Unique user ID |
| full_name | User name |
| email | Unique login email |
| password_hash | Securely hashed password |
| created_at | Account creation time |

Passwords are never stored as plain text.

### 2. projects
Stores environmental projects.

| Column | Purpose |
| :--- | :--- |
| id | Project ID |
| name | Project name |
| description | Description |
| project_type | Environmental project type |
| region | Project region |
| status | Project status |
| start_date | Start date |
| end_date | Optional end date |
| created_by | Creating user |
| created_at | Creation time |
| updated_at | Last update |

Relationship: `users.id → projects.created_by`

### 3. sites
Stores geographical sites belonging to projects.

| Column | Purpose |
| :--- | :--- |
| id | Site ID |
| project_id | Parent project |
| name | Site name |
| description | Description |
| status | Site status |
| area_hectares | Site area |
| center_latitude | Polygon center latitude |
| center_longitude | Polygon center longitude |
| geometry | Site boundary |
| created_at | Creation time |
| updated_at | Last update |

The boundary is stored as: `GEOMETRY(POLYGON, 4326)`
The administrator draws this polygon on Mapbox.

### 4. environmental_metrics
Stores environmental measurements associated with sites and dates.

| Column | Purpose |
| :--- | :--- |
| id | Metric ID |
| site_id | Related site |
| recorded_at | Measurement date |
| ndvi | Vegetation index |
| forest_cover | Forest metric when available |
| carbon_metric | Carbon-related metric when supported |
| created_at | Record creation time |

This supports historical environmental analysis.

### 5. biodiversity_observations
Stores biodiversity observations.

| Column | Purpose |
| :--- | :--- |
| id | Observation ID |
| site_id | Related site |
| species_name | Species |
| scientific_name | Scientific name/genus |
| observed_at | Observation date |
| abundance | Abundance when available |
| biomass | Biomass when available |
| latitude | Latitude |
| longitude | Longitude |
| location | PostGIS point |
| source | Dataset source |
| external_id | Original record ID |
| created_at | Import time |

The location is stored as: `GEOMETRY(POINT, 4326)`
A GiST spatial index is used for geographical queries.

## Datasets Used

Different datasets are used because each answers a different environmental question.

### 1. Global Species Abundance and Diversity
Source: Kaggle
[Dataset Link](https://www.kaggle.com/datasets/thedevastator/global-species-abundance-and-diversity)

**Purpose**
Used for the biodiversity component.
Useful fields may include:
- Species
- Scientific name/genus
- Latitude
- Longitude
- Year/date
- Abundance
- Biomass
- Habitat

The actual dataset columns are inspected during import rather than assumed.

**How it is used**
Latitude + Longitude ↓ PostGIS POINT ↓ biodiversity_observations ↓ Spatial query against site polygon ↓ Species inside the site

This supports:
- Unique species count
- Observation count
- Species lists
- Abundance/biomass where available
- Historical biodiversity observations

Limitation: observations are not necessarily a complete inventory of every species present.

### 2. NASA MODIS MOD13Q1 NDVI
Product: MOD13Q1.061 --- MODIS/Terra Vegetation Indices 16-Day L3 Global 250m SIN Grid

**Purpose**
Used for vegetation condition and historical vegetation trends.
NDVI helps answer: How has vegetation condition changed over time?

Example:
2023 → NDVI 
2024 → NDVI 
2025 → NDVI 
2026 → NDVI

Only dates/years actually available in the source are used.

**How it is used**
MODIS NDVI ↓ Spatial processing ↓ Site polygon ↓ Site-level NDVI statistics ↓ environmental_metrics ↓ FastAPI ↓ Chart.js

Important: NDVI is a vegetation index. It is not direct carbon stock.

### 3. Global Forest Data 2001--2022
Source: Kaggle
[Dataset Link](https://www.kaggle.com/datasets/karnikakapoor/global-forest-data-2001-2022)

**Purpose**
Used for forest and carbon-related environmental context, depending on the actual fields available.

Potential fields include:
- Forest cover
- Tree cover loss
- Aboveground biomass
- Biomass density
- Forest greenhouse-gas emissions
- CO₂ removals/sequestration
- Net greenhouse-gas flux

The actual dataset is inspected before importing fields.

**Important rule**
Carbon values are never fabricated.
The application preserves the meaning and limitations given by the source. Measured, modeled, estimated, and derived values should be clearly distinguished.

## Why Multiple Datasets?

| Dataset | Question answered | Main use |
| :--- | :--- | :--- |
| Global Species Abundance and Diversity | What biodiversity observations exist here? | Species, observations, abundance/biomass |
| NASA MODIS MOD13Q1 | How has vegetation condition changed? | NDVI and vegetation trends |

Together they provide a broader view of a geographical site:
Biodiversity + Vegetation + Forest / Carbon ↓ Site Environmental Analytics ↓ Historical Trends

## Geospatial Data Flow

The main feature is connecting an administrator-created site boundary with environmental data.

1. **Draw site**: The administrator draws a polygon using Mapbox.
2. **Send polygon**: Mapbox ↓ GeoJSON ↓ Next.js ↓ FastAPI
3. **Store polygon**: `sites.geometry GEOMETRY(POLYGON, 4326)`
4. **Match biodiversity**: Coordinates from the biodiversity dataset become PostGIS points.
   Conceptually: `SELECT * FROM biodiversity_observations WHERE ST_Within(location, site_geometry);`
5. **Calculate analytics**: FastAPI performs the required spatial filtering and aggregation.
6. **Visualize**: Next.js displays Site polygon, Biodiversity points, KPI cards, Historical charts, Environmental trends.

## Historical Analytics

The application is designed to show change over time, not only the current state.

For a selected site, the dashboard can show available information such as:
- 2023 → Environmental / biodiversity data 
- 2024 → Environmental / biodiversity data 
- 2025 → Environmental / biodiversity data 
- 2026 → Environmental / biodiversity data

Only years actually present in the source data are shown.
If a dataset has no data for a year: "No data available" is displayed.
No historical values are invented.

## Authentication

Register ↓ Password hashing ↓ users table 
Login ↓ FastAPI ↓ JWT ↓ Authenticated API requests

Database credentials remain on the backend and are not exposed to the browser.

## Core User Flow

Register ↓ Login ↓ Create Project ↓ Add Site ↓ Draw Polygon on Mapbox ↓ Save Polygon to PostGIS ↓ Query Environmental Data ↓ Query Biodiversity Data ↓ Calculate Site Metrics ↓ View Historical Analytics ↓ Explore Map + Charts

## Data Integrity Rules

The project follows these rules:
- Do not invent species.
- Do not invent coordinates.
- Do not invent NDVI values.
- Do not invent carbon values.
- Do not invent historical years.
- Validate coordinates before creating PostGIS points.
- Preserve source dates/years.
- Record data source where possible.
- Inspect actual dataset columns before importing.
- Distinguish measured, modeled, estimated, and derived values.
- Document dataset limitations.

## Data Sources

- NASA MODIS: [https://modis.gsfc.nasa.gov/data/dataprod/mod13.php](https://modis.gsfc.nasa.gov/data/dataprod/mod13.php)
- GBIF: [https://www.gbif.org/](https://www.gbif.org/)
- Global Species Abundance and Diversity: [Kaggle Link](https://www.kaggle.com/datasets/thedevastator/global-species-abundance-and-diversity)
- Global Forest Data 2001--2022: [Kaggle Link](https://www.kaggle.com/datasets/karnikakapoor/global-forest-data-2001-2022)
- Mapbox: [https://www.mapbox.com/](https://www.mapbox.com/)

## Development

### Frontend
```bash
pnpm install 
pnpm dev
```

### Backend
```bash
cd backend 
pip install -r requirements.txt 
uvicorn main:app --reload
```

Environment variables should be configured locally.
```env
DATABASE_URL=your_postgresql_connection_string 
JWT_SECRET_KEY=your_secret
```
Never commit `.env` files or database credentials.

## Dataset Limitations

- Biodiversity observations depend on source sampling and geographic coverage.
- Absence of an observation does not prove absence of a species.
- NDVI is not a direct carbon-stock measurement.
- Forest/carbon metrics retain the definitions of their source.
- Historical comparisons are limited to available source dates/years.
- Spatial aggregation depends on the resolution and structure of each dataset.

---
**Darukaa.Earth**
Geospatial intelligence for environmental monitoring, biodiversity analysis, and data-driven conservation.