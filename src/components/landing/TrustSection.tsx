import { Card } from "@/components/ui/card";
import { Users, Eye, MapPin, Building2 } from "lucide-react";

const points = [
  {
    icon: Users,
    title: "Designed for SME teams",
    body: "Built for SME owners, operations leads, and internal practitioners — not enterprise risk departments.",
  },
  {
    icon: Eye,
    title: "Proactive, not reactive",
    body: "Focused on visibility and prevention instead of crisis firefighting.",
  },
  {
    icon: MapPin,
    title: "South African business realities",
    body: "Covers POPIA, CIPC, labour, contracts, cyber exposure, cash flow pressure, and operational continuity.",
  },
  {
    icon: Building2,
    title: "Built by Tsa Dinaledi",
    body: "Part of the Tsa Dinaledi SME resilience and decision-support ecosystem.",
  },
];

const TrustSection = () => {
  return (
    <section id="about" className="section-padding bg-muted/30">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Built for South African SMEs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            SCRF Hub is a Tsa Dinaledi platform built to help South African SMEs
            strengthen resilience, visibility, and decision-making.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {points.map((p) => (
            <Card key={p.title} className="p-6">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-3">
                <p.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;