import { Reveal } from '@/components/reveal'
import { SectionLabel } from '@/components/section-label'
import { Activity, MapPin, PenLine, TrendingUp } from 'lucide-react'

const STEPS = [
  {
    num: '01',
    label: 'Define',
    icon: MapPin,
    text: 'Create a project and define its geographical sites.',
  },
  {
    num: '02',
    label: 'Map',
    icon: PenLine,
    text: 'Draw and visualize site boundaries.',
  },
  {
    num: '03',
    label: 'Analyze',
    icon: Activity,
    text: 'Connect environmental information to each geographical site.',
  },
  {
    num: '04',
    label: 'Monitor',
    icon: TrendingUp,
    text: 'Understand environmental performance and changes over time.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative border-t border-border/60 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <Reveal>
            <SectionLabel>How it works</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-5 font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              Place, data, analysis, insight.
            </h2>
          </Reveal>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <Reveal key={step.num} delay={i * 110}>
                <div className="group relative h-full bg-card p-7 transition-colors duration-500 hover:bg-muted/40">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs tracking-[0.2em] text-primary">
                      {step.num}
                    </span>
                    <Icon className="h-5 w-5 text-muted-foreground transition-colors duration-500 group-hover:text-primary" />
                  </div>
                  <h3 className="mt-10 font-heading text-lg font-semibold uppercase tracking-wide">
                    {step.label}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
