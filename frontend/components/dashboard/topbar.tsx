"use client"

import { usePathname } from "next/navigation"
import { Bell, ChevronDown, CircleHelp, Menu, Search } from "lucide-react"
import { useDashboard } from "./store"

const labels: Record<string, string> = {
  dashboard: "Overview",
  projects: "Projects",
  sites: "Sites",
  map: "Map",
  analytics: "Analytics",
  biodiversity: "Biodiversity",
  carbon: "Carbon",
  settings: "Settings",
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname()
  const { user } = useDashboard()
  
  const segments = pathname.split("/").filter(Boolean)
  const crumb = segments.length ? labels[segments[0]] ?? segments[0] : "Overview"

  const displayName = user?.full_name || user?.email?.split('@')[0] || "Admin"
  const displayInitials = displayName.substring(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <button
        onClick={onMenu}
        className="text-muted-foreground hover:text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="hidden items-center gap-2 text-sm md:flex">
        <span className="text-muted-foreground">Dashboard</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-medium text-foreground">{crumb}</span>
      </div>

      <div className="relative ml-auto w-full max-w-xs md:ml-6 md:mr-auto">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search projects, sites..."
          className="h-9 w-full rounded-md border border-border bg-card/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary/50"
        />
      </div>

      <div className="flex items-center gap-1">
        <button className="relative grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground" aria-label="Notifications">
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
        </button>
        <button className="hidden size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground sm:grid" aria-label="Help">
          <CircleHelp className="size-[18px]" />
        </button>
        <button className="ml-1 flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-white/[0.04]">
          <span className="grid size-7 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
            {displayInitials}
          </span>
          <span className="hidden text-sm font-medium text-foreground sm:block">{displayName}</span>
          <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
        </button>
      </div>
    </header>
  )
}
