import { GisOverlay } from '@/components/gis-overlay'
import { Reveal } from '@/components/reveal'
import { SectionLabel } from '@/components/section-label'

export function ProjectMap() {
  return (
    <section id="projects" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <Reveal>
            <SectionLabel>Projects</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              Every project has a place.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Visualize environmental projects across the landscapes where they
              exist.
            </p>
          </Reveal>
        </div>

        <Reveal delay={120} y={32}>
          <div className="relative mt-14 overflow-hidden rounded-3xl border border-border">
            <div className="relative aspect-[16/10] sm:aspect-[16/8]">
              <img
                src="/images/landscape-broad.png"
                alt="Broad satellite view of a landscape from above showing forest, rivers and terrain"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-background/70 via-transparent to-background/30" />

              <GisOverlay
                polygons={[
                  '12,24 30,18 38,36 24,48 10,40',
                  '46,52 64,44 72,62 58,74 44,68',
                  '68,18 86,16 90,34 76,40 66,30',
                ]}
                markers={[
                  { x: 22, y: 33, label: 'Site A' },
                  { x: 58, y: 60, label: 'Site B' },
                  { x: 78, y: 28, label: 'Site C' },
                ]}
              />

              {/* Floating info card */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-[240px]">
                <div className="rounded-xl border border-border/80 bg-background/80 p-4 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 motion-reduce:animate-none" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Active Project
                    </span>
                  </div>
                  <p className="mt-3 font-heading text-2xl font-semibold tracking-tight">
                    1,248 ha
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Environmental monitoring
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Illustrative preview — values shown are demo data
          </p>
        </Reveal>
      </div>
    </section>
  )
}
