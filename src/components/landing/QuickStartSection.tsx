import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, ClipboardCheck, Rocket } from "lucide-react";

const pathways = [
  {
    id: "quick",
    title: "30-Minute Audit",
    duration: "30 min",
    icon: Clock,
    description: "Quick health check across all four risk domains",
    action: "Begin",
    variant: "default" as const,
  },
  {
    id: "weekly",
    title: "Weekly Maintenance",
    duration: "Weekly",
    icon: Calendar,
    description: "Regular risk monitoring and minor adjustments",
    action: "Schedule",
    variant: "outline" as const,
  },
  {
    id: "deep",
    title: "In-Depth Assessment",
    duration: "1-2 hours",
    icon: ClipboardCheck,
    description: "Comprehensive audit across all four domains",
    action: "Book",
    variant: "outline" as const,
  },
];

const QuickStartSection = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4">
            <Rocket className="h-3 w-3 mr-1" />
            Get Started
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            New to Risk Management? Start Here
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Choose a pathway that fits your schedule and needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pathways.map((pathway) => (
            <Card 
              key={pathway.id} 
              className={`hover:shadow-md transition-all ${
                pathway.id === "quick" ? "border-primary/50 bg-primary/5" : ""
              }`}
            >
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <pathway.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-lg">{pathway.title}</CardTitle>
                <Badge variant="outline" className="w-fit mx-auto">
                  {pathway.duration}
                </Badge>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="mb-4 min-h-[40px]">
                  {pathway.description}
                </CardDescription>
                <Button 
                  variant={pathway.variant} 
                  className="w-full"
                  onClick={scrollToContact}
                >
                  {pathway.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickStartSection;
