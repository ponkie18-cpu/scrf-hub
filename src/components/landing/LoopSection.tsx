import { Brain, BookOpen, Shield, Handshake, ArrowRight, RefreshCw } from "lucide-react";

const pillars = [
  { icon: Brain, label: "Understand", sublabel: "Reframe mindset", color: "bg-primary" },
  { icon: BookOpen, label: "Learn", sublabel: "Build literacy", color: "bg-pillar-2" },
  { icon: Shield, label: "Execute", sublabel: "Apply rigor", color: "bg-pillar-3" },
  { icon: Handshake, label: "Engage", sublabel: "Collaborate", color: "bg-pillar-4" },
];

const LoopSection = () => {
  return (
    <section className="section-padding bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            A Continuous Improvement Cycle
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            SCRF isn't a one-time audit. It's an ongoing cycle that strengthens resilience with each iteration:
            <span className="block mt-2 font-medium text-foreground">Understand → Reframe → Execute → Engage → Repeat</span>
          </p>
        </div>

        {/* Simple visual cycle */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {pillars.map((pillar, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-4 bg-card border rounded-xl hover:shadow-md transition-shadow"
            >
              <div className={`p-2 ${pillar.color} rounded-lg flex-shrink-0`}>
                <pillar.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{pillar.label}</p>
                <p className="text-xs text-muted-foreground">{pillar.sublabel}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Repeat indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium">
            <RefreshCw className="h-4 w-4" />
            <span>Each cycle builds stronger resilience</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoopSection;
