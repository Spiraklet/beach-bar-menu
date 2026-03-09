'use client'

import { LanguageProvider } from '@/components/landing/LanguageContext'
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import AboutSection from '@/components/landing/AboutSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import WaveDivider from '@/components/landing/WaveDivider'

export default function HomePage() {
  return (
    <LanguageProvider>
      <main className="landing overflow-hidden">
        <HeroSection />
        <WaveDivider
          topColor="transparent"
          bottomColor="hsl(var(--background))"
          strokeColor="hsl(var(--primary))"
        />
        <FeaturesSection />
        <WaveDivider
          topColor="hsl(var(--background))"
          bottomColor="hsl(var(--background))"
          strokeColor="hsl(var(--primary))"
        />
        <AboutSection />
        <WaveDivider
          topColor="hsl(var(--section-dark))"
          bottomColor="hsl(var(--section-dark))"
          strokeColor="hsl(var(--section-dark-foreground))"
        />
        <CTASection />
        <Footer />
      </main>
    </LanguageProvider>
  )
}
