"""
migrate_schema.py
=================
Idempotent ALTER TABLE script that adds new columns and indexes to existing tables.
Safe to run multiple times — skips if columns already exist.

Usage:
    cd backend
    python scripts/migrate_schema.py
"""

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1234@localhost:5433/Daaruka_db")
engine = create_engine(DATABASE_URL)

MIGRATIONS = [
    # ── biodiversity_observations ──────────────────────────────────────────────
    ("biodiversity_observations", "abundance",
     "ALTER TABLE biodiversity_observations ADD COLUMN IF NOT EXISTS abundance FLOAT"),
    ("biodiversity_observations", "biomass",
     "ALTER TABLE biodiversity_observations ADD COLUMN IF NOT EXISTS biomass FLOAT"),
    ("biodiversity_observations", "external_id",
     "ALTER TABLE biodiversity_observations ADD COLUMN IF NOT EXISTS external_id VARCHAR(200)"),
    ("biodiversity_observations", "year",
     "ALTER TABLE biodiversity_observations ADD COLUMN IF NOT EXISTS year INTEGER"),

    # ── environmental_metrics ──────────────────────────────────────────────────
    ("environmental_metrics", "year",
     "ALTER TABLE environmental_metrics ADD COLUMN IF NOT EXISTS year INTEGER"),
    ("environmental_metrics", "tree_cover_loss_ha",
     "ALTER TABLE environmental_metrics ADD COLUMN IF NOT EXISTS tree_cover_loss_ha FLOAT"),
    ("environmental_metrics", "aboveground_biomass_density",
     "ALTER TABLE environmental_metrics ADD COLUMN IF NOT EXISTS aboveground_biomass_density FLOAT"),
    ("environmental_metrics", "data_source",
     "ALTER TABLE environmental_metrics ADD COLUMN IF NOT EXISTS data_source VARCHAR(200)"),
    ("environmental_metrics", "data_quality",
     "ALTER TABLE environmental_metrics ADD COLUMN IF NOT EXISTS data_quality VARCHAR(50)"),
]

INDEXES = [
    ("ix_biodiversity_location_gist",
     "CREATE INDEX IF NOT EXISTS ix_biodiversity_location_gist ON biodiversity_observations USING GIST(location)"),
    ("ix_biodiversity_year",
     "CREATE INDEX IF NOT EXISTS ix_biodiversity_year ON biodiversity_observations(year)"),
    ("ix_biodiversity_external_id",
     "CREATE INDEX IF NOT EXISTS ix_biodiversity_external_id ON biodiversity_observations(external_id)"),
    ("ix_env_metrics_year",
     "CREATE INDEX IF NOT EXISTS ix_env_metrics_year ON environmental_metrics(year)"),
    ("ix_env_metrics_site_year",
     "CREATE INDEX IF NOT EXISTS ix_env_metrics_site_year ON environmental_metrics(site_id, year)"),
    ("ix_sites_geometry_gist",
     "CREATE INDEX IF NOT EXISTS ix_sites_geometry_gist ON sites USING GIST(geometry)"),
]


def run():
    with engine.begin() as conn:
        print("=" * 60)
        print("Darukaa.Earth - Schema Migration")
        print("=" * 60)

        print("\n-- Column migrations --")
        for table, col, sql in MIGRATIONS:
            try:
                conn.execute(text(sql))
                print(f"  OK {table}.{col}")
            except Exception as e:
                print(f"  FAIL {table}.{col}: {e}")

        print("\n-- Index creation --")
        for idx_name, sql in INDEXES:
            try:
                conn.execute(text(sql))
                print(f"  OK {idx_name}")
            except Exception as e:
                print(f"  FAIL {idx_name}: {e}")

        # Backfill year from recorded_at for existing environmental_metrics
        conn.execute(text("""
            UPDATE environmental_metrics
            SET year = EXTRACT(YEAR FROM recorded_at)::INTEGER
            WHERE year IS NULL AND recorded_at IS NOT NULL
        """))

        # Backfill year from observed_at for existing biodiversity_observations
        conn.execute(text("""
            UPDATE biodiversity_observations
            SET year = EXTRACT(YEAR FROM observed_at)::INTEGER
            WHERE year IS NULL AND observed_at IS NOT NULL
        """))

    print("\nMigration complete.\n")


if __name__ == "__main__":
    run()
