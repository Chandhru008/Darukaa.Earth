from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, Base
import app.models.user
import app.models.project
import app.models.site
import app.models.analytics
import app.models.biodiversity
from app.routers import auth, projects, sites, analytics, biodiversity

# Ensure PostGIS extension exists
with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    conn.commit()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Darukaa.Earth Auth Backend",
    description="Authentication API for Darukaa.Earth",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(sites.router)
app.include_router(analytics.router)
app.include_router(biodiversity.router)

@app.get("/")
def root():
    return {"message": "Welcome to Darukaa.Earth Authentication API"}
