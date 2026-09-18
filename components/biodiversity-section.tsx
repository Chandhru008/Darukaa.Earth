import { GisOverlay } from '@/components/gis-overlay'
import { Reveal } from '@/components/reveal'
import { SectionLabel } from '@/components/section-label'

export function BiodiversitySection() {
  return (
    <section className="relative border-t border-border/60 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: content + observation tile (order swapped on desktop) */}
          <div className="lg:order-1">
            <Reveal>
              <SectionLabel>Biodiversity</SectionLabel>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
                See the life within a landscape.
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
                Connect biodiversity observations and geographical information to
                understand ecological activity across project sites.
              </p>
            </Reveal>

            <Reveal delay={200} y={24}>
              <div className="mt-10 rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Species Observations
                  </span>
                  <span className="font-mono text-[10px] text-primary">3 sites</span>
                </div>
                <div className="relative overflow-hidden rounded-xl">
                  <div className="aspect-[16/9]">
                    <img
                      src="/images/satellite-tile.png"
                      alt="Satellite tile of vegetation used for biodiversity observation mapping"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-background/20" />
                  <GisOverlay
                    markers={[
                      { x: 26, y: 40, label: 'Observation' },
                      { x: 54, y: 30, label: 'Observation' },
                      { x: 66, y: 66, label: 'Observation' },
                    ]}
                  />
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right: large image */}
          <Reveal y={28} className="lg:order-2">
            <div className="relative overflow-hidden rounded-3xl border border-border">
              <div className="aspect-[4/5] sm:aspect-[4/4]">
                <img
                  src="/images/biodiversity-ecosystem.png"
                  alt="Tropical wetland ecosystem with a wading bird among dense green vegetation"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
