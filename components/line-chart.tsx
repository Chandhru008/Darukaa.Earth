'use client'

import { useEffect, useRef, useState } from 'react'

type LineChartProps = {
  data: number[]
  labels: string[]
  height?: number
}

export function LineChart({ data, labels, height = 180 }: LineChartProps) {
  const ref = useRef<SVGSVGElement | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const [active, setActive] = useState(false)
  const [len, setLen] = useState(0)

  const w = 600
  const h = height
  const padX = 16
  const padY = 24
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * (w - padX * 2)
    const y = padY + (1 - (v - min) / range) * (h - padY * 2)
    return [x, y] as const
  })

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const area = `${line} L${points[points.length - 1][0]},${h - padY} L${points[0][0]},${h - padY} Z`

  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength())
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActive(true)
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.4 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div>
      <svg
        ref={ref}
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label="Illustrative environmental performance trend chart"
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.115 150)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="oklch(0.62 0.115 150)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={padX}
            x2={w - padX}
            y1={padY + g * (h - padY * 2)}
            y2={padY + g * (h - padY * 2)}
            stroke="oklch(0.98 0.01 150 / 0.06)"
            strokeWidth="1"
          />
        ))}

        <path
          d={area}
          fill="url(#area-fill)"
          style={{
            opacity: active ? 1 : 0,
            transition: 'opacity 1200ms ease 600ms',
          }}
        />

        <path
          ref={pathRef}
          d={line}
          fill="none"
          stroke="oklch(0.72 0.13 150)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: len,
            strokeDashoffset: active ? 0 : len,
            transition: 'stroke-dashoffset 1800ms cubic-bezier(0.22,1,0.36,1)',
          }}
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r="3.5"
            fill="oklch(0.17 0.006 155)"
            stroke="oklch(0.72 0.13 150)"
            strokeWidth="2"
            style={{
              opacity: active ? 1 : 0,
              transition: `opacity 400ms ease ${900 + i * 160}ms`,
            }}
          />
        ))}
      </svg>

      <div className="mt-3 flex justify-between px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  )
}
