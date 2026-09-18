'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

export type GeoMarker = {
  x: number
  y: number
  label?: string
}

type GisOverlayProps = {
  /** SVG polygon points in a 0-100 coordinate space, e.g. "10,20 40,15 ..." */
  polygons?: string[]
  markers?: GeoMarker[]
  /** floating label anchored at a percentage position */
  siteLabel?: { text: string; x: number; y: number }
  className?: string
}

export function GisOverlay({
  polygons = [],
  markers = [],
  siteLabel,
  className,
}: GisOverlayProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActive(true)
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.25 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn('pointer-events-none absolute inset-0', className)}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {polygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="oklch(0.62 0.115 150 / 0.12)"
            stroke="oklch(0.72 0.13 150)"
            strokeWidth={1.25}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{
              strokeDasharray: 600,
              strokeDashoffset: active ? 0 : 600,
              transition: 'stroke-dashoffset 1600ms cubic-bezier(0.22,1,0.36,1)',
              transitionDelay: `${i * 220}ms`,
            }}
          />
        ))}
      </svg>

      {markers.map((m, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            opacity: active ? 1 : 0,
            transform: `translate(-50%, -50%) scale(${active ? 1 : 0.6})`,
            transition: 'opacity 700ms ease, transform 700ms ease',
            transitionDelay: `${700 + i * 160}ms`,
          }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/30" />
          </span>
          {m.label && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-background/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-foreground/80 backdrop-blur-sm">
              {m.label}
            </span>
          )}
        </div>
      ))}

      {siteLabel && (
        <div
          className="absolute"
          style={{
            left: `${siteLabel.x}%`,
            top: `${siteLabel.y}%`,
            opacity: active ? 1 : 0,
            transition: 'opacity 800ms ease',
            transitionDelay: '900ms',
          }}
        >
          <div className="flex items-center gap-2 rounded-sm border border-primary/40 bg-background/60 px-2.5 py-1 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/90">
              {siteLabel.text}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
