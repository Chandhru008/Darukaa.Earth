import { useCallback, useEffect, useRef, useState } from "react"

export interface RealtimeState<T> {
  data: T[]
  isLoading: boolean
  isRefreshing: boolean
  lastUpdated: string | null
  refresh: () => void
}

/**
 * Generic polling hook. Fetches `url` every `intervalMs` ms.
 * Re-fetches automatically when `url` changes.
 */
export function useRealtimeData<T>(
  url: string | null,
  intervalMs = 30_000
): RealtimeState<T> {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(
    async (showSpinner = false) => {
      if (!url) return
      // Cancel any in-flight request
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      if (showSpinner) setIsRefreshing(true)
      try {
        const token = localStorage.getItem("token") ?? ""
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortRef.current.signal,
        })
        if (res.ok) {
          const json: T[] = await res.json()
          setData(json)
          setLastUpdated(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          )
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error(`[realtime] failed: ${url}`, e)
        }
      } finally {
        setIsLoading(false)
        if (showSpinner) setTimeout(() => setIsRefreshing(false), 400)
      }
    },
    [url]
  )

  useEffect(() => {
    if (!url) return
    setIsLoading(true)
    setData([])
    fetchData(false)
    pollRef.current = setInterval(() => fetchData(false), intervalMs)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      abortRef.current?.abort()
    }
  }, [url, intervalMs, fetchData])

  const refresh = useCallback(() => fetchData(true), [fetchData])

  return { data, isLoading, isRefreshing, lastUpdated, refresh }
}
