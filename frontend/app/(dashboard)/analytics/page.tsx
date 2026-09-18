"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Info, AlertCircle } from "lucide-react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler, Legend,
} from "chart.js"
import { PageHeader, Card, MetricStat } from "@/components/dashboard/ui"
import { useDashboard } from "@/components/dashboard/store"
import { useRealtimeData } from "@/hooks/use-realtime"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend)

interface AnalyticsItem {
  id: number; site_id: number; ndvi?: number; forest_cover?: number
  tree_cover_loss_ha?: number; aboveground_biomass_density?: number
  carbon_metric?: number; recorded_at: string; year?: number
  data_source?: string; data_quality?: string
}
interface HistoryRow {
  year: number; avg_ndvi?: number; forest_cover?: number
  tree_cover_loss_ha?: number; record_count: number
  data_source?: string; data_quality?: string
}

const QUALITY_BADGE: Record<string, string> = {
  measured: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  estimated: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  national_aggregate: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  modelled: "bg-purple-500/15 text-purple-400 border-purple-500/30",
}

function QBadge({ quality }: { quality?: string }) {
  if (!quality) return null
  const cls = QUALITY_BADGE[quality] || "bg-muted/30 text-muted-foreground border-border"
  const label: Record<string, string> = {
    measured: "Measured", estimated: "Estimated (published study)",
    national_aggregate: "National Aggregate", modelled: "Modelled",
  }
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}>{label[quality] || quality}</span>
}

import { API_BASE_URL } from "@/lib/api-config"

const API = API_BASE_URL

export default function AnalyticsPage() {
  const { sites } = useDashboard()
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [range, setRange] = useState<"All" | "5Y" | "3Y" | "1Y">("All")

  useEffect(() => {
    if (sites.length > 0 && selectedSiteId === null) setSelectedSiteId(sites[0].id)
  }, [sites, selectedSiteId])

  const { data: metrics, isLoading, isRefreshing, lastUpdated, refresh } =
    useRealtimeData<AnalyticsItem>(selectedSiteId ? `${API}/sites/${selectedSiteId}/analytics` : null, 60_000)
  const { data: history, refresh: refreshHistory } =
    useRealtimeData<HistoryRow>(selectedSiteId ? `${API}/sites/${selectedSiteId}/analytics/history` : null, 60_000)

  const handleRefresh = () => { refresh(); refreshHistory() }

  // Time range filter
  const cutoff = range === "1Y" ? Date.now() - 365 * 86400_000
    : range === "3Y" ? Date.now() - 3 * 365 * 86400_000
    : range === "5Y" ? Date.now() - 5 * 365 * 86400_000 : 0
  const filtered = metrics.filter(m => new Date(m.recorded_at).getTime() >= cutoff)
  const displayMetrics = filtered.length > 0 ? filtered : metrics

  const usingReal = displayMetrics.length > 0
  const selectedSite = sites.find(s => s.id === selectedSiteId)

  // NDVI series
  const ndviSeries = displayMetrics.filter(m => m.ndvi != null)
  const ndviLabels = ndviSeries.map(m => m.year?.toString() || new Date(m.recorded_at).getFullYear().toString())
  const ndviValues = ndviSeries.map(m => m.ndvi!)

  // Forest series  
  const forestSeries = displayMetrics.filter(m => m.forest_cover != null)
  const forestLabels = forestSeries.map(m => m.year?.toString() || new Date(m.recorded_at).getFullYear().toString())
  const forestValues = forestSeries.map(m => m.forest_cover!)

  const avgNdvi = ndviValues.length > 0
    ? (ndviValues.reduce((s, v) => s + v, 0) / ndviValues.length).toFixed(3)
    : "—"

  const latestMetric = displayMetrics.at(-1)
  const dataQuality = latestMetric?.data_quality
  const dataSource = latestMetric?.data_source

  // Merge labels for combined chart
  const allYears = Array.from(new Set([
    ...ndviLabels, ...forestLabels
  ])).sort()

  const ndviByYear = Object.fromEntries(ndviSeries.map(m => [
    m.year?.toString() || new Date(m.recorded_at).getFullYear().toString(), m.ndvi!
  ]))
  const forestByYear = Object.fromEntries(forestSeries.map(m => [
    m.year?.toString() || new Date(m.recorded_at).getFullYear().toString(), m.forest_cover!
  ]))

  return (
    <div className="space-y-8">
      <PageHeader title="Environmental Analytics"
        subtitle="Vegetation and forest metrics across monitored sites." />

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {sites.length > 0 && (
          <div className="flex items-center gap-3">
            <label htmlFor="site-select" className="text-sm font-medium text-muted-foreground">Site:</label>
            <select id="site-select" value={selectedSiteId || ""}
              onChange={e => setSelectedSiteId(Number(e.target.value))}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none">
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <button onClick={handleRefresh}
          className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card/60 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
          <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
          {lastUpdated ? `Updated ${lastUpdated}` : isLoading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricStat label="Average NDVI"
          value={isLoading ? "…" : avgNdvi}
          hint={dataQuality ? <QBadge quality={dataQuality} /> : "No data yet"} />
        <MetricStat label="Monitored Sites" value={sites.length.toString()} hint="Registered in PostGIS" />
        <MetricStat label="Data Records"
          value={isLoading ? "…" : metrics.length.toString()}
          hint={dataSource ? `${dataSource.split("(")[0].trim()}` : "Connect data sources to see live data"} />
      </div>

      {/* Combined Chart */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">Environmental Performance Over Time</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {usingReal
                ? `${selectedSite?.name || "Site"} · ${ndviSeries.length} NDVI records`
                : "No data — run import scripts"}
              {dataQuality && <span className="ml-2"><QBadge quality={dataQuality} /></span>}
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {(["All", "5Y", "3Y", "1Y"] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${r === range ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[340px] items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : allYears.length === 0 ? (
          <div className="flex h-[340px] items-center justify-center text-sm text-muted-foreground">
            No environmental data yet. Run the import scripts to populate.
          </div>
        ) : (
          <div className="h-[340px]">
            <Line data={{
              labels: allYears,
              datasets: [
                {
                  label: "NDVI",
                  data: allYears.map(y => ndviByYear[y] ?? null),
                  borderColor: "#22c55e",
                  backgroundColor: "rgba(34,197,94,0.1)",
                  fill: true, tension: 0.35,
                  pointRadius: 4, pointHoverRadius: 6,
                  yAxisID: "y",
                },
                ...(forestValues.length > 0 ? [{
                  label: "Forest Cover (%)",
                  data: allYears.map(y => forestByYear[y] ?? null),
                  borderColor: "#f59e0b",
                  backgroundColor: "rgba(245,158,11,0.05)",
                  fill: false, tension: 0.3,
                  pointRadius: 4, pointHoverRadius: 6,
                  yAxisID: "y2",
                  borderDash: [4, 4],
                }] : []),
              ],
            }} options={{
              responsive: true, maintainAspectRatio: false,
              interaction: { mode: "index", intersect: false },
              animation: { duration: 400 },
              plugins: {
                legend: { labels: { color: "#8f9991", font: { size: 11 } } },
                tooltip: {
                  callbacks: {
                    label: ctx => {
                      const v = Number(ctx.parsed.y)
                      if (ctx.dataset.label === "NDVI") return ` NDVI: ${v.toFixed(3)}`
                      return ` Forest Cover: ${v.toFixed(1)}%`
                    },
                  },
                },
              },
              scales: {
                x: { grid: { color: "rgba(255,255,255,.05)" }, ticks: { color: "#8f9991" } },
                y: {
                  grid: { color: "rgba(255,255,255,.05)" }, ticks: { color: "#8f9991" },
                  title: { display: true, text: "NDVI", color: "#22c55e", font: { size: 10 } },
                  min: 0, max: 1,
                },
                ...(forestValues.length > 0 ? {
                  y2: {
                    position: "right" as const,
                    grid: { drawOnChartArea: false },
                    ticks: { color: "#f59e0b" },
                    title: { display: true, text: "Forest Cover (%)", color: "#f59e0b", font: { size: 10 } },
                  }
                } : {}),
              },
            }} />
          </div>
        )}
      </Card>

      {/* Historical table */}
      <Card className="p-5">
        <h2 className="mb-1 font-heading text-base font-semibold">Year-by-Year Summary</h2>
        <p className="mb-4 text-xs text-muted-foreground">Only years with actual data are shown</p>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No historical data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">Year</th>
                  <th className="px-3 py-2">NDVI</th>
                  <th className="px-3 py-2">Forest Cover</th>
                  <th className="px-3 py-2">Tree Loss (ha)</th>
                  <th className="px-3 py-2">Records</th>
                  <th className="px-3 py-2">Data Quality</th>
                </tr>
              </thead>
              <tbody>
                {history.map(r => (
                  <tr key={r.year} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="px-3 py-2 font-semibold">{r.year}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.avg_ndvi?.toFixed(3) ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.forest_cover != null ? `${r.forest_cover.toFixed(1)}%` : "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.tree_cover_loss_ha?.toFixed(0) ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.record_count}</td>
                    <td className="px-3 py-2"><QBadge quality={r.data_quality} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Data disclaimer for forest data */}
      {history.some(r => r.data_quality === "national_aggregate") && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <div>
            <strong className="text-foreground">About Forest Data:</strong> Forest cover and tree cover loss values
            are India national aggregates from the Global Forest Data 2001–2022 dataset. They represent national
            totals, not measurements for this specific site. Carbon metrics are not calculated from NDVI.
          </div>
        </div>
      )}
    </div>
  )
}
