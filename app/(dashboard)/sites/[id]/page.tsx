"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  ArrowLeft, MapPin, Activity, TreePine, RefreshCw,
  Leaf, BarChart2, AlertCircle, Info
} from "lucide-react"
import { useDashboard } from "@/components/dashboard/store"
import { PageHeader, Card, MetricStat, StatusBadge } from "@/components/dashboard/ui"
import { useRealtimeData } from "@/hooks/use-realtime"
import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Filler, Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler, Legend)

// Dynamic import for Mapbox to avoid SSR issues
const SiteMapWithObservations = dynamic(
  () => import("@/components/dashboard/site-map-with-observations"),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted/30" /> }
)

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalyticsRecord {
  id: number; site_id: number; ndvi?: number; forest_cover?: number
  tree_cover_loss_ha?: number; aboveground_biomass_density?: number
  carbon_metric?: number; recorded_at: string; year?: number
  data_source?: string; data_quality?: string
}
interface HistoryEnvRow {
  year: number; avg_ndvi?: number; forest_cover?: number
  tree_cover_loss_ha?: number; aboveground_biomass_density?: number
  record_count: number; data_source?: string; data_quality?: string
}
interface BiodiversityRecord {
  id: number; site_id: number; species_name: string; scientific_name?: string
  observed_at?: string; year?: number; abundance?: number; biomass?: number
  source?: string; location?: any
}
interface HistoryBioRow {
  year: number; total_observations: number; unique_species: number
  avg_abundance?: number; avg_biomass?: number
}
interface SpeciesRow {
  species_name: string; scientific_name?: string; observation_count: number
  avg_abundance?: number; avg_biomass?: number
  first_year?: number; last_year?: number; source?: string
}
interface SiteSummary {
  site: any; project: any; latest_env_metric: any
  biodiversity: any; data_coverage: any
}

const QUALITY_BADGE: Record<string, string> = {
  measured: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  estimated: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  national_aggregate: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  modelled: "bg-purple-500/15 text-purple-400 border-purple-500/30",
}
const QUALITY_LABEL: Record<string, string> = {
  measured: "Measured", estimated: "Estimated",
  national_aggregate: "National Aggregate", modelled: "Modelled",
}

function QualityBadge({ quality }: { quality?: string }) {
  if (!quality) return null
  const cls = QUALITY_BADGE[quality] || "bg-muted/30 text-muted-foreground border-border"
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      {QUALITY_LABEL[quality] || quality}
    </span>
  )
}

const API = "http://127.0.0.1:8001"

export default function SiteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { sites, projects, isLoading } = useDashboard()
  const siteId = id ? parseInt(id, 10) : null
  const site = sites.find(s => s.id === siteId)
  const project = site ? projects.find(p => p.id === site.project_id) : null

  // Data fetching
  const { data: analytics, isLoading: analyticsLoading, refresh: refreshAnalytics } =
    useRealtimeData<AnalyticsRecord>(siteId ? `${API}/sites/${siteId}/analytics` : null, 60_000)
  const { data: biodiversity, isLoading: bioLoading, refresh: refreshBio } =
    useRealtimeData<BiodiversityRecord>(siteId ? `${API}/sites/${siteId}/biodiversity?limit=200` : null, 60_000)
  const { data: historyEnv, refresh: refreshHistEnv } =
    useRealtimeData<HistoryEnvRow>(siteId ? `${API}/sites/${siteId}/analytics/history` : null, 60_000)
  const { data: historyBio, refresh: refreshHistBio } =
    useRealtimeData<HistoryBioRow>(siteId ? `${API}/sites/${siteId}/biodiversity/history` : null, 60_000)
  const { data: speciesList, refresh: refreshSpecies } =
    useRealtimeData<SpeciesRow>(siteId ? `${API}/sites/${siteId}/biodiversity/species` : null, 60_000)

  const handleRefresh = () => { refreshAnalytics(); refreshBio(); refreshHistEnv(); refreshHistBio(); refreshSpecies() }

  // Build merged historical table
  const allYears = Array.from(new Set([
    ...historyEnv.map(r => r.year),
    ...historyBio.map(r => r.year),
  ])).sort((a, b) => a - b)

  // Chart data — NDVI
  const ndviLabels = historyEnv.filter(r => r.avg_ndvi != null).map(r => r.year.toString())
  const ndviValues = historyEnv.filter(r => r.avg_ndvi != null).map(r => r.avg_ndvi!)

  // Chart data — Observations per year
  const obsLabels = historyBio.map(r => r.year.toString())
  const obsValues = historyBio.map(r => r.total_observations)
  const speciesValues = historyBio.map(r => r.unique_species)

  // KPIs
  const latestEnv = analytics.filter(a => a.ndvi != null).at(-1)
  const latestNdvi = latestEnv?.ndvi != null ? latestEnv.ndvi.toFixed(3) : "—"
  const latestForest = latestEnv?.forest_cover != null ? `${latestEnv.forest_cover.toFixed(1)}%` : "—"
  const latestLoss = latestEnv?.tree_cover_loss_ha != null ? `${latestEnv.tree_cover_loss_ha.toFixed(0)} ha` : "—"

  const obsWithLocation = biodiversity.filter(b => b.location?.coordinates)

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center gap-3">
      <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading site data…</p>
    </div>
  )
  if (!site) return (
    <div className="py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold">Site not found</h1>
      <Link className="mt-4 inline-block text-sm font-medium text-primary hover:underline" href="/sites">Back to Sites</Link>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link href={project ? `/projects/${project.id}` : "/sites"}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-4" />
        {project ? `Project: ${project.name}` : "Back to Sites"}
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={site.name}
          subtitle={project ? `Geographical site within ${project.name} · ${project.region || ""}` : "Site details and environmental analytics"}
        >
          <StatusBadge status={site.status || "Active"} />
        </PageHeader>
        <button onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card/60 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
          <RefreshCw className="size-3" /> Refresh data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStat label="Area (Hectares)" value={`${(site.area_hectares || 0).toLocaleString()} ha`} />
        <MetricStat label="Latest NDVI"
          value={analyticsLoading ? "…" : latestNdvi}
          hint={latestEnv ? <QualityBadge quality={latestEnv.data_quality} /> : "No data yet"} />
        <MetricStat label="Unique Species"
          value={bioLoading ? "…" : `${speciesList.length}`}
          hint={`${biodiversity.length} total observations`} />
        <MetricStat label="Biodiversity Records"
          value={bioLoading ? "…" : biodiversity.length.toString()}
          hint={historyBio.length > 0 ? `${historyBio[0]?.year}–${historyBio.at(-1)?.year}` : "No data yet"} />
      </div>

      {/* Map + Site Info row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="min-h-[380px] overflow-hidden p-0 lg:col-span-2">
          <SiteMapWithObservations
            siteGeometry={site.geometry}
            centerLat={site.center_latitude}
            centerLon={site.center_longitude}
            observations={obsWithLocation}
          />
        </Card>

        <Card className="space-y-5 p-5">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <MapPin className="size-5 text-primary" /> Site Information
          </h2>
          <div className="space-y-3 text-sm">
            {[
              { label: "Project", value: project?.name || "—" },
              { label: "Region", value: project?.region || "—" },
              { label: "Status", value: site.status || "Active" },
              { label: "Area", value: `${(site.area_hectares || 0).toLocaleString()} ha` },
              { label: "Latitude", value: site.center_latitude?.toFixed(4) || "N/A" },
              { label: "Longitude", value: site.center_longitude?.toFixed(4) || "N/A" },
              { label: "Created", value: site.created_at ? new Date(site.created_at).toLocaleDateString() : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono text-xs">{value}</span>
              </div>
            ))}
          </div>

          {/* Data source transparency */}
          {latestEnv?.data_source && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-muted-foreground">
              <p className="mb-1 flex items-center gap-1 font-medium text-foreground">
                <Info className="size-3" /> Data Source
              </p>
              <p>{latestEnv.data_source}</p>
              <p className="mt-1"><QualityBadge quality={latestEnv.data_quality} /></p>
            </div>
          )}
        </Card>
      </div>

      {/* Historical Overview Table */}
      <Card className="p-5">
        <h2 className="mb-1 flex items-center gap-2 font-heading text-lg font-semibold">
          <BarChart2 className="size-5 text-primary" /> Historical Overview
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Year-by-year environmental change — only years with real data are shown
        </p>
        {allYears.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No historical data available yet. Run the import scripts to populate data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-3">Year</th>
                  <th className="px-3 py-3">Species</th>
                  <th className="px-3 py-3">Observations</th>
                  <th className="px-3 py-3">NDVI</th>
                  <th className="px-3 py-3">Forest Cover</th>
                  <th className="px-3 py-3">Tree Loss (ha)</th>
                  <th className="px-3 py-3">Data Quality</th>
                </tr>
              </thead>
              <tbody>
                {allYears.map(yr => {
                  const env = historyEnv.find(r => r.year === yr)
                  const bio = historyBio.find(r => r.year === yr)
                  return (
                    <tr key={yr} className="border-b border-border/40 transition-colors hover:bg-muted/20">
                      <td className="px-3 py-3 font-semibold">{yr}</td>
                      <td className="px-3 py-3">{bio?.unique_species ?? <span className="text-muted-foreground text-xs">No data</span>}</td>
                      <td className="px-3 py-3">{bio?.total_observations ?? <span className="text-muted-foreground text-xs">No data</span>}</td>
                      <td className="px-3 py-3 font-mono text-xs">
                        {env?.avg_ndvi != null ? env.avg_ndvi.toFixed(3) : <span className="text-muted-foreground">No data</span>}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">
                        {env?.forest_cover != null ? `${env.forest_cover.toFixed(1)}%` : <span className="text-muted-foreground">No data</span>}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">
                        {env?.tree_cover_loss_ha != null ? env.tree_cover_loss_ha.toFixed(0) : <span className="text-muted-foreground">No data</span>}
                      </td>
                      <td className="px-3 py-3"><QualityBadge quality={env?.data_quality} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* NDVI Trend */}
        <Card className="p-5">
          <h2 className="mb-1 flex items-center gap-2 font-heading text-base font-semibold">
            <Activity className="size-4 text-primary" /> NDVI Trend Over Time
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            {ndviLabels.length > 0
              ? `${ndviLabels[0]}–${ndviLabels.at(-1)} · MODIS MOD13Q1`
              : "No NDVI data available"}
          </p>
          {ndviLabels.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No NDVI data — run import_environmental_data.py
            </div>
          ) : (
            <div className="h-52">
              <Line data={{
                labels: ndviLabels,
                datasets: [{
                  label: "NDVI",
                  data: ndviValues,
                  borderColor: "#22c55e",
                  backgroundColor: "rgba(34,197,94,0.12)",
                  fill: true, tension: 0.35,
                  pointRadius: 4, pointHoverRadius: 6,
                }],
              }} options={{
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: ctx => ` NDVI: ${Number(ctx.parsed.y).toFixed(3)}` } },
                },
                scales: {
                  x: { grid: { color: "rgba(255,255,255,.05)" }, ticks: { color: "#8f9991" } },
                  y: {
                    min: 0, max: 1,
                    grid: { color: "rgba(255,255,255,.05)" }, ticks: { color: "#8f9991" }
                  },
                },
              }} />
            </div>
          )}
        </Card>

        {/* Observations per year */}
        <Card className="p-5">
          <h2 className="mb-1 flex items-center gap-2 font-heading text-base font-semibold">
            <TreePine className="size-4 text-emerald-500" /> Biodiversity Over Time
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            {obsLabels.length > 0
              ? `${obsLabels[0]}–${obsLabels.at(-1)} · BioTIME observations`
              : "No biodiversity data available"}
          </p>
          {obsLabels.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No biodiversity data — run import_biodiversity.py
            </div>
          ) : (
            <div className="h-52">
              <Bar data={{
                labels: obsLabels,
                datasets: [
                  {
                    label: "Observations",
                    data: obsValues,
                    backgroundColor: "rgba(34,197,94,0.5)",
                    borderColor: "#22c55e",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                  {
                    label: "Unique Species",
                    data: speciesValues,
                    backgroundColor: "rgba(251,191,36,0.5)",
                    borderColor: "#fbbf24",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }} options={{
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: { legend: { labels: { color: "#8f9991", font: { size: 11 } } } },
                scales: {
                  x: { grid: { color: "rgba(255,255,255,.05)" }, ticks: { color: "#8f9991" } },
                  y: { grid: { color: "rgba(255,255,255,.05)" }, ticks: { color: "#8f9991" } },
                },
              }} />
            </div>
          )}
        </Card>
      </div>

      {/* Species table */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <Leaf className="size-5 text-emerald-500" /> Species Observed
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {bioLoading ? "Loading…"
                : speciesList.length > 0
                  ? `${speciesList.length} distinct species · Source: BioTIME Global Database`
                  : "No species data — run import_biodiversity.py"}
            </p>
          </div>
          <Link href="/biodiversity" className="text-xs text-primary hover:underline">View All →</Link>
        </div>

        {speciesList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No biodiversity observations logged for this site yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-3">Species</th>
                  <th className="px-3 py-3">Scientific Name</th>
                  <th className="px-3 py-3">Observations</th>
                  <th className="px-3 py-3">Avg Abundance</th>
                  <th className="px-3 py-3">Years</th>
                  <th className="px-3 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {speciesList.slice(0, 20).map((sp, i) => (
                  <tr key={i} className="border-b border-border/40 transition-colors hover:bg-muted/20">
                    <td className="px-3 py-3 font-medium">{sp.species_name}</td>
                    <td className="px-3 py-3 italic text-muted-foreground text-xs">{sp.scientific_name || "—"}</td>
                    <td className="px-3 py-3">{sp.observation_count}</td>
                    <td className="px-3 py-3 font-mono text-xs">
                      {sp.avg_abundance != null ? sp.avg_abundance.toFixed(1) : "—"}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {sp.first_year === sp.last_year ? sp.first_year : `${sp.first_year}–${sp.last_year}`}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{sp.source?.split("/")[0] || "BioTIME"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {speciesList.length > 20 && (
              <p className="mt-2 px-3 text-xs text-muted-foreground">… and {speciesList.length - 20} more species</p>
            )}
          </div>
        )}
      </Card>

      {/* Forest / Carbon section */}
      {historyEnv.some(r => r.forest_cover != null || r.tree_cover_loss_ha != null) && (
        <Card className="p-5">
          <h2 className="mb-1 flex items-center gap-2 font-heading text-lg font-semibold">
            <TreePine className="size-5 text-amber-500" /> Forest & Carbon Metrics
          </h2>
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 size-3 shrink-0 text-amber-400" />
            <span>
              Forest cover and tree loss data are <strong>India national aggregates</strong> from the
              Global Forest Data 2001–2022 dataset. These are NOT per-site measurements.
              Carbon metrics are not calculated from NDVI and are only shown where the source dataset provides them.
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {historyEnv.filter(r => r.forest_cover != null).slice(-3).map(r => (
              <div key={r.year} className="rounded-lg border border-border bg-muted/10 p-4">
                <p className="text-2xl font-bold text-foreground">{r.forest_cover?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Forest Cover · {r.year}</p>
                <div className="mt-2"><QualityBadge quality={r.data_quality} /></div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
