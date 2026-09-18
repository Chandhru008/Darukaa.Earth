import { GisOverlay } from '@/components/gis-overlay'
import { LineChart } from '@/components/line-chart'
import { Reveal } from '@/components/reveal'
import { SectionLabel } from '@/components/section-label'

export function DataVizSection() {
  return (
    <section className="relative border-t border-border/60 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal className="flex justify-center">
            <SectionLabel>Environmental Data</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              Environmental data, made understandable.
            </h2>
          </Reveal>
        </div>

        <Reveal delay={140} y={32}>
          <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2">
            {/* Trend chart — large */}
            <div className="rounded-2xl border border-border bg-card p-6 md:col-span-4 md:row-span-1">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-heading text-sm font-medium">
                  Environmental Trend
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  Illustrative
                </span>
              </div>
              <LineChart
                data={[30, 44, 40, 58, 66, 72]}
                labels={['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov']}
                height={150}
              />
            </div>

            {/* Site area stat */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Site Area
              </span>
              <div>
                <p className="font-heading text-4xl font-semibold tracking-tight">
                  1,248<span className="ml-1 text-lg text-muted-foreground">ha</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Across 3 monitored sites
                </p>
              </div>
            </div>

            {/* Boundary preview */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card md:col-span-2">
              <div className="aspect-[4/3] md:aspect-auto md:h-full">
                <img
                  src="/images/card-map.png"
                  alt="Geographic boundary preview over satellite imagery"
                  className="h-full w-full object-cover opacity-80"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
              <GisOverlay
                polygons={['28,28 66,24 72,56 44,70 24,54']}
                markers={[{ x: 46, y: 46 }]}
              />
              <span className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/80">
                Boundary Preview
              </span>
            </div>

            {/* Vegetation indicator */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Vegetation
              </span>
              <div className="mt-4">
                <div className="flex items-end justify-between">
                  <span className="font-heading text-3xl font-semibold tracking-tight">
                    0.72
                  </span>
                  <span className="font-mono text-[10px] text-primary">NDVI · demo</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[72%] rounded-full bg-primary" />
                </div>
              </div>
            </div>

            {/* Biodiversity observations */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Observations
              </span>
              <div className="mt-4 flex items-center gap-3">
                <p className="font-heading text-4xl font-semibold tracking-tight">
                  36
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-primary/70"
                      style={{ opacity: 0.4 + (i % 3) * 0.3 }}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Recorded across project sites
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Interface preview — all values are illustrative demo data
          </p>
        </Reveal>
      </div>
    </section>
  )
}
