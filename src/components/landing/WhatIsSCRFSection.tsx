import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, Users, ShieldCheck } from "lucide-react";

const benefits = [
  {
    icon: Target,
    title: "See the Full Picture",
    description: "Instead of juggling separate worries about operations, finances, compliance, and strategy—see how they connect and affect each other.",
  },
  {
    icon: TrendingUp,
    title: "Move from Reactive to Proactive",
    description: "Stop fighting fires. Build simple habits that help you spot problems early and prevent them from becoming crises.",
  },
  {
    icon: Users,
    title: "Get Everyone on the Same Page",
    description: "Create a shared language for risk across your team, so conversations are clearer and decisions happen faster.",
  },
  {
    icon: ShieldCheck,
    title: "Build Lasting Confidence",
    description: "Know that your business can handle surprises—whether it's a supply chain hiccup, a cash flow dip, or a new regulation.",
  },
];

const WhatIsSCRFSection = () => {
  return (
    <section id="what-is-scrf" className="section-padding bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            What is SCRF?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The <span className="font-semibold text-foreground">Strategic Compliance & Risk Framework</span> is 
            a practical approach to help small and medium businesses manage uncertainty with confidence. 
            It's not about ticking boxes or drowning in paperwork—it's about building a resilient business 
            that can adapt and thrive.
          </p>
        </div>

        <div className="mb-12">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-0">
            <CardContent className="p-8 text-center">
              <p className="text-xl md:text-2xl font-display font-medium text-foreground leading-relaxed">
                "Think of SCRF as your business's immune system—it helps you stay healthy, 
                recover quickly when things go wrong, and grow stronger over time."
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            SCRF is built on four simple building blocks that work together. 
            You don't need to be a risk expert—just willing to take small, consistent steps toward better resilience.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WhatIsSCRFSection;
