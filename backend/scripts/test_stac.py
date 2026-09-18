import requests, json

lat, lon = 15.109859, 75.886870

r = requests.post(
    'https://planetarycomputer.microsoft.com/api/stac/v1/search',
    json={
        'collections': ['modis-13Q1-061'],
        'bbox': [lon-0.5, lat-0.5, lon+0.5, lat+0.5],
        'datetime': '2020-01-01T00:00:00Z/2025-12-31T23:59:59Z',
        'limit': 5
    },
    headers={'Content-Type': 'application/json'},
    timeout=30
)
if r.status_code == 200:
    data = r.json()
    feats = data.get('features', [])
    if feats:
        f = feats[0]
        print('Full properties:', json.dumps(f.get('properties', {}), indent=2))
        print('\nItem ID:', f.get('id'))
        print('NDVI asset href:', f.get('assets', {}).get('250m_16_days_NDVI', {}).get('href', 'N/A'))
        print('TileJSON:', f.get('assets', {}).get('tilejson', {}).get('href', 'N/A'))
