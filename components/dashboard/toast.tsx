"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { Check, Info, X } from "lucide-react"

type ToastKind = "success" | "info"
interface Toast {
  id: number
  message: string
  kind: ToastKind
}

interface ToastState {
  notify: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastState | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, kind }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3800)
  }, [])

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[120] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-popover/95 px-4 py-3 text-sm shadow-lg shadow-black/40 backdrop-blur animate-in slide-in-from-bottom-3 fade-in duration-300"
          >
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full ${
                t.kind === "success" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {t.kind === "success" ? <Check className="size-3.5" /> : <Info className="size-3.5" />}
            </span>
            <span className="flex-1 text-foreground">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
