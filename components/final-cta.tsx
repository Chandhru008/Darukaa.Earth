import { Reveal } from '@/components/reveal'
import { ArrowRight } from 'lucide-react'

export function FinalCta() {
  return (
    <section id="explore" className="relative overflow-hidden">
      <div className="relative min-h-[70vh] w-full">
        <img
          src="/images/cta-forest.png"
          alt="Sweeping aerial view of an endless dense forest at golden hour"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col items-start justify-center px-5 py-24 sm:px-8">
          <Reveal>
            <h2 className="max-w-3xl font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Turn environmental data
              <span className="block text-muted-foreground">
                into environmental insight.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Explore a more connected way to understand carbon and biodiversity
              projects.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <a
              href="#top"
              className="group mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-medium text-primary-foreground transition-all duration-300 hover:brightness-110"
            >
              Explore Platform
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
