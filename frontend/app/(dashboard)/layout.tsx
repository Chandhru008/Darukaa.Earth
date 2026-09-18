import type { ReactNode } from "react"
import { DashboardProvider } from "@/components/dashboard/store"
import { ToastProvider } from "@/components/dashboard/toast"
import { Shell } from "@/components/dashboard/shell"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <ToastProvider>
        <Shell>{children}</Shell>
      </ToastProvider>
    </DashboardProvider>
  )
}
