import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const freeFeatures = [
  "Access to 3 diagnostic tools",
  "Basic resilience scoring",
  "Limited reports",
  "No credit card required",
];

const proFeatures = [
  "Full platform access",
  "All diagnostic tools",
  "AI Auditor",
  "AI CFO-style Assistant",
  "Unlimited saves",
  "Exportable reports",
  "Action Center & progress tracking",
  "14-day free trial",
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="section-padding bg-muted/30">
      <div className="container max-w-5xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Simple, SME-Friendly Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free. Upgrade when you're ready for the full AI Auditor and
            CFO-style assistant.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 flex flex-col">
            <h3 className="font-display text-xl font-semibold mb-1">Free</h3>
            <div className="mb-1">
              <span className="text-4xl font-display font-bold">R0</span>
              <span className="text-muted-foreground"> / forever</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Try the platform with no commitment.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
              Start Free
            </Button>
          </Card>

          <Card className="p-8 flex flex-col border-primary/40 shadow-lg relative">
            <div className="absolute -top-3 left-8 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1">
              <Crown className="h-3 w-3" /> Most Popular
            </div>
            <h3 className="font-display text-xl font-semibold mb-1">Pro</h3>
            <div className="mb-1">
              <span className="text-4xl font-display font-bold">R299</span>
              <span className="text-muted-foreground"> / month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              or R2,990 / year · 14-day free trial
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Try Pro
            </Button>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Pricing may be refined as the platform evolves through pilot testing and customer feedback.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;