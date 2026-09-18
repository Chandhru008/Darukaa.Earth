import type { AnalyticsSeries } from "@/lib/types"

// Illustrative demo values only. Not scientifically validated measurements.
export const analytics: AnalyticsSeries = {
  environmentalPerformance: [
    { year: "2022", value: 58 },
    { year: "2023", value: 64 },
    { year: "2024", value: 69 },
    { year: "2025", value: 74 },
    { year: "2026", value: 79 },
  ],
  vegetation: [
    { year: "2022", value: 0.54 },
    { year: "2023", value: 0.6 },
    { year: "2024", value: 0.65 },
    { year: "2025", value: 0.69 },
    { year: "2026", value: 0.72 },
  ],
  carbon: [
    { year: "2022", value: 42 },
    { year: "2023", value: 51 },
    { year: "2024", value: 63 },
    { year: "2025", value: 78 },
    { year: "2026", value: 92 },
  ],
  biodiversity: [
    { year: "2022", value: 3200 },
    { year: "2023", value: 5400 },
    { year: "2024", value: 7800 },
    { year: "2025", value: 10200 },
    { year: "2026", value: 12486 },
  ],
}

export const kpis = {
  projects: { value: 24, label: "Total Projects", sub: "+3 this month" },
  activeSites: { value: 86, label: "Active Sites", sub: "Across monitored regions" },
  areaMonitored: { value: 48620, label: "Area Monitored", sub: "Across active sites" },
  biodiversity: { value: 12486, label: "Observations", sub: "Across monitored sites" },
}

export const vegetationCard = {
  current: 0.72,
  historicalAverage: 0.64,
  change: 8.3, // percent
}

export const carbonCard = {
  current: 92,
  historicalAverage: 65,
  monitoringPeriod: "2022–2026",
  sitesTracked: 29,
}
