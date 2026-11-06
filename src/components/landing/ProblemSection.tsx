import { Layers, Flame, RefreshCcw, AlertTriangle } from "lucide-react";

const problems = [
  {
    icon: Layers,
    title: "Siloed View of Threats",
    description: "Tackling operational, financial, or compliance risks in isolation, missing their connections and compounding effects.",
  },
  {
    icon: Flame,
    title: "Reactive Fire-Drills",
    description: "Constantly responding to incidents—supply chain disruptions, cash flow gaps, regulatory changes—instead of anticipating them.",
  },
  {
    icon: RefreshCcw,
    title: "Inconsistent Processes",
    description: "Lacking a single framework to assess vendor, cyber, and market risks uniformly across the business.",
  },
  {
    icon: AlertTriangle,
    title: "Leadership Stress",
    description: "Uncertainty about the organisation's true risk exposure affecting strategic decisions and sleep at night.",
  },
];

const ProblemSection = () => {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Sound Familiar?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Most SME leaders face these challenges every day. Traditional risk management 
            models don't account for your reality—they just add more complexity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="group p-6 bg-card rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <problem.icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg mb-2">{problem.title}</h3>
                  <p className="text-muted-foreground">{problem.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center p-8 bg-gradient-to-r from-primary/10 via-secondary to-accent/10 rounded-2xl">
          <p className="text-xl font-display font-semibold mb-2">
            There's a better way.
          </p>
          <p className="text-muted-foreground">
            The SCRF transforms risk management from a reactive burden into a proactive, 
            integrated system that builds business resilience.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
