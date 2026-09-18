"use client"

import { useEffect, useRef, useState, use } from "react"
import { useRouter } from "next/navigation"
import mapboxgl from "mapbox-gl"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import * as turf from "@turf/turf"
import "mapbox-gl/dist/mapbox-gl.css"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"
import { useDashboard } from "@/components/dashboard/store"
import { Card } from "@/components/dashboard/ui"
import { ArrowLeft, CheckCircle2, Map as MapIcon, Plus, Eye } from "lucide-react"
import Link from "next/link"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

// Custom green styles for Mapbox Draw
const customDrawStyles = [
  // ACTIVE (being drawn)
  {
    id: "gl-draw-polygon-fill-active",
    type: "fill",
    filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
    paint: { "fill-color": "#4fae6b", "fill-opacity": 0.25 },
  },
  {
    id: "gl-draw-polygon-stroke-active",
    type: "line",
    filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
    paint: { "line-color": "#71cf88", "line-width": 2, "line-dasharray": [0.2, 2] },
  },
  // INACTIVE (drawn, not currently editing)
  {
    id: "gl-draw-polygon-fill-inactive",
    type: "fill",
    filter: ["all", ["==", "active", "false"], ["==", "$type", "Polygon"]],
    paint: { "fill-color": "#4fae6b", "fill-opacity": 0.2 },
  },
  {
    id: "gl-draw-polygon-stroke-inactive",
    type: "line",
    filter: ["all", ["==", "active", "false"], ["==", "$type", "Polygon"]],
    paint: { "line-color": "#71cf88", "line-width": 2 },
  },
  // VERTEX POINTS
  {
    id: "gl-draw-polygon-and-line-vertex-active",
    type: "circle",
    filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
    paint: { "circle-radius": 5, "circle-color": "#fff", "circle-stroke-width": 2, "circle-stroke-color": "#71cf88" },
  },
  // MIDPOINTS
  {
    id: "gl-draw-polygon-and-line-vertex-inactive",
    type: "circle",
    filter: ["all", ["==", "meta", "midpoint"], ["==", "$type", "Point"]],
    paint: { "circle-radius": 4, "circle-color": "#71cf88", "circle-stroke-width": 1, "circle-stroke-color": "#fff" },
  }
]

export default function AddSitePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const projectId = resolvedParams.id
  const router = useRouter()
  const { addSite, getProject } = useDashboard()
  
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const draw = useRef<MapboxDraw | null>(null)
  
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/satellite-streets-v12")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("Active")
  
  // Computed values
  const [polygon, setPolygon] = useState<any>(null)
  const [area, setArea] = useState<number>(0)
  const [center, setCenter] = useState<[number, number] | null>(null)
  const [vertices, setVertices] = useState<number>(0)
  
  const [isSaved, setIsSaved] = useState(false)

  const updateMeasurements = (e?: any) => {
    if (!draw.current) return
    const data = draw.current.getAll()
    if (data.features.length > 0) {
      const feature = data.features[0] as any
      const calculatedArea = turf.area(feature) / 10000 // Convert sq meters to hectares
      const calculatedCenter = turf.centroid(feature).geometry.coordinates as [number, number]
      // Turf geometry coordinates for polygon is array of rings, [0] is outer ring
      const vertexCount = feature.geometry.coordinates[0].length - 1 // subtract 1 for closed loop
      
      setPolygon(feature.geometry)
      setArea(calculatedArea)
      setCenter(calculatedCenter)
      setVertices(vertexCount)
    } else {
      setPolygon(null)
      setArea(0)
      setCenter(null)
      setVertices(0)
    }
  }

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [77.5, 14.5], // Western Ghats approx
      zoom: 6,
      pitch: 45,
      bearing: -10,
    })

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      styles: customDrawStyles,
      defaultMode: 'draw_polygon'
    })

    map.current.addControl(draw.current, 'top-left')
    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right')

    map.current.on('load', () => {
      if (!map.current) return
      map.current.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      })
      map.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 })
      map.current.addLayer({
        'id': 'sky',
        'type': 'sky',
        'paint': {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15
        }
      })
    })

    map.current.on('draw.create', updateMeasurements)
    map.current.on('draw.delete', updateMeasurements)
    map.current.on('draw.update', updateMeasurements)

  }, [])

  // Handle map style changes
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(mapStyle)
      // Re-apply terrain after style change
      map.current.once('styledata', () => {
        if (!map.current?.getSource('mapbox-dem')) {
          map.current?.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          })
          map.current?.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 })
        }
      })
    }
  }, [mapStyle])

  const handleSave = async () => {
    if (!name.trim() || !polygon || !center) return
    try {
      await addSite({
        name,
        projectId,
        polygon,
        center,
        area
      })
      setIsSaved(true)
    } catch (e) {
      console.error(e)
      alert("Failed to save site")
    }
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setStatus("Active")
    if (draw.current) draw.current.deleteAll()
    updateMeasurements()
    setIsSaved(false)
  }

  const isValid = name.trim().length > 0 && polygon !== null

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="flex w-full flex-col overflow-y-auto border-r border-border bg-card p-6 lg:w-[400px] shrink-0">
        <Link href={`/projects/${projectId}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Project
        </Link>
        
        {isSaved ? (
          <div className="flex h-full flex-col items-center justify-center space-y-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="size-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Site created successfully</h2>
              <p className="mt-2 text-sm text-muted-foreground">The geographical boundary has been saved to the project.</p>
            </div>
            <div className="flex w-full flex-col gap-3">
              <button onClick={resetForm} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Plus className="size-4" /> Add Another Site
              </button>
              <button onClick={() => router.push(`/projects/${projectId}`)} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent">
                <Eye className="size-4" /> View Project
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold">Define Geographical Site</h1>
              <p className="mt-1 text-sm text-muted-foreground">Draw a polygon on the map to define the geographical boundary of this site.</p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm">
                Site Name <span className="text-red-500">*</span>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary" 
                  placeholder="e.g. Western Ghats Site 01" 
                />
              </label>

              <label className="block text-sm">
                Site Description <span className="text-muted-foreground">(Optional)</span>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={3} 
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary" 
                />
              </label>

              <label className="block text-sm">
                Site Status
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)} 
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                >
                  <option>Active</option>
                  <option>Monitoring</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>

            <div className="rounded-lg border border-border/50 bg-background/50 p-4 space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2"><MapIcon className="size-4" /> Geographical Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Site Area</p>
                  <p className="font-mono mt-0.5">{area > 0 ? `${area.toLocaleString(undefined, {maximumFractionDigits: 1})} ha` : '--'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Vertices</p>
                  <p className="font-mono mt-0.5">{vertices > 0 ? vertices : '--'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Center Coordinates</p>
                  <p className="font-mono mt-0.5">{center ? `${center[1].toFixed(4)}° N, ${center[0].toFixed(4)}° E` : '--'}</p>
                </div>
              </div>
            </div>

            <button 
              disabled={!isValid} 
              onClick={handleSave}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all"
            >
              Save Site
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - MAP */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <div ref={mapContainer} className="h-full w-full" />
        
        {/* Style Toggle */}
        <div className="absolute top-4 right-14 z-10">
          <select 
            className="h-9 rounded-md border border-border/50 bg-background/90 px-3 py-1 text-sm shadow-sm backdrop-blur-md outline-none focus:ring-2 text-foreground"
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
          >
            <option value="mapbox://styles/mapbox/satellite-streets-v12">Satellite</option>
            <option value="mapbox://styles/mapbox/outdoors-v12">Terrain</option>
            <option value="mapbox://styles/mapbox/dark-v11">Streets</option>
          </select>
        </div>
      </div>
    </div>
  )
}
