"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Save, LogOut } from "lucide-react"
import { DemoBadge, PageHeader } from "@/components/dashboard/ui"

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <main className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your Darukaa.Earth workspace preferences."><DemoBadge /></PageHeader>
      <div className="max-w-3xl space-y-5">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">Workspace profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">The details shown across your environmental intelligence workspace.</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm"><span className="text-muted-foreground">Workspace name</span><input defaultValue="Darukaa.Earth" className="w-full rounded-md border border-border bg-background px-3 py-2.5 outline-none focus:border-primary" /></label>
            <label className="space-y-2 text-sm"><span className="text-muted-foreground">Primary region</span><input defaultValue="South Asia" className="w-full rounded-md border border-border bg-background px-3 py-2.5 outline-none focus:border-primary" /></label>
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">Notifications</h2>
          <div className="mt-5 space-y-4">
            {["Weekly environmental summary", "Site monitoring alerts", "New biodiversity observations"].map((item, index) => <label key={item} className="flex items-center justify-between gap-4 text-sm"><span>{item}</span><input type="checkbox" defaultChecked={index < 2} className="size-4 accent-[oklch(0.67_0.16_150)]" /></label>)}
          </div>
        </section>
        <div className="flex items-center gap-4">
          <button onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2200) }} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            {saved ? <Check className="size-4" /> : <Save className="size-4" />}{saved ? "Saved" : "Save changes"}
          </button>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-colors">
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </div>
    </main>
  )
}
