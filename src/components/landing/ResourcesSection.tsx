import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, FileSpreadsheet, FileCheck, Users, Play } from "lucide-react";
import RiskHeatMapGenerator from "@/components/tools/RiskHeatMapGenerator";
import RiskRegister from "@/components/tools/RiskRegister";
import BCPBuilder from "@/components/tools/BCPBuilder";
import VendorAssessment from "@/components/tools/VendorAssessment";

const tools = [
  {
    icon: BarChart3,
    title: "SME Risk Heat Map Generator",
    description: "An interactive tool to visually plot risks by likelihood and impact across all domains.",
    cta: "Create Heat Map",
    component: RiskHeatMapGenerator,
  },
  {
    icon: FileSpreadsheet,
    title: "Unified Risk Register",
    description: "A central log for operational, supply chain, financial, and cyber risks in one place.",
    cta: "Build Register",
    component: RiskRegister,
  },
  {
    icon: FileCheck,
    title: "Business Continuity Plan Builder",
    description: "A step-by-step guide for critical process recovery when incidents occur.",
    cta: "Create BCP",
    component: BCPBuilder,
  },
  {
    icon: Users,
    title: "Vendor Risk Assessment",
    description: "A standardised questionnaire to evaluate third-party partners and suppliers.",
    cta: "Assess Vendor",
    component: VendorAssessment,
  },
];

const ResourcesSection = () => {
  const [openTool, setOpenTool] = useState<number | null>(null);

  return (
    <section id="resources" className="section-padding bg-primary/5">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Free Interactive Tools
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start building your risk resilience today—no consulting required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tools.map((tool, index) => (
            <Dialog key={index} open={openTool === index} onOpenChange={(open) => setOpenTool(open ? index : null)}>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30 flex flex-col">
                <CardHeader className="flex-1">
                  <div className="p-3 bg-secondary rounded-lg w-fit mb-2 group-hover:bg-primary/10 transition-colors">
                    <tool.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-display text-lg">{tool.title}</CardTitle>
                  <CardDescription className="text-sm">{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      {tool.cta}
                    </Button>
                  </DialogTrigger>
                </CardContent>
              </Card>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <tool.icon className="h-5 w-5 text-primary" />
                    {tool.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <tool.component />
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {/* Value proposition */}
        <Card className="max-w-2xl mx-auto border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="py-8 text-center">
            <h3 className="font-display text-xl font-semibold mb-2">
              Start Building Resilience Now
            </h3>
            <p className="text-muted-foreground">
              These tools work directly in your browser. No downloads, no sign-ups required.
              Export your work anytime as CSV or Markdown files.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ResourcesSection;