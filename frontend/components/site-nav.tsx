'use client'

import { cn } from '@/lib/utils'
import { ArrowRight, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Projects', href: '#projects' },
  { label: 'Insights', href: '#insights' },
  { label: 'About', href: '#about' },
]

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled
          ? 'border-b border-border/70 bg-background/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-gradient-to-b from-background/60 to-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:h-[72px]">
        <a
          href="#top"
          className="font-heading text-sm font-semibold tracking-[0.18em] text-foreground"
        >
          DARUKAA<span className="text-primary">.EARTH</span>
        </a>

        <ul className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="group relative text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
          >
            Sign in
          </a>
          <a
            href="/login"
            className="hidden items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-xs font-medium tracking-wide text-foreground transition-all duration-300 hover:border-primary hover:bg-primary/20 md:inline-flex"
          >
            Explore Platform
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden border-t border-border/60 bg-background transition-[max-height,opacity] duration-500 md:hidden',
          open ? 'max-h-[calc(100vh-4rem)] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <ul className="flex min-h-[calc(100vh-4rem)] flex-col gap-1 px-5 py-6">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-2 py-3 text-base text-foreground/90 transition-colors hover:bg-muted"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="mt-2">
            <a
              href="#explore"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-lg border border-primary/50 bg-primary/10 px-4 py-3 text-sm font-medium text-foreground"
            >
              Explore Platform
              <ArrowRight className="h-4 w-4 text-primary" />
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
}
