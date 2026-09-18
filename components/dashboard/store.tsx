"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

export interface UserProfile {
  id: number
  email: string
  full_name: string | null
}

export interface Project {
  id: number
  name: string
  description: string
  project_type: string
  region: string
  status: string
  start_date: string
  end_date: string
  created_at: string
}

export interface Site {
  id: number
  project_id: number
  name: string
  description: string
  status: string
  area_hectares: number
  center_latitude: number
  center_longitude: number
  created_at: string
  geometry: any
}

export interface NewProjectInput {
  name: string
  description: string
  type: string
  region: string
  startDate: string
  status: string
}

export interface NewSiteInput {
  name: string
  projectId: string
  polygon: any
  center: [number, number]
  area: number
}

export interface DashboardStats {
  total_projects: number
  active_sites: number
  total_area_ha: number
  biodiversity_observations: number
  sites_updated_30d: number
  fetched_at: string | null
}

interface DashboardState {
  user: UserProfile | null
  projects: Project[]
  sites: Site[]
  stats: DashboardStats
  isLoading: boolean
  addProject: (input: NewProjectInput) => Promise<Project>
  addSite: (input: NewSiteInput) => Promise<Site>
  getProject: (id: number) => Project | undefined
  sitesForProject: (projectId: number) => Site[]
  refreshProjects: () => Promise<void>
  refreshSites: (projectId: number) => Promise<void>
  refreshAllSites: () => Promise<void>
  refreshStats: () => Promise<void>
}

const DashboardContext = createContext<DashboardState | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total_projects: 0,
    active_sites: 0,
    total_area_ha: 0,
    biodiversity_observations: 0,
    sites_updated_30d: 0,
    fetched_at: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getHeaders = () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      throw new Error("No token found")
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  }

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8001/auth/me", { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } catch (e) {
      console.error(e)
    }
  }, [router])

  const refreshProjects = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8001/projects", { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (e) {
      console.error(e)
    }
  }, [router])

  const refreshAllSites = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8001/sites", { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setSites(data)
      }
    } catch (e) {
      console.error(e)
    }
  }, [router])

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("http://127.0.0.1:8001/stats", { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e)
    }
  }, [router])

  const refreshSites = useCallback(async (projectId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/projects/${projectId}/sites`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setSites(prev => {
          // Remove old sites for this project, add new ones
          const filtered = prev.filter(s => s.project_id !== projectId)
          return [...filtered, ...data]
        })
      }
    } catch (e) {
      console.error(e)
    }
  }, [router])

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await refreshUser()
      await refreshProjects()
      await refreshAllSites()
      await refreshStats()
      setIsLoading(false)
    }
    const token = localStorage.getItem("token")
    if (token) {
      init()
      // Poll stats every 30 seconds
      pollIntervalRef.current = setInterval(() => {
        refreshStats()
      }, 30_000)
    } else {
      router.push("/login")
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [refreshProjects, refreshAllSites, refreshStats, router])

  const addProject = useCallback(async (input: NewProjectInput) => {
    let headers: Record<string, string>
    try {
      headers = getHeaders()
    } catch (e: any) {
      throw new Error(e?.message || "Authentication required. Please log in.")
    }

    const res = await fetch("http://127.0.0.1:8001/projects", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: input.name,
        description: input.description || "",
        project_type: input.type,
        region: input.region,
        status: input.status || "Draft",
        start_date: input.startDate ? input.startDate : null
      })
    })

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("token")
        router.push("/login")
        throw new Error("Session expired. Please log in again.")
      }
      const errData = await res.json().catch(() => null)
      const detail = errData?.detail
      const msg = typeof detail === "string" 
        ? detail 
        : (Array.isArray(detail) ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ") : `Failed to create project (HTTP ${res.status})`)
      throw new Error(msg)
    }

    const data = await res.json()
    setProjects(prev => [...prev, data])
    // Immediately re-aggregate stats so KPI cards update without waiting 30s
    refreshStats()
    return data
  }, [router, refreshStats])

  const addSite = useCallback(async (input: NewSiteInput) => {
    let headers: Record<string, string>
    try {
      headers = getHeaders()
    } catch (e: any) {
      throw new Error(e?.message || "Authentication required. Please log in.")
    }

    const res = await fetch("http://127.0.0.1:8001/sites", {
      method: "POST",
      headers,
      body: JSON.stringify({
        project_id: parseInt(input.projectId),
        name: input.name,
        description: "",
        status: "Active",
        area_hectares: input.area,
        center_longitude: input.center[0],
        center_latitude: input.center[1],
        geometry: input.polygon
      })
    })

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("token")
        router.push("/login")
        throw new Error("Session expired. Please log in again.")
      }
      const errData = await res.json().catch(() => null)
      const detail = errData?.detail
      const msg = typeof detail === "string" 
        ? detail 
        : (Array.isArray(detail) ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ") : `Failed to create site (HTTP ${res.status})`)
      throw new Error(msg)
    }

    const data = await res.json()
    setSites(prev => [...prev, data])
    // Immediately re-aggregate stats so KPI cards update without waiting 30s
    refreshStats()
    return data
  }, [router, refreshStats])

  const getProject = useCallback((id: number) => projects.find((p) => p.id === id), [projects])
  const sitesForProject = useCallback((projectId: number) => sites.filter((s) => s.project_id === projectId), [sites])

  const value = useMemo(
    () => ({ user, projects, sites, stats, isLoading, addProject, addSite, getProject, sitesForProject, refreshProjects, refreshSites, refreshAllSites, refreshStats }),
    [user, projects, sites, stats, isLoading, addProject, addSite, getProject, sitesForProject, refreshProjects, refreshSites, refreshAllSites, refreshStats],
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider")
  return ctx
}
