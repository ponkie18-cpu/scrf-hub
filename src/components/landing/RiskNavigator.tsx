import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  TrendingUp, 
  FileText, 
  Compass,
  ArrowRight,
  Wrench,
  Calculator,
  Shield,
  Search
} from "lucide-react";

const riskDomains = [
  {
    id: "operational",
    title: "Operational",
    tagline: "Secure your daily operations",
    href: "/operational-risk",
    icon: Target,
    color: "bg-blue-500",
    tools: [
      { name: "SPOF Finder", icon: Search },
      { name: "Process Documentation", icon: FileText },
      { name: "BIA Lite", icon: Calculator },
    ],
  },
  {
    id: "financial",
    title: "Financial Risk",
    tagline: "Protect your bottom line",
    href: "/financial-risk",
    icon: TrendingUp,
    color: "bg-green-500",
    tools: [
      { name: "Cash Flow Stress Test", icon: Calculator },
      { name: "Health Scorecard", icon: Shield },
    ],
  },
  {
    id: "compliance",
    title: "Compliance & Legal",
    tagline: "Navigate rules with confidence",
    href: "/compliance-risk",
    icon: FileText,
    color: "bg-purple-500",
    tools: [
      { name: "Contract Quick-Checker", icon: FileText },
      { name: "Regulatory Tracker", icon: Search },
      { name: "IP Self-Audit", icon: Shield },
    ],
  },
  {
    id: "strategic",
    title: "Strategic & Cyber",
    tagline: "Future-proof your business",
    href: "/strategic-cyber-risk",
    icon: Compass,
    color: "bg-amber-500",
    tools: [
      { name: "Horizon Scanner", icon: Compass },
      { name: "Cyber Scorecard", icon: Shield },
      { name: "Response Playbook", icon: FileText },
    ],
  },
];

const RiskNavigator = () => {
  return (
    <section id="risk-navigator" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Wrench className="h-3 w-3 mr-1" />
            Interactive Toolkit
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Explore Your Risk Domains
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each domain includes specialized tools to assess, monitor, and improve your resilience. 
            Click to explore and access practical resources.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {riskDomains.map((domain) => (
            <Card 
              key={domain.id} 
              className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 flex flex-col"
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${domain.color} flex items-center justify-center mb-3`}>
                  <domain.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{domain.title}</CardTitle>
                <CardDescription>{domain.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-2 mb-4 flex-1">
                  {domain.tools.map((tool) => (
                    <div 
                      key={tool.name} 
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <tool.icon className="h-3 w-3" />
                      {tool.name}
                    </div>
                  ))}
                </div>
                <Link to={domain.href}>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Explore
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RiskNavigator;
