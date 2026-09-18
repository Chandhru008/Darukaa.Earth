import { BiodiversitySection } from '@/components/biodiversity-section'
import { CarbonSection } from '@/components/carbon-section'
import { DataVizSection } from '@/components/data-viz-section'
import { FinalCta } from '@/components/final-cta'
import { GlobalPerspective } from '@/components/global-perspective'
import { Hero } from '@/components/hero'
import { HowItWorks } from '@/components/how-it-works'
import { LocationToInsight } from '@/components/location-to-insight'
import { ProjectMap } from '@/components/project-map'
import { SiteFooter } from '@/components/site-footer'
import { SiteNav } from '@/components/site-nav'

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <Hero />
        <LocationToInsight />
        <ProjectMap />
        <CarbonSection />
        <BiodiversitySection />
        <DataVizSection />
        <HowItWorks />
        <GlobalPerspective />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
