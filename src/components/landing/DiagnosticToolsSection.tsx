import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Network, Wallet, FileText, ShieldAlert, Telescope, BookOpen,
  ClipboardCheck, Activity, TrendingDown, Handshake, ListChecks, FileBarChart,
} from "lucide-react";

const tools = [
  { icon: Network, name: "SPOF Finder", desc: "Identify single points of failure in your operations." },
  { icon: Wallet, name: "Cash Flow Stress Test", desc: "See how your runway holds under pressure scenarios." },
  { icon: FileText, name: "Contract Clause Analyser", desc: "Spot risky clauses in supplier and customer contracts." },
  { icon: ShieldAlert, name: "Cyber Scorecard", desc: "Benchmark your cyber posture against SME norms." },
  { icon: Telescope, name: "Horizon Scanner", desc: "Track emerging risks before they hit your business." },
  { icon: BookOpen, name: "Incident Playbook Builder", desc: "Generate response playbooks for likely incidents." },
  { icon: ClipboardCheck, name: "Compliance Readiness Check", desc: "POPIA, CIPC, labour and sector basics in one view." },
  { icon: Activity, name: "Operational Continuity Review", desc: "Map dependencies and continuity gaps." },
  { icon: TrendingDown, name: "Financial Pressure Review", desc: "Translate financial stress signals into plain language." },
  { icon: Handshake, name: "Supplier & Partner Risk Check", desc: "Score reliability and concentration risk." },
  { icon: ListChecks, name: "Action Plan Builder", desc: "Turn findings into prioritised, trackable actions." },
  { icon: FileBarChart, name: "Resilience Report Generator", desc: "Export a board-ready resilience snapshot." },
];

const DiagnosticToolsSection = () => {
  const navigate = useNavigate();

  return (
    <section id="tools" className="section-padding">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Interactive Diagnostic Tools
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Self-serve tools across every risk domain — built for SME owners, not consultants.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((t) => (
            <Card key={t.name} className="p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <t.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button size="lg" onClick={() => navigate("/auth")} className="rounded-full px-8">
            Start Free to Use the Tools
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DiagnosticToolsSection;