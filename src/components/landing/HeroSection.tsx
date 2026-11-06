import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import scrfLogo from "@/assets/SCRF_Logo.png";

const HeroSection = () => {
  const navigate = useNavigate();

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden pt-24 pb-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container relative z-10 px-4 md:px-8 text-center max-w-4xl mx-auto">
        <div className="mb-6">
          <img src={scrfLogo} alt="SCRF Hub by Tsa Dinaledi" className="h-20 md:h-24 w-auto mx-auto" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-primary/20 bg-primary/5 text-xs md:text-sm text-primary font-medium">
          A Tsa Dinaledi platform · Built for South African SMEs
        </div>

        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
          Your SME Resilience{" "}
          <span className="text-gradient">SaaS Platform</span>
        </h1>

        <p className="text-base md:text-lg text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
          SCRF Hub helps South African SMEs understand their operational, financial,
          compliance, strategic, and cyber risks before problems become crises.
        </p>
        <p className="text-sm md:text-base text-muted-foreground/90 mb-8 max-w-2xl mx-auto">
          Get a single resilience score, practical diagnostics, AI-generated action
          guidance, and progress tracking in one self-serve platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-base px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Start Free
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => scrollTo("pricing")}
            className="text-base px-8 py-6 rounded-full"
          >
            Try Pro
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollTo("tools")}
            className="text-base px-8 py-6 rounded-full"
          >
            View Diagnostic Tools
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          No credit card required · 14-day Pro trial available
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
