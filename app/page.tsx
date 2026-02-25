import { Suspense } from "react";
import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Features from "@/components/features";
import Stations from "@/components/stations";
import Pricing from "@/components/pricing";
import Tournaments from "@/components/tournaments";
import Footer from "@/components/footer";
import ScrollExitSection from "@/components/scroll-exit-section";
import FixedBoxBackground from "@/components/fixed-box-background";
import AuthErrorBanner from "@/components/auth-error-banner";

export default function Home() {
  return (
    <main className="relative overflow-x-hidden">
      {/* 3D box: fixed, always visible, the only background */}
      <FixedBoxBackground />
      {/* Content scrolls up over the box */}
      <div className="relative z-10">
        <Suspense fallback={null}>
          <AuthErrorBanner />
        </Suspense>
        <Navbar />
        <ScrollExitSection>
        <Hero />
      </ScrollExitSection>
      <ScrollExitSection>
        <Features />
      </ScrollExitSection>
      <ScrollExitSection>
        <Stations />
      </ScrollExitSection>
      <Pricing />
      <Tournaments />
      <ScrollExitSection>
        <Footer />
      </ScrollExitSection>
      </div>
    </main>
  );
}
