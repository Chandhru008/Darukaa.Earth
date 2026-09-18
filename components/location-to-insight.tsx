import { GisOverlay } from '@/components/gis-overlay'
import { Reveal } from '@/components/reveal'
import { SectionLabel } from '@/components/section-label'

const CARDS = [
  {
    label: '01 — Map',
    title: 'Define the site',
    description:
      'Map and define geographical project boundaries with precision.',
    image: '/images/card-map.png',
    alt: 'Satellite imagery of a forested landscape with a geographic boundary',
    overlay: (
      <GisOverlay
        polygons={['24,30 62,22 74,52 48,72 22,58']}
        markers={[{ x: 46, y: 46 }]}
      />
    ),
  },
  {
    label: '02 — Data',
    title: 'Connect environmental data',
    description:
      'Bring geographical and environmental information together around each project site.',
    image: '/images/card-canopy.png',
    alt: 'Overhead view of a dense forest canopy',
    overlay: (
      <GisOverlay
        markers={[
          { x: 30, y: 38 },
          { x: 58, y: 30 },
          { x: 46, y: 62 },
          { x: 72, y: 56 },
        ]}
      />
    ),
  },
  {
    label: '03 — Insight',
    title: 'Understand change',
    description:
      'Turn environmental measurements into clear insights and trends over time.',
    image: '/images/satellite-tile.png',
    alt: 'Environmental data visualization over satellite imagery',
    overlay: <InsightOverlay />,
  },
]

function InsightOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-4 bottom-4 rounded-lg border border-border/70 bg-background/70 p-3 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            Vegetation Index
          </span>
          <span className="font-mono text-[9px] text-primary">+ illustrative</span>
        </div>
        <svg viewBox="0 0 200 48" className="h-10 w-full" preserveAspectRatio="none">
          <polyline
            points="0,38 28,32 56,34 84,22 112,26 140,14 168,18 200,8"
            fill="none"
            stroke="oklch(0.72 0.13 150)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  )
}

export function LocationToInsight() {
  return (
    <section id="platform" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <Reveal>
            <SectionLabel>The workflow</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              From location to insight.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Every environmental project starts with a place. Darukaa.Earth
              connects that place with the data needed to understand what is
              happening on the ground.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 120} y={28}>
              <article className="group h-full overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-500 hover:border-primary/40">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={card.image || '/placeholder.svg'}
                    alt={card.alt}
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
                  {card.overlay}
                </div>
                <div className="p-6">
                  <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
                    {card.label}
                  </span>
                  <h3 className="mt-4 font-heading text-xl font-semibold tracking-tight">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
