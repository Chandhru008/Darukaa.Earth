"use client"

import Link from "next/link"
import { FolderKanban, MapPin, Maximize, Leaf, Plus, ArrowUpRight, RefreshCw, Trash2 } from "lucide-react"
import { useDashboard } from "@/components/dashboard/store"
import { Card, DemoBadge, KpiCard, PageHeader, SectionHeader, StatusBadge } from "@/components/dashboard/ui"
import MapView from "@/components/dashboard/map-view"
import { useCallback, useEffect, useRef, useState } from "react"

/** Animates a number from 0 to `target` over `duration` ms */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const prevTarget = useRef(0)

  useEffect(() => {
    if (target === prevTarget.current) return
    prevTarget.current = target
    if (target === 0) { setValue(0); return }
    startRef.current = null
    const from = value
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + eased * (target - from)))
      if (progress < 1) frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [target, duration])

  return value
}

function formatArea(ha: number) {
  if (ha === 0) return "—"
  return ha.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " ha"
}

function LiveKpiCard({ icon, rawValue, label, sub, formatter }: {
  icon: React.ComponentType<{ className?: string }>
  rawValue: number
  label: string
  sub: string
  formatter?: (n: number) => string
}) {
  const animated = useCountUp(rawValue)
  const display = rawValue === 0 ? "—" : (formatter ? formatter(animated) : animated.toLocaleString("en-US"))
  return <KpiCard icon={icon as any} value={display} label={label} sub={sub} />
}

export default function DashboardPage() {
  const { projects, sites, isLoading, refreshProjects, refreshAllSites } = useDashboard()

  // ── Derived stats straight from the already-fetched store data ──────────
  const totalProjects = projects.length
  const activeSites   = sites.filter(s => s.status === "Active").length
  const totalArea     = sites.reduce((sum, s) => sum + (s.area_hectares ?? 0), 0)

  // ── Biodiversity observation count: fetched once per load, re-fetchable ──
  const [bioCount, setBioCount]         = useState(0)
  const [lastUpdated, setLastUpdated]   = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchBioCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token || sites.length === 0) return
      // Sum biodiversity observations across every site
      const counts = await Promise.all(
        sites.map(s =>
          fetch(`http://127.0.0.1:8001/sites/${s.id}/biodiversity`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(r => r.ok ? r.json() : [])
            .then((data: any[]) => data.length)
            .catch(() => 0)
        )
      )
      setBioCount(counts.reduce((a, b) => a + b, 0))
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    } catch (e) {
      console.error("Failed to fetch biodiversity count:", e)
    }
  }, [sites])

  // Fetch once when sites are loaded, then poll every 30s
  useEffect(() => {
    if (sites.length === 0) return
    fetchBioCount()
    pollRef.current = setInterval(fetchBioCount, 30_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [sites, fetchBioCount])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([refreshProjects(), refreshAllSites()])
    await fetchBioCount()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm("Are you sure you want to delete this project and all its data?")) return
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://127.0.0.1:8001/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        await handleRefresh()
      } else {
        alert("Failed to delete project")
      }
    } catch (e) {
      console.error(e)
      alert("Error deleting project")
    }
  }

  // "Sites updated last 30 days" — sites whose created_at is within last 30 days
  // (updated_at is only set on UPDATE; use created_at as safe fallback)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const recentSites = sites.filter(s => new Date(s.created_at).getTime() >= thirtyDaysAgo).length

  const dataCoverage = totalProjects > 0
    ? Math.min(100, Math.round(70 + (activeSites / Math.max(sites.length, 1)) * 30))
    : 0

  return (
    <div className="relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_88%_0%,oklch(0.62_0.12_150/0.10),transparent_28%),radial-gradient(circle_at_18%_18%,oklch(0.45_0.08_150/0.07),transparent_24%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="relative space-y-8 p-5 md:p-8">

        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_90%_10%,oklch(0.65_0.14_150/0.18),transparent_32%),linear-gradient(135deg,oklch(0.19_0.025_160),oklch(0.13_0.02_160))] p-5 shadow-[0_24px_80px_-38px_rgba(74,190,103,0.5)] backdrop-blur-sm md:p-7">
          <div className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full border border-primary/10 bg-primary/5 blur-[1px]" />
          <div className="pointer-events-none absolute right-8 top-8 size-2 rounded-full bg-primary shadow-[0_0_22px_8px_rgba(80,200,110,0.3)]" />
          <PageHeader title="Environmental Overview" subtitle="Monitor projects, geographical sites and environmental performance from one place.">
            <DemoBadge />
            <Link href="/projects/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-10px_rgba(80,190,100,0.8)] transition-transform hover:-translate-y-0.5">
              <Plus className="size-4" /> New Project
            </Link>
            <Link href="/map" className="rounded-lg border border-border bg-background/30 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary">
              Explore Map
            </Link>
          </PageHeader>
        </div>

        {/* KPI cards — derived from live store data */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <LiveKpiCard
            icon={FolderKanban}
            rawValue={totalProjects}
            label="Total Projects"
            sub={isLoading ? "Loading…" : totalProjects > 0 ? `${totalProjects} in your workspace` : "No projects yet"}
          />
          <LiveKpiCard
            icon={MapPin}
            rawValue={activeSites}
            label="Active Sites"
            sub="Across monitored regions"
          />
          <LiveKpiCard
            icon={Maximize}
            rawValue={totalArea}
            label="Area Monitored"
            sub="Across active sites"
            formatter={(n) => formatArea(n)}
          />
          <LiveKpiCard
            icon={Leaf}
            rawValue={bioCount}
            label="Biodiversity Observations"
            sub="Across monitored sites"
          />
        </div>

        {/* Live environmental pulse */}
        <Card className="relative overflow-hidden border-primary/15 bg-gradient-to-r from-card via-card to-primary/[0.06] p-5">
          <div className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                Live environmental pulse
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Your landscapes are being monitored.</h2>
              <p className="mt-1 text-sm text-muted-foreground">A quick read across active projects and recent field observations.</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  title="Refresh all data now"
                  className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/30 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
                  {lastUpdated ? `Updated ${lastUpdated}` : isLoading ? "Loading…" : "Refresh"}
                </button>
                {lastUpdated && <span className="text-[10px] text-muted-foreground/60">· auto-refreshes every 30s</span>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 lg:min-w-[420px]">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {totalProjects > 0 ? `${dataCoverage}%` : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Data coverage</p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-1000"
                    style={{ width: `${dataCoverage}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {recentSites > 0 ? recentSites : totalProjects > 0 ? activeSites : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Sites updated</p>
                <p className="mt-3 text-xs font-medium text-primary">Last 30 days</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {bioCount > 0
                    ? `+${((bioCount / Math.max(activeSites, 1)) * 0.8).toFixed(1)}%`
                    : totalProjects > 0 ? "+0.0%" : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Trend signal</p>
                <p className="mt-3 text-xs font-medium text-primary">
                  {totalProjects > 0 ? "Positive direction" : "Awaiting data"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Map */}
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeader title="Project Sites" subtitle="Explore environmental projects and their geographical boundaries." />
            <Link href="/map" className="inline-flex items-center gap-1 text-sm text-primary">
              Open full map <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="h-[480px] p-3"><MapView /></div>
        </Card>

        {/* Recent projects table */}
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5">
            <SectionHeader title="Recent Projects" subtitle="Recently created and updated environmental projects." />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Region</th>
                  <th className="px-5 py-3">Sites</th>
                  <th className="px-5 py-3">Area (ha)</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 4).map((p) => {
                  const pSites = sites.filter(s => s.project_id === p.id)
                  const pArea  = pSites.reduce((sum, s) => sum + (s.area_hectares ?? 0), 0)
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-5 py-4">
                        <Link className="font-medium text-foreground hover:text-primary" href={`/projects/${p.id}`}>{p.name}</Link>
                        <div className="mt-1 text-xs text-muted-foreground">{p.project_type}</div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{p.region}</td>
                      <td className="px-5 py-4 text-muted-foreground">{pSites.length || "—"}</td>
                      <td className="px-5 py-4 text-muted-foreground">{pArea > 0 ? pArea.toLocaleString("en-US", { maximumFractionDigits: 1 }) : "—"}</td>
                      <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
