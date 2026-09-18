"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { MAPBOX_TOKEN } from "@/lib/api-config"

mapboxgl.accessToken = MAPBOX_TOKEN

interface ObservationPoint {
  id: number
  species_name: string
  scientific_name?: string
  year?: number
  abundance?: number
  location?: { type: string; coordinates: [number, number] }
}

interface SiteMapProps {
  siteGeometry: any        // GeoJSON polygon
  centerLat?: number
  centerLon?: number
  observations?: ObservationPoint[]
}

const TAXA_COLORS: Record<string, string> = {
  Birds: "#f59e0b",
  Fish: "#3b82f6",
  Mammals: "#8b5cf6",
  Plants: "#22c55e",
  Reptiles: "#ef4444",
  Invertebrates: "#f97316",
  Amphibians: "#14b8a6",
  default: "#6ee7b7",
}

function speciesColor(name: string): string {
  for (const [taxa, color] of Object.entries(TAXA_COLORS)) {
    if (name.toLowerCase().includes(taxa.toLowerCase().slice(0, 4))) return color
  }
  return TAXA_COLORS.default
}

export function SiteMapWithObservations({
  siteGeometry,
  centerLat,
  centerLon,
  observations = [],
}: SiteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current || !mapboxgl.accessToken) return

    const center: [number, number] =
      centerLon && centerLat
        ? [centerLon, centerLat]
        : [75.88, 14.5]

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center,
      zoom: 11,
      pitch: 40,
      attributionControl: false,
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right")
    map.addControl(new mapboxgl.ScaleControl(), "bottom-right")

    map.on("load", () => {
      // 3D terrain
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      })
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.3 })

      // Site polygon
      if (siteGeometry) {
        const geojsonFeature: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: [{ type: "Feature", properties: {}, geometry: siteGeometry }],
        }
        map.addSource("site-polygon", { type: "geojson", data: geojsonFeature })
        map.addLayer({
          id: "site-fill",
          type: "fill",
          source: "site-polygon",
          paint: { "fill-color": "#22c55e", "fill-opacity": 0.18 },
        })
        map.addLayer({
          id: "site-outline",
          type: "line",
          source: "site-polygon",
          paint: { "line-color": "#4ade80", "line-width": 2.5, "line-opacity": 0.85 },
        })
      }

      // Observation points as GeoJSON
      if (observations.length > 0) {
        const obsFeatures: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: observations
            .filter(o => o.location?.coordinates)
            .map(o => ({
              type: "Feature" as const,
              properties: {
                id: o.id,
                species: o.species_name,
                sci_name: o.scientific_name || "",
                year: o.year || "",
                abundance: o.abundance ?? "",
              },
              geometry: {
                type: "Point" as const,
                coordinates: o.location!.coordinates,
              },
            })),
        }

        map.addSource("observations", { type: "geojson", data: obsFeatures })

        // Circle layer for observations
        map.addLayer({
          id: "obs-circles",
          type: "circle",
          source: "observations",
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              8, 4, 14, 8
            ],
            "circle-color": "#f59e0b",
            "circle-opacity": 0.85,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#fff",
          },
        })

        // Popup on click
        map.on("click", "obs-circles", (e) => {
          const feat = e.features?.[0]
          if (!feat) return
          const props = feat.properties as any
          const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
          new mapboxgl.Popup({ offset: 10, closeButton: true })
            .setLngLat(coords)
            .setHTML(`
              <div style="font-family:sans-serif;font-size:13px;max-width:200px">
                <strong style="color:#22c55e">${props.species}</strong><br/>
                ${props.sci_name ? `<em style="color:#aaa;font-size:11px">${props.sci_name}</em><br/>` : ""}
                ${props.year ? `Year: ${props.year}<br/>` : ""}
                ${props.abundance ? `Abundance: ${props.abundance}` : ""}
              </div>
            `)
            .addTo(map)
        })

        map.on("mouseenter", "obs-circles", () => {
          map.getCanvas().style.cursor = "pointer"
        })
        map.on("mouseleave", "obs-circles", () => {
          map.getCanvas().style.cursor = ""
        })
      }
    })

    return () => map.remove()
  }, [siteGeometry, centerLat, centerLon, observations])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <div ref={containerRef} className="h-full w-full" />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-border/50 bg-background/85 p-3 text-xs shadow-lg backdrop-blur-md">
        <p className="mb-2 font-semibold text-foreground">Map Layers</p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-3 w-4 rounded-sm border border-green-400/60 bg-green-400/20" />
          Site Polygon
        </div>
        {observations.length > 0 && (
          <div className="mt-1 flex items-center gap-2 text-muted-foreground">
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            {observations.length} Observations
          </div>
        )}
      </div>
      {!mapboxgl.accessToken && (
        <div className="absolute inset-0 grid place-items-center rounded-xl bg-card text-sm text-muted-foreground">
          Map requires a Mapbox token
        </div>
      )}
    </div>
  )
}

export default SiteMapWithObservations
