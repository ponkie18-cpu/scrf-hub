import { Card } from "@/components/ui/card";
import { ShieldCheck, Calculator } from "lucide-react";

const AIAssistantsSection = () => {
  return (
    <section id="ai-support" className="section-padding">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            AI Support That Makes Business Risk Easier to Understand
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Two AI assistants work alongside you — one watches for risk, the other
            translates the numbers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 hover:shadow-xl transition-shadow">
            <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-display text-2xl font-semibold mb-3">AI Auditor</h3>
            <p className="text-muted-foreground leading-relaxed">
              Runs structured resilience checks, identifies gaps, flags what is slipping,
              and helps you see where your business is exposed.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-shadow">
            <div className="p-3 bg-accent/10 rounded-xl w-fit mb-4">
              <Calculator className="h-7 w-7 text-accent" />
            </div>
            <h3 className="font-display text-2xl font-semibold mb-3">
              AI CFO-style Assistant
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Helps explain financial pressure, cash flow stress, runway concerns, and
              business decision risks in plain language. It supports visibility and
              decision-making; it does not replace professional financial, tax, legal,
              or audit advice.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AIAssistantsSection;