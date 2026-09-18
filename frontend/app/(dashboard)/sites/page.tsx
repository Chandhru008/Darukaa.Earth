"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, ArrowUpRight, Search } from "lucide-react"
import { useDashboard } from "@/components/dashboard/store"
import { PageHeader } from "@/components/dashboard/ui"

export default function SitesPage() {
  const { sites, projects } = useDashboard()
  const [search, setSearch] = useState("")

  const filteredSites = sites.filter((site) => {
    const proj = projects.find((p) => p.id === site.project_id)
    const projName = proj ? proj.name.toLowerCase() : ""
    return site.name.toLowerCase().includes(search.toLowerCase()) || projName.includes(search.toLowerCase())
  })

  return (
    <main className="space-y-6">
      <PageHeader title="Sites" subtitle="Explore the environmental sites connected to your projects." />
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          aria-label="Search sites"
          placeholder="Search sites by name or project"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {filteredSites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          No sites found. Create a project and add a site polygon!
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSites.map((site) => {
            const proj = projects.find((p) => p.id === site.project_id)
            return (
              <Link key={site.id} href={`/projects/${site.project_id}`} className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50">
                <div className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><MapPin className="size-5" /></span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <h2 className="mt-5 font-heading text-lg font-semibold">{site.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{proj ? proj.name : `Project #${site.project_id}`}</p>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                  <span>{(site.area_hectares || 0).toLocaleString()} ha</span>
                  <StatusBadge status={site.status || "active"} />
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  return <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">{status}</span>
}
