import requests
from sqlalchemy import create_engine, text
import math

engine = create_engine('postgresql://postgres:1234@localhost:5433/Darukaa_db')

def get_bounding_box(lat, lon, distance_km=5):
    # Rough approximation for bounding box
    lat_delta = distance_km / 111.0
    lon_delta = distance_km / (111.0 * math.cos(math.radians(lat)))
    return (lat - lat_delta, lat + lat_delta, lon - lon_delta, lon + lon_delta)

with engine.begin() as conn:
    # 1. Delete synthetic data
    conn.execute(text("DELETE FROM biodiversity_observations WHERE source = 'Synthetic Test Data'"))
    print('Deleted synthetic data.')

    # 2. Get sites
    sites = conn.execute(text("SELECT id, center_latitude, center_longitude, name FROM sites WHERE center_latitude IS NOT NULL")).fetchall()
    
    for sid, lat, lon, name in sites:
        print(f'Fetching real GBIF data for site {name} (id={sid})...')
        
        # We will use a 10km radius bounding box to ensure we find some real data nearby
        min_lat, max_lat, min_lon, max_lon = get_bounding_box(lat, lon, 10)
        
        # GBIF API occurrence search
        url = f'https://api.gbif.org/v1/occurrence/search?decimalLatitude={min_lat},{max_lat}&decimalLongitude={min_lon},{max_lon}&hasCoordinate=true&limit=100'
        
        resp = requests.get(url)
        if resp.status_code == 200:
            data = resp.json()
            results = data.get('results', [])
            print(f'Found {len(results)} real observations from GBIF.')
            
            inserted = 0
            for r in results:
                if 'species' not in r: continue
                
                sp_name = r.get('species')
                sci_name = r.get('scientificName', sp_name)
                year = r.get('year', 2023)
                r_lat = r.get('decimalLatitude')
                r_lon = r.get('decimalLongitude')
                
                if not r_lat or not r_lon: continue
                
                # We don't get abundance/biomass from simple GBIF occurrences usually, so we default to 1
                abundance = r.get('individualCount', 1)
                if abundance is None: abundance = 1
                
                ext_id = f'gbif_{r.get("key")}'
                
                try:
                    conn.execute(text("""
                        INSERT INTO biodiversity_observations 
                        (site_id, species_name, scientific_name, year, abundance, source, location, external_id)
                        VALUES (:sid, :sname, :sciname, :year, :ab, 'GBIF Real Data', ST_SetSRID(ST_MakePoint(:plon, :plat), 4326), :ext)
                        ON CONFLICT DO NOTHING
                    """), {
                        'sid': sid,
                        'sname': sp_name,
                        'sciname': sci_name,
                        'year': year,
                        'ab': abundance,
                        'plon': r_lon,
                        'plat': r_lat,
                        'ext': ext_id
                    })
                    inserted += 1
                except Exception as e:
                    pass
            print(f'Inserted {inserted} real records for site {name}.')
        else:
            print('Failed GBIF request:', resp.status_code)

print('Real dataset integration complete.')
