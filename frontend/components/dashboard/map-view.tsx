"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useRouter } from "next/navigation"
import { API_BASE_URL, MAPBOX_TOKEN } from "@/lib/api-config"

type SiteFeatureCollection = {
  type: "FeatureCollection"
  features: Array<{
    type: "Feature"
    properties: { name: string; area: number; id: number }
    geometry: any // PostGIS GeoJSON
  }>
}

mapboxgl.accessToken = MAPBOX_TOKEN

export function MapView() {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [style, setStyle] = useState("mapbox://styles/mapbox/satellite-streets-v12")
  const [sites, setSites] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchSites = async () => {
      const token = localStorage.getItem("token")
      if (!token) return
      try {
        const res = await fetch(`${API_BASE_URL}/sites`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setSites(data)
        }
      } catch(e) {
        console.error(e)
      }
    }
    fetchSites()
  }, [])

  useEffect(() => {
    if (!ref.current || !mapboxgl.accessToken) return
    const map = new mapboxgl.Map({ 
      container: ref.current, 
      style: style, 
      center: [77.5, 14.5], 
      zoom: 4.8, 
      pitch: 60,
      bearing: -15,
      attributionControl: false 
    })
    
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right")
    map.addControl(new mapboxgl.FullscreenControl(), "top-right")

    map.on("load", () => {
      // Add 3D terrain
      map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });
      map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

      // Add sky layer for realistic horizon
      map.addLayer({
        'id': 'sky',
        'type': 'sky',
        'paint': {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });

      const features: SiteFeatureCollection = {
        type: "FeatureCollection",
        features: sites.filter(s => s.geometry).map((site) => ({
          type: "Feature",
          properties: { name: site.name, area: site.area_hectares, id: site.id },
          geometry: site.geometry,
        })),
      }
      
      map.addSource("sites", { type: "geojson", data: features as any })
      map.addLayer({ id: "site-fill", type: "fill", source: "sites", paint: { "fill-color": "#4fae6b", "fill-opacity": 0.25 } })
      map.addLayer({ id: "site-line", type: "line", source: "sites", paint: { "line-color": "#71cf88", "line-width": 2 } })
      
      sites.forEach((site) => { 
        if (!site.center_longitude || !site.center_latitude) return
        const el = document.createElement("div"); 
        // Modern glassmorphism marker
        el.className = "flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 border border-green-500/50 shadow-lg backdrop-blur-sm cursor-pointer hover:bg-green-500/40 transition-colors";
        el.innerHTML = '<div class="h-2.5 w-2.5 rounded-full bg-green-400"></div>';
        el.title = site.name; 
        el.onclick = () => router.push(`/sites/${site.id}`)
        new mapboxgl.Marker(el).setLngLat([site.center_longitude, site.center_latitude]).addTo(map) 
      })
    })

    return () => map.remove()
  }, [style, sites, router])

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-xl">
      <div ref={ref} className="h-full w-full" aria-label="Interactive project sites map" />
      
      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <select 
          className="h-9 rounded-md border border-border/50 bg-background/80 px-3 py-1 text-sm shadow-sm backdrop-blur-md outline-none ring-ring transition-colors focus:ring-2 text-foreground"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
        >
          <option value="mapbox://styles/mapbox/satellite-streets-v12">Satellite</option>
          <option value="mapbox://styles/mapbox/outdoors-v12">Terrain</option>
          <option value="mapbox://styles/mapbox/dark-v11">Streets (Dark)</option>
        </select>
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-6 left-4 z-10 flex flex-col gap-2 rounded-lg border border-border/50 bg-background/80 p-3 text-xs shadow-lg backdrop-blur-md">
        <h4 className="font-semibold text-foreground">Project Sites</h4>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border border-green-500/50 bg-green-500/20 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
          </div>
          <span className="text-muted-foreground">Monitoring Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-[2px] border-[1.5px] border-[#71cf88] bg-[#4fae6b]/30" />
          <span className="text-muted-foreground">Protected Area</span>
        </div>
      </div>
    </div>
  )
}

export function MapFallback() { return <div className="grid h-full min-h-[420px] place-items-center rounded-xl border border-border bg-card text-sm text-muted-foreground">Map requires a Mapbox token</div> }

export default MapView
