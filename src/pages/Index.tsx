import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import AIAssistantsSection from "@/components/landing/AIAssistantsSection";
import DiagnosticToolsSection from "@/components/landing/DiagnosticToolsSection";
import PricingSection from "@/components/landing/PricingSection";
import TrustSection from "@/components/landing/TrustSection";
import WhatIsSCRFSection from "@/components/landing/WhatIsSCRFSection";
import DisclaimerSection from "@/components/landing/DisclaimerSection";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <AIAssistantsSection />
        <DiagnosticToolsSection />
        <PricingSection />
        <TrustSection />
        <WhatIsSCRFSection />
        <ContactSection />
        <DisclaimerSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
