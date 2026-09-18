import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

type AuthShellProps = {
  eyebrow: string
  title: string
  subtitle: string
  image: string
  imageAlt: string
  quote: string
  children: ReactNode
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  image,
  imageAlt,
  quote,
  children,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Form panel */}
      <section className="flex w-full flex-col justify-between px-5 py-8 sm:px-10 lg:w-[46%] lg:px-16 lg:py-12">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-heading text-sm font-semibold tracking-[0.18em] text-foreground"
          >
            DARUKAA<span className="text-primary">.EARTH</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md py-14 lg:py-0">
          <p className="mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-primary">
            <span className="h-px w-8 bg-primary/60" />
            {eyebrow}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            {subtitle}
          </p>

          <div className="mt-9">{children}</div>
        </div>

        <p className="hidden font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 lg:block">
          © 2026 Darukaa.Earth
        </p>
      </section>

      {/* Imagery panel */}
      <section className="relative hidden overflow-hidden lg:block lg:w-[54%]">
        <img
          src={image || '/placeholder.svg'}
          alt={imageAlt}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />

        {/* Subtle GIS accent */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polygon
            points="60,30 78,26 84,48 72,64 56,58 53,40"
            fill="oklch(0.62 0.115 150 / 0.12)"
            stroke="oklch(0.62 0.115 150 / 0.55)"
            strokeWidth="0.3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <figure className="absolute inset-x-12 bottom-12">
          <blockquote className="max-w-md font-heading text-xl font-medium leading-snug text-foreground/95 text-balance">
            {quote}
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Geospatial Environmental Intelligence
          </figcaption>
        </figure>
      </section>
    </main>
  )
}
