"""
import_biodiversity.py
=====================
Imports BioTIME — Global Species Abundance and Diversity data into
the biodiversity_observations table, spatially filtered to observations
that fall inside the existing site polygons (ST_Within).

Dataset source:
  https://www.kaggle.com/datasets/thedevastator/global-species-abundance-and-diversity
  (BioTIME database — CC0 Public Domain)

Confirmed columns (from dataset description):
  DAY, MONTH, YEAR, LATITUDE, LONGITUDE,
  sum.allrawdata.ABUNDANCE, sum.allrawdata.BIOMASS,
  GENUS, SPECIES, HABITAT, SAMPLE_DESC, STUDYID

Usage:
    cd backend
    python scripts/import_biodiversity.py --file data/biotime.csv [--limit 500000]

Or with auto-download (requires ~/.kaggle/kaggle.json):
    python scripts/import_biodiversity.py --download
"""

import os, sys, argparse, math
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from datetime import date
from tqdm import tqdm

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost:5433/Darukaa_db")

# ── bounding box for India + surroundings ─────────────────────────────────────
# Sites are in Karnataka (~13-15°N, 75-76°E). We use a generous India bbox.
LAT_MIN, LAT_MAX = 6.0, 37.0
LON_MIN, LON_MAX = 68.0, 98.0

CHUNK_SIZE = 50_000


def download_dataset(dest_dir: str):
    """Try Kaggle API download, else print manual instructions."""
    try:
        import kaggle
        os.makedirs(dest_dir, exist_ok=True)
        print("Attempting Kaggle API download …")
        kaggle.api.authenticate()
        kaggle.api.dataset_download_files(
            "thedevastator/global-species-abundance-and-diversity",
            path=dest_dir, unzip=True
        )
        print(f"Download complete → {dest_dir}")
    except Exception as e:
        print(f"\n⚠  Kaggle API download failed: {e}")
        print("""
Manual download instructions:
──────────────────────────────
1. Go to: https://www.kaggle.com/datasets/thedevastator/global-species-abundance-and-diversity
2. Click "Download" → downloads a ZIP file
3. Extract and place the CSV file at:
       backend/data/biotime.csv
   (any CSV inside the ZIP works — the main one is BioTIMEQuery_24_06_2021.csv or similar)
4. Re-run: python scripts/import_biodiversity.py --file data/biotime.csv
""")
        sys.exit(1)


def inspect_csv(path: str):
    """Print column names and sample data — run this first."""
    print(f"\nInspecting: {path}")
    df = pd.read_csv(path, nrows=5, low_memory=False)
    print("\nColumns:", list(df.columns))
    print("\nSample row:\n", df.iloc[0].to_dict())


def get_site_polygons(engine) -> list:
    """Return list of (site_id, WKT polygon) for spatial matching."""
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT id, ST_AsText(geometry) FROM sites WHERE geometry IS NOT NULL"
        )).fetchall()
    return rows


def point_in_polygon_sql(engine, lon: float, lat: float, site_id: int) -> bool:
    """Check if a point is within a site polygon via PostGIS."""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT ST_Within(
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
                geometry
            ) FROM sites WHERE id = :site_id
        """), {"lon": lon, "lat": lat, "site_id": site_id}).scalar()
    return bool(result)


def find_site_for_point(engine, lon: float, lat: float) -> int | None:
    """Find which site polygon contains this point. Returns site_id or None."""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id FROM sites
            WHERE geometry IS NOT NULL
            AND ST_Within(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), geometry)
            LIMIT 1
        """), {"lon": float(lon), "lat": float(lat)}).fetchone()
    return result[0] if result else None


def map_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Flexibly map BioTIME column names to our standard names.
    BioTIME has many variations; we try common patterns.
    """
    col_map = {}
    cols_lower = {c.lower(): c for c in df.columns}

    def find(candidates):
        for c in candidates:
            if c in cols_lower:
                return cols_lower[c]
        return None

    lat_col = find(["latitude", "lat", "decimallatitude", "cent_lat"])
    lon_col = find(["longitude", "lon", "long", "decimallongitude", "cent_long"])
    year_col = find(["year"])
    month_col = find(["month"])
    day_col = find(["day"])
    genus_col = find(["genus"])
    species_col = find(["species"])
    abund_col = find(["sum.allrawdata.abundance", "abundance", "abund", "n"])
    biomass_col = find(["sum.allrawdata.biomass", "biomass", "bio"])
    habitat_col = find(["habitat"])
    studyid_col = find(["studyid", "study_id", "id"])
    sampledesc_col = find(["sample_desc"])

    if not lat_col or not lon_col:
        raise ValueError(f"Cannot find LAT/LON columns. Available: {list(df.columns)}")
    if not year_col:
        raise ValueError(f"Cannot find YEAR column. Available: {list(df.columns)}")

    return {
        "lat": lat_col, "lon": lon_col,
        "year": year_col, "month": month_col, "day": day_col,
        "genus": genus_col, "species": species_col,
        "abundance": abund_col, "biomass": biomass_col,
        "habitat": habitat_col,
        "studyid": studyid_col, "sampledesc": sampledesc_col,
    }


def import_file(csv_path: str, engine, limit: int | None = None, dry_run: bool = False):
    print(f"\n{'═'*60}")
    print(f"BioTIME Biodiversity Import")
    print(f"{'═'*60}")
    print(f"File: {csv_path}")

    # ── peek at columns ───────────────────────────────────────────────────────
    peek = pd.read_csv(csv_path, nrows=2, low_memory=False)
    print(f"Columns ({len(peek.columns)}): {list(peek.columns)}")
    col_map = map_columns(peek)
    print(f"Mapped columns: {col_map}")

    # ── load existing external_ids to skip duplicates ─────────────────────────
    with engine.connect() as conn:
        existing = {r[0] for r in conn.execute(
            text("SELECT external_id FROM biodiversity_observations WHERE external_id IS NOT NULL")
        ).fetchall()}
    print(f"Existing records with external_id: {len(existing)}")

    stats = {
        "read": 0, "invalid_coords": 0, "outside_india": 0,
        "outside_sites": 0, "duplicates": 0, "inserted": 0, "errors": 0
    }
    
    to_insert = []
    rows_read = 0

    reader = pd.read_csv(csv_path, chunksize=CHUNK_SIZE, low_memory=False,
                         dtype={col_map["lat"]: str, col_map["lon"]: str})

    for chunk_idx, chunk in enumerate(reader):
        if limit and rows_read >= limit:
            break

        stats["read"] += len(chunk)
        rows_read += len(chunk)

        lat_col = col_map["lat"]
        lon_col = col_map["lon"]

        # ── convert coords ─────────────────────────────────────────────────
        chunk[lat_col] = pd.to_numeric(chunk[lat_col], errors="coerce")
        chunk[lon_col] = pd.to_numeric(chunk[lon_col], errors="coerce")

        # Drop invalid coords
        mask_valid = (
            chunk[lat_col].notna() & chunk[lon_col].notna() &
            (chunk[lat_col].between(-90, 90)) &
            (chunk[lon_col].between(-180, 180))
        )
        stats["invalid_coords"] += (~mask_valid).sum()
        chunk = chunk[mask_valid]

        # Filter to India bounding box
        mask_india = (
            chunk[lat_col].between(LAT_MIN, LAT_MAX) &
            chunk[lon_col].between(LON_MIN, LON_MAX)
        )
        stats["outside_india"] += (~mask_india).sum()
        chunk = chunk[mask_india]

        if chunk.empty:
            continue

        # Process each row — find which site it belongs to
        for _, row in chunk.iterrows():
            lat = float(row[lat_col])
            lon = float(row[lon_col])

            # Build external_id
            ext_parts = []
            if col_map["studyid"] and pd.notna(row.get(col_map["studyid"])):
                ext_parts.append(str(row[col_map["studyid"]]))
            if col_map["sampledesc"] and pd.notna(row.get(col_map["sampledesc"])):
                ext_parts.append(str(row[col_map["sampledesc"]]))
            if col_map["genus"] and pd.notna(row.get(col_map["genus"])):
                ext_parts.append(str(row[col_map["genus"]]))
            if col_map["species"] and pd.notna(row.get(col_map["species"])):
                ext_parts.append(str(row[col_map["species"]]))
            ext_parts.append(f"{lat:.4f}_{lon:.4f}")
            ext_id = "|".join(ext_parts)[:200]

            if ext_id in existing:
                stats["duplicates"] += 1
                continue

            site_id = find_site_for_point(engine, lon, lat)
            if site_id is None:
                stats["outside_sites"] += 1
                continue

            # Build species name
            genus = str(row[col_map["genus"]]).strip() if col_map["genus"] and pd.notna(row.get(col_map["genus"])) else ""
            species = str(row[col_map["species"]]).strip() if col_map["species"] and pd.notna(row.get(col_map["species"])) else ""
            sci_name = f"{genus} {species}".strip() if genus or species else None
            species_name = sci_name or "Unknown"

            # Year/date
            yr = int(row[col_map["year"]]) if pd.notna(row.get(col_map["year"])) else None
            mo = int(row[col_map["month"]]) if col_map["month"] and pd.notna(row.get(col_map["month"])) else 1
            dy = int(row[col_map["day"]]) if col_map["day"] and pd.notna(row.get(col_map["day"])) else 1
            obs_date = None
            if yr:
                try:
                    obs_date = date(yr, max(1, min(12, mo)), max(1, min(31, dy)))
                except Exception:
                    obs_date = date(yr, 1, 1)

            # Abundance / biomass
            abund = None
            if col_map["abundance"] and pd.notna(row.get(col_map["abundance"])):
                try:
                    abund = float(row[col_map["abundance"]])
                except Exception:
                    pass

            bio = None
            if col_map["biomass"] and pd.notna(row.get(col_map["biomass"])):
                try:
                    bio = float(row[col_map["biomass"]])
                    if math.isnan(bio):
                        bio = None
                except Exception:
                    pass

            habitat = str(row[col_map["habitat"]]).strip() if col_map["habitat"] and pd.notna(row.get(col_map["habitat"])) else "BioTIME"

            to_insert.append({
                "site_id": site_id,
                "species_name": species_name[:200],
                "scientific_name": sci_name[:200] if sci_name else None,
                "observed_at": obs_date,
                "year": yr,
                "abundance": abund,
                "biomass": bio,
                "lat": lat, "lon": lon,
                "source": f"BioTIME/{habitat}"[:100],
                "external_id": ext_id,
            })
            existing.add(ext_id)

        print(f"  Chunk {chunk_idx+1}: read {rows_read:,} rows total | queued {len(to_insert):,} to insert")

        # Batch insert every 500 records
        if len(to_insert) >= 500:
            if not dry_run:
                _batch_insert(engine, to_insert)
                stats["inserted"] += len(to_insert)
            to_insert = []

    # Final batch
    if to_insert and not dry_run:
        _batch_insert(engine, to_insert)
        stats["inserted"] += len(to_insert)

    # ── summary ───────────────────────────────────────────────────────────────
    print(f"\n{'─'*60}")
    print(f"Import Summary (dry_run={dry_run})")
    print(f"{'─'*60}")
    for k, v in stats.items():
        print(f"  {k:<25}: {v:>10,}")
    print(f"{'─'*60}\n")

    return stats


def _batch_insert(engine, records: list):
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO biodiversity_observations
                (site_id, species_name, scientific_name, observed_at, year,
                 abundance, biomass, location, source, external_id, created_at)
            VALUES
                (:site_id, :species_name, :scientific_name, :observed_at, :year,
                 :abundance, :biomass,
                 ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
                 :source, :external_id, NOW())
            ON CONFLICT DO NOTHING
        """), records)


def main():
    parser = argparse.ArgumentParser(description="Import BioTIME biodiversity data")
    parser.add_argument("--file", default="data/biotime.csv", help="Path to BioTIME CSV")
    parser.add_argument("--download", action="store_true", help="Download from Kaggle API first")
    parser.add_argument("--inspect", action="store_true", help="Just print columns and exit")
    parser.add_argument("--limit", type=int, default=None, help="Max rows to read (for testing)")
    parser.add_argument("--dry-run", action="store_true", help="Parse but don't insert")
    args = parser.parse_args()

    if args.download:
        download_dataset("data")
        # Find the CSV
        csv_files = [f for f in os.listdir("data") if f.endswith(".csv")]
        if csv_files:
            args.file = os.path.join("data", csv_files[0])
            print(f"Using: {args.file}")
        else:
            print("No CSV found in data/ after download.")
            sys.exit(1)

    if not os.path.exists(args.file):
        print(f"\n❌ File not found: {args.file}")
        print("Please download the BioTIME dataset and place the CSV at backend/data/biotime.csv")
        print("URL: https://www.kaggle.com/datasets/thedevastator/global-species-abundance-and-diversity")
        sys.exit(1)

    if args.inspect:
        inspect_csv(args.file)
        sys.exit(0)

    engine = create_engine(DATABASE_URL)
    import_file(args.file, engine, limit=args.limit, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
