export function formatNumber(n: number): string {
  return n.toLocaleString("en-US")
}

export function formatArea(ha: number): string {
  return `${n(ha)} ha`
}

function n(x: number) {
  return x.toLocaleString("en-US")
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24))
  if (days <= 0) return "today"
  if (days === 1) return "1 day ago"
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return "1 week ago"
  if (weeks < 5) return `${weeks} weeks ago`
  const months = Math.floor(days / 30)
  if (months <= 1) return "1 month ago"
  if (months < 12) return `${months} months ago`
  const years = Math.floor(days / 365)
  return years === 1 ? "1 year ago" : `${years} years ago`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
