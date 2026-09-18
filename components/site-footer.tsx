import { ArrowRight } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Projects', href: '#projects' },
  { label: 'Insights', href: '#insights' },
  { label: 'About', href: '#about' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xs">
            <a
              href="#top"
              className="font-heading text-sm font-semibold tracking-[0.18em] text-foreground"
            >
              DARUKAA<span className="text-primary">.EARTH</span>
            </a>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Geospatial intelligence for environmental projects.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href="#explore"
            className="group inline-flex items-center gap-2 self-start rounded-full border border-primary/50 bg-primary/10 px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary hover:bg-primary/20"
          >
            Explore Platform
            <ArrowRight className="h-4 w-4 text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
        </div>

        <div className="mt-14 border-t border-border/60 pt-8">
          <p className="text-xs text-muted-foreground/70">
            © 2026 Darukaa.Earth
          </p>
        </div>
      </div>
    </footer>
  )
}
