"use client"

import { useState, useEffect, useMemo } from "react"
import { RefreshCw } from "lucide-react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js"
import { Card, DemoBadge, MetricStat, PageHeader } from "@/components/dashboard/ui"
import { useDashboard } from "@/components/dashboard/store"
import { useRealtimeData } from "@/hooks/use-realtime"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

interface AnalyticsItem {
  id: number
  site_id: number
  ndvi: number
  forest_cover: number
  carbon_metric: number
  recorded_at: string
}

export default function CarbonPage() {
  const { sites } = useDashboard()
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)

  useEffect(() => {
    if (sites.length > 0 && selectedSiteId === null) setSelectedSiteId(sites[0].id)
  }, [sites, selectedSiteId])

  const apiUrl = selectedSiteId
    ? `http://127.0.0.1:8001/sites/${selectedSiteId}/analytics`
    : null

  const { data: metrics, isLoading, isRefreshing, lastUpdated, refresh } =
    useRealtimeData<AnalyticsItem>(apiUrl, 30_000)

  const usingReal = metrics.length > 0

  const labels = usingReal
    ? metrics.map(m => new Date(m.recorded_at).toLocaleDateString())
    : ["2022", "2023", "2024", "2025", "2026"]

  const carbonValues = usingReal
    ? metrics.map(m => m.carbon_metric)
    : [40, 50, 62, 78, 92]

  const currentMetric = usingReal
    ? metrics[metrics.length - 1]?.carbon_metric?.toFixed(1) ?? "—"
    : "—"

  const historicalAvg = usingReal
    ? (metrics.reduce((s, m) => s + m.carbon_metric, 0) / metrics.length).toFixed(1)
    : "—"

  const monitoringPeriod = useMemo(() => {
    if (!usingReal) return "—"
    const dates = metrics.map(m => new Date(m.recorded_at).getFullYear())
    const min = Math.min(...dates)
    const max = Math.max(...dates)
    return min === max ? `${min}` : `${min}–${max}`
  }, [metrics, usingReal])

  const selectedSite = sites.find(s => s.id === selectedSiteId)

  return (
    <div className="space-y-7">
      <PageHeader
        title="Carbon Monitoring"
        subtitle="Explore environmental carbon metrics across monitored sites."
      >
        {!usingReal && <DemoBadge label="ILLUSTRATIVE DEMO DATA" />}
      </PageHeader>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {sites.length > 0 && (
          <div className="flex items-center gap-3">
            <label htmlFor="carbon-site-select" className="text-sm font-medium text-muted-foreground">
              Select Site:
            </label>
            <select
              id="carbon-site-select"
              value={selectedSiteId || ""}
              onChange={e => setSelectedSiteId(Number(e.target.value))}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
            >
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={refresh}
          className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card/60 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
          {lastUpdated
            ? `Updated ${lastUpdated} · auto-refreshes every 30s`
            : isLoading
            ? "Loading…"
            : "Refresh"}
        </button>
      </div>

      {/* Chart */}
      <Card className="p-5">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold">Carbon Metrics Over Time</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {usingReal
                ? `carbon_metric field · ${metrics.length} records${selectedSite ? ` — ${selectedSite.name}` : ""}`
                : "Illustrative carbon index trend"}
            </p>
          </div>
          {usingReal && (
            <span className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              Live data
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-[340px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Fetching carbon data…</p>
            </div>
          </div>
        ) : (
          <div className="mt-5 h-[340px]">
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: usingReal ? "Carbon Metric (live)" : "Carbon Index",
                    data: carbonValues,
                    borderColor: "#5bbb73",
                    backgroundColor: "rgba(91,187,115,.12)",
                    fill: true,
                    tension: 0.35,
                    pointRadius: carbonValues.length > 50 ? 0 : 3,
                    pointHoverRadius: 5,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: ctx => ` Carbon: ${(ctx.parsed.y ?? 0).toFixed(2)}`,
                    },
                  },
                },
                scales: {
                  x: { grid: { color: "rgba(255,255,255,.06)" }, ticks: { color: "#8f9991" } },
                  y: { grid: { color: "rgba(255,255,255,.06)" }, ticks: { color: "#8f9991" } },
                },
              }}
            />
          </div>
        )}
      </Card>

      {/* Metric stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricStat
          label="Current Metric"
          value={isLoading ? "…" : currentMetric}
          hint={usingReal ? "Latest DB record" : "Illustrative index"}
        />
        <MetricStat
          label="Historical Average"
          value={isLoading ? "…" : historicalAvg}
          hint={usingReal ? `Avg of ${metrics.length} records` : undefined}
        />
        <MetricStat
          label="Monitoring Period"
          value={isLoading ? "…" : monitoringPeriod}
          hint={usingReal ? "From PostgreSQL records" : undefined}
        />
        <MetricStat
          label="Sites Tracked"
          value={sites.length > 0 ? sites.length.toString() : "—"}
          hint="In your workspace"
        />
      </div>
    </div>
  )
}
