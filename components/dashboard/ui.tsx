import type { LucideIcon } from "lucide-react"
import type { ProjectStatus } from "@/lib/types"

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance md:text-[28px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground text-pretty">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

export function DemoBadge({ label = "DEMO DATA" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
      <span className="size-1.5 rounded-full bg-secondary" />
      {label}
    </span>
  )
}

// Keep the older name available so a stale preview module cannot fail during HMR.
export const DemoData = DemoBadge

const statusStyles: Record<string, string> = {
  Active: "bg-primary/12 text-primary border-primary/25",
  Monitoring: "bg-[oklch(0.6_0.1_230/0.14)] text-[oklch(0.75_0.09_230)] border-[oklch(0.6_0.1_230/0.3)]",
  Draft: "bg-muted text-muted-foreground border-border",
  Completed: "bg-secondary/15 text-[oklch(0.72_0.06_120)] border-secondary/30",
}

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || statusStyles.Active
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status || "Active"}
    </span>
  )
}

export function KpiCard({
  icon: Icon,
  value,
  label,
  sub,
}: {
  icon: LucideIcon
  value: string
  label: string
  sub: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-[linear-gradient(145deg,oklch(0.18_0.025_160),oklch(0.13_0.018_160))] p-5 shadow-[0_14px_40px_-24px_rgba(90,180,112,0.55)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_20px_50px_-24px_rgba(90,200,110,0.45)]">
      <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner shadow-primary/10">
          <Icon className="size-5" />
        </span>
        <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-primary">Live</span>
      </div>
      <div className="relative mt-6">
        <div className="font-heading text-3xl font-semibold tracking-tight text-foreground">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
        <div className="mt-3 flex items-center gap-2 text-xs text-primary/85"><span className="size-1.5 rounded-full bg-primary" />{sub}</div>
      </div>
    </div>
  )
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-border/80 bg-card/90 shadow-[0_18px_55px_-32px_rgba(0,0,0,0.9)] transition-colors duration-300 ${className}`}>{children}</div>
}

export function MetricStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-heading text-2xl font-semibold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}
