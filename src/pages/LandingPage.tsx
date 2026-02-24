import { useEffect } from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { EaseOfUseShowcase } from '../components/landing/EaseOfUseShowcase';
import { CalendarOrbitSection } from '../components/landing/CalendarOrbitSection';
import { InteractiveDemoSection } from '../components/landing/InteractiveDemoSection';
import { ICalDemoSection } from '../components/landing/ICalDemoSection';
import { EditorManifestoSection } from '../components/landing/EditorManifestoSection';
import { BetaCommunitySection } from '../components/landing/BetaCommunitySection';
import { RoadmapSection } from '../components/landing/RoadmapSection';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';

export default function LandingPage() {

  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation — BetaAnnouncementBar is rendered inside LandingNavbar */}
      <LandingNavbar />

      {/* Main Content */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <EaseOfUseShowcase />
        <CalendarOrbitSection />
        <ICalDemoSection />
        <InteractiveDemoSection />
        <EditorManifestoSection />
        <BetaCommunitySection />
        <RoadmapSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
