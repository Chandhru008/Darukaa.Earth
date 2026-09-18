"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Bird,
  Cloud,
  LayoutGrid,
  Layers,
  MapPin,
  Map as MapIcon,
  Settings,
  X,
} from "lucide-react"

import { useDashboard } from "./store"

const nav = [
  { href: "/dashboard", label: "Overview", desc: "Dashboard overview", icon: LayoutGrid },
  { href: "/projects", label: "Projects", desc: "Manage projects", icon: Layers },
  { href: "/sites", label: "Sites", desc: "Manage geographical sites", icon: MapPin },
  { href: "/map", label: "Map", desc: "Explore geographical sites", icon: MapIcon },
  { href: "/analytics", label: "Analytics", desc: "Environmental analytics", icon: BarChart3 },
  { href: "/biodiversity", label: "Biodiversity", desc: "Biodiversity data", icon: Bird },
  { href: "/carbon", label: "Carbon", desc: "Carbon monitoring", icon: Cloud },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user } = useDashboard()

  const displayName = user?.full_name || user?.email?.split('@')[0] || "Admin Profile"
  const displayInitials = displayName.substring(0, 2).toUpperCase()
  const displayEmail = user?.email || "admin@darukaa.earth"

  return (
    <div className="flex h-full flex-col bg-[oklch(0.19_0.006_155)]">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/dashboard" onClick={onNavigate} className="block">
          <div className="font-heading text-sm font-bold tracking-[0.18em] text-foreground">
            DARUKAA<span className="text-primary">.EARTH</span>
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Environmental Intelligence
          </div>
        </Link>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group relative flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors ${
                active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary" />}
              <Icon className={`mt-0.5 size-[18px] shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-tight">{item.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground/70">{item.desc}</span>
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-3">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
            pathname === "/settings" ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
          }`}
        >
          <Settings className="size-[18px]" />
          Settings
        </Link>
        <div className="flex items-center gap-3 rounded-md px-3 py-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {displayInitials}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium leading-tight text-foreground">{displayName}</span>
            <span className="block truncate text-[11px] text-muted-foreground/70">{displayEmail}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
