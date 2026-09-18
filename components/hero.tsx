'use client'

import { ArrowRight, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function Hero() {
  const [offset, setOffset] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        if (y < window.innerHeight) setOffset(y * 0.15)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section
      id="top"
      ref={ref}
      className="relative min-h-[92vh] w-full overflow-hidden"
    >
      {/* Solid dark base so any letterboxing stays on-theme */}
      <div className="absolute inset-0 bg-background" />

      {/* Background video with subtle parallax; poster image shows before load / on failure */}
      <div
        className="absolute inset-0 scale-110"
        style={{ transform: `translateY(${offset}px) scale(1.1)` }}
      >
        <video
          className="h-full w-full object-cover brightness-[0.78] contrast-[1.08] saturate-[1.02]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/images/hero-aerial-forest.png"
          aria-hidden="true"
        >
          <source src="/videos/hero-forest.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Gradient overlays: keep the footage visible while ensuring text legibility on the left */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />

      {/* Content */}
      <div className="relative z-20 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-5 pb-16 pt-28 sm:px-8">
        <div className="max-w-2xl">
          <p className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
            <span className="h-px w-8 bg-primary/60" />
            Geospatial Environmental Intelligence
          </p>

          <h1 className="font-heading text-5xl font-semibold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Understand the Earth.
            <span className="block text-muted-foreground">Measure its impact.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Turn geographical and environmental data into actionable insights
            for carbon and biodiversity projects.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#explore"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:brightness-110"
            >
              Explore Platform
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/30 px-6 py-3.5 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-300 hover:border-foreground/40 hover:bg-background/50"
            >
              <Play className="h-3.5 w-3.5 text-primary" />
              See How It Works
            </a>
          </div>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
