import { Card } from "@/components/ui/card";
import { ClipboardList, Gauge, Sparkles, Target } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Run a diagnostic",
    body: "Use guided tools to assess key areas of your business, including cash flow, operations, compliance, contracts, cyber posture, and strategic risks.",
  },
  {
    icon: Gauge,
    title: "Get your Resilience Health Score",
    body: "SCRF Hub converts your inputs into a clear 0–100 resilience score across four domains: Operational, Financial, Compliance & Legal, and Strategic & Cyber.",
  },
  {
    icon: Sparkles,
    title: "Receive AI-assisted insights",
    body: "The AI Auditor flags weak points, while the AI CFO-style assistant explains financial pressure and decision risks in plain language.",
  },
  {
    icon: Target,
    title: "Turn insights into action",
    body: "Use the Action Center to track tasks, monitor progress, and improve your resilience score over time.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="section-padding bg-muted/30">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            How SCRF Hub Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From first diagnostic to measurable progress — in four practical steps.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-3xl font-display font-bold text-primary/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;