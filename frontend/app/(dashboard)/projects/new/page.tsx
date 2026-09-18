"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useDashboard } from "@/components/dashboard/store"
import { PageHeader, Card } from "@/components/dashboard/ui"

export default function NewProject() {
  const router = useRouter()
  const { addProject } = useDashboard()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<string>("Carbon + Biodiversity")
  const [region, setRegion] = useState("India")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      const p = await addProject({
        name: name.trim(),
        description: description.trim(),
        type,
        region: region.trim(),
        startDate: new Date().toISOString().slice(0, 10),
        status: "Draft"
      })
      router.push(`/projects/${p.id}/add-site`)
    } catch (err: any) {
      console.error("Failed to create project:", err)
      setErrorMsg(err?.message || "Failed to create project. Please check backend connection or login status.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Projects
      </Link>
      <PageHeader title="Create project" subtitle="Set up an environmental project before defining its geographical sites." />
      <Card className="p-6">
        {errorMsg && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="size-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-medium">
            Project name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-primary disabled:opacity-50"
              placeholder="e.g. Western Ghats Restoration"
            />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-primary disabled:opacity-50"
              placeholder="Describe the environmental objective..."
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Project type
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 disabled:opacity-50"
              >
                <option>Carbon</option>
                <option>Biodiversity</option>
                <option>Carbon + Biodiversity</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Region
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 disabled:opacity-50"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating Project...
              </>
            ) : (
              "Create Project"
            )}
          </button>
        </form>
      </Card>
    </div>
  )
}
