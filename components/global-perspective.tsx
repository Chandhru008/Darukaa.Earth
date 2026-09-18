import { GisOverlay } from '@/components/gis-overlay'
import { Reveal } from '@/components/reveal'
import { SectionLabel } from '@/components/section-label'

export function GlobalPerspective() {
  return (
    <section
      id="about"
      className="relative overflow-hidden border-t border-border/60 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal className="flex justify-center">
            <SectionLabel>Global perspective</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              One planet. Connected data.
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Environmental projects exist across landscapes, ecosystems, and
              borders. Understand them through a common geographical lens.
            </p>
          </Reveal>
        </div>

        <Reveal delay={160} y={36}>
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="relative aspect-square overflow-hidden rounded-full">
              <img
                src="/images/earth-space.png"
                alt="Photorealistic view of planet Earth from space showing green landmasses and oceans"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-border" />
              <GisOverlay
                markers={[
                  { x: 66, y: 46, label: 'India' },
                  { x: 74, y: 56, label: 'SE Asia' },
                  { x: 34, y: 66, label: 'South America' },
                  { x: 52, y: 58, label: 'Africa' },
                ]}
              />
              {/* soft glow */}
              <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_120px_40px_oklch(0.17_0.006_155_/_0.7)]" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Illustrative representation — not indicative of current operations
          </p>
        </Reveal>
      </div>
    </section>
  )
}
