"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from "chart.js"
import { Card, PageHeader, SectionHeader } from "@/components/dashboard/ui"
import { useDashboard } from "@/components/dashboard/store"
import { useRealtimeData } from "@/hooks/use-realtime"
import dynamic from "next/dynamic"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const SiteMapWithObservations = dynamic(
  () => import("@/components/dashboard/site-map-with-observations"),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted/30" /> }
)

interface ObservationItem {
  id: number; site_id: number; species_name: string; scientific_name?: string
  observed_at?: string; year?: number; abundance?: number; biomass?: number
  source?: string; location?: any
}
interface HistoryRow {
  year: number; total_observations: number; unique_species: number
  avg_abundance?: number; avg_biomass?: number
}

import { API_BASE_URL } from "@/lib/api-config"

const API = API_BASE_URL

export default function BiodiversityPage() {
  const { sites } = useDashboard()
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [yearFilter, setYearFilter] = useState<number | null>(null)

  useEffect(() => {
    if (sites.length > 0 && selectedSiteId === null) setSelectedSiteId(sites[0].id)
  }, [sites, selectedSiteId])

  const apiUrl = selectedSiteId
    ? `${API}/sites/${selectedSiteId}/biodiversity?limit=200${yearFilter ? `&year=${yearFilter}` : ""}`
    : null
  const historyUrl = selectedSiteId ? `${API}/sites/${selectedSiteId}/biodiversity/history` : null

  const { data: apiObs, isLoading, isRefreshing, lastUpdated, refresh } =
    useRealtimeData<ObservationItem>(apiUrl, 60_000)
  const { data: history, refresh: refreshHistory } =
    useRealtimeData<HistoryRow>(historyUrl, 60_000)

  const handleRefresh = () => { refresh(); refreshHistory() }

  const selectedSite = sites.find(s => s.id === selectedSiteId)
  const usingReal = apiObs.length > 0

  // Available years from history
  const availableYears = history.map(r => r.year).sort((a, b) => b - a)

  // Species counts for chart
  const obsLabels = history.map(r => r.year.toString())
  const obsValues = history.map(r => r.total_observations)
  const speciesValues = history.map(r => r.unique_species)

  // Observations with real coordinates
  const obsWithLocation = apiObs.filter(o => o.location?.coordinates)

  return (
    <div className="space-y-6">
      <PageHeader title="Biodiversity" subtitle="Species observations spatially associated with project sites." />

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {sites.length > 0 && (
            <>
              <label className="text-sm font-medium text-muted-foreground">Site:</label>
              <select value={selectedSiteId || ""} onChange={e => setSelectedSiteId(Number(e.target.value))}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none">
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </>
          )}
          {availableYears.length > 0 && (
            <>
              <label className="text-sm font-medium text-muted-foreground">Year:</label>
              <select value={yearFilter || ""} onChange={e => setYearFilter(e.target.value ? Number(e.target.value) : null)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none">
                <option value="">All Years</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
        </div>
        <button onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card/60 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
          <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
          {lastUpdated ? `Updated ${lastUpdated}` : isLoading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        {/* Map with real observations */}
        <Card className="min-h-[400px] overflow-hidden p-0">
          <div className="border-b border-border p-4">
            <SectionHeader
              title="Observation Map"
              subtitle={selectedSite
                ? `${obsWithLocation.length} geo-located observations in ${selectedSite.name}`
                : "Observation locations"}
            />
          </div>
          <div className="h-[340px]">
            {selectedSite ? (
              <SiteMapWithObservations
                siteGeometry={selectedSite.geometry}
                centerLat={selectedSite.center_latitude}
                centerLon={selectedSite.center_longitude}
                observations={obsWithLocation}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a site to view observations
              </div>
            )}
          </div>
        </Card>

        {/* Observations table */}
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5">
            <SectionHeader
              title="Recent Observations"
              subtitle={usingReal
                ? `${apiObs.length} records from BioTIME database${yearFilter ? ` · ${yearFilter}` : ""}`
                : "No observations yet — run import_biodiversity.py"}
            />
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Fetching observations…
            </div>
          ) : apiObs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {yearFilter
                ? `No observations for ${yearFilter}. Try "All Years".`
                : "No observations recorded. Download BioTIME dataset and run import_biodiversity.py"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Species</th>
                    <th className="px-4 py-3">Scientific Name</th>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Abundance</th>
                    <th className="px-4 py-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {apiObs.slice(0, 20).map(o => (
                    <tr key={o.id} className="border-t border-border transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{o.species_name}</td>
                      <td className="px-4 py-3 italic text-muted-foreground text-xs">{o.scientific_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{o.year || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {o.abundance != null ? o.abundance.toFixed(1) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{o.source?.split("/")[0] || "BioTIME"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {apiObs.length > 20 && (
                <p className="p-4 text-xs text-muted-foreground">Showing 20 of {apiObs.length} records</p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Temporal chart */}
      {history.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-1 font-heading text-base font-semibold">Biodiversity Over Time</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Annual observation count and unique species — {obsLabels[0]}–{obsLabels.at(-1)} · Source: BioTIME
          </p>
          <div className="h-60">
            <Bar data={{
              labels: obsLabels,
              datasets: [
                {
                  label: "Total Observations",
                  data: obsValues,
                  backgroundColor: "rgba(34,197,94,0.5)",
                  borderColor: "#22c55e", borderWidth: 1, borderRadius: 4,
                },
                {
                  label: "Unique Species",
                  data: speciesValues,
                  backgroundColor: "rgba(251,191,36,0.5)",
                  borderColor: "#fbbf24", borderWidth: 1, borderRadius: 4,
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
        </Card>
      )}
    </div>
  )
}
