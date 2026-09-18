import { LineChart } from '@/components/line-chart'
import { Reveal } from '@/components/reveal'
import { SectionLabel } from '@/components/section-label'

export function CarbonSection() {
  return (
    <section id="insights" className="relative border-t border-border/60 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: image */}
          <Reveal y={28}>
            <div className="relative overflow-hidden rounded-3xl border border-border">
              <div className="aspect-[4/5] sm:aspect-[4/4]">
                <img
                  src="/images/carbon-reforestation.png"
                  alt="Reforestation landscape with rolling hills of trees in morning mist"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>
          </Reveal>

          {/* Right: content + chart */}
          <div>
            <Reveal>
              <SectionLabel>Carbon</SectionLabel>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
                Measure environmental performance.
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
                Understand how environmental conditions change across project
                sites through structured monitoring and historical data.
              </p>
            </Reveal>

            <Reveal delay={200} y={24}>
              <div className="mt-10 rounded-2xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-heading text-sm font-medium">
                    Environmental Performance
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                    Illustrative
                  </span>
                </div>
                <LineChart
                  data={[42, 55, 61, 78]}
                  labels={['2022', '2023', '2024', '2025']}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
