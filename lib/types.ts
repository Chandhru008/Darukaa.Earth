// Shared domain types for the Darukaa.Earth dashboard.
// Structured so mock data can later be swapped for real API responses.

export type ProjectStatus = "Active" | "Monitoring" | "Draft" | "Completed"
export type ProjectType = "Carbon" | "Biodiversity" | "Carbon + Biodiversity"

export interface Project {
  id: string
  name: string
  description: string
  type: ProjectType
  region: string
  location: string
  startDate: string
  status: ProjectStatus
  siteCount: number
  area: number // hectares
  biodiversityObservations: number
  monitoringSince: number
  createdAt: string
  updatedAt: string
}

export type SiteStatus = "Active" | "Monitoring" | "Draft" | "Completed"

export interface Site {
  id: string
  siteNumber: string // e.g. "Site 04"
  name: string
  projectId: string
  projectName: string
  location: string
  region: string
  area: number // hectares
  status: SiteStatus
  vegetationIndex: number
  biodiversityObservations: number
  monitoringPeriod: string
  createdAt: string
  center: [number, number] // [lng, lat]
  // GeoJSON polygon ring coordinates: [lng, lat][]
  polygon: [number, number][]
}

export interface Observation {
  id: string
  species: string
  siteId: string
  siteName: string
  observedDate: string
  location: string
  source: string
  coordinates: [number, number] // [lng, lat]
  category: "Mammal" | "Bird" | "Reptile" | "Amphibian" | "Flora"
}

export interface TimePoint {
  year: string
  value: number
}

export interface AnalyticsSeries {
  environmentalPerformance: TimePoint[]
  vegetation: TimePoint[]
  carbon: TimePoint[]
  biodiversity: TimePoint[]
}
