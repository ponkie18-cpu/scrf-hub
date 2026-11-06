import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowRight, ClipboardCheck, RefreshCw, BarChart3 } from "lucide-react";

const services = [
  {
    icon: ClipboardCheck,
    title: "Internal Control Audit & Assessment",
    description: "A comprehensive review of your business processes, controls, and risk exposures to identify gaps and strengthen your operational foundation.",
    features: ["Process documentation review", "Control gap analysis", "Risk exposure mapping", "Prioritised recommendations"],
    cta: "Request an Audit",
  },
  {
    icon: Users,
    title: "SCRF Implementation Consulting",
    description: "One-on-one guidance to implement the full SCRF approach tailored to your specific business needs and risk situation.",
    features: ["Personalized assessment", "Custom action plan", "Ongoing support"],
    cta: "Book Consultation",
  },
  {
    icon: BarChart3,
    title: "Financial Intelligence Reporting",
    description: "AI-powered insights delivered through clear, actionable reports. Cash flow forecasting, scenario modeling, and risk scorecards—translated into plain English.",
    features: ["Cash flow tracking & forecasting", "What-if scenario modeling", "Board-ready report generation", "Risk scorecards with AI accuracy"],
    cta: "Explore Insights",
  },
  {
    icon: RefreshCw,
    title: "Retainer & Ongoing Advisory",
    description: "Continuous support to keep your risk management practices current, with regular check-ins and proactive guidance as your business evolves.",
    features: ["Monthly review sessions", "Priority access to advisors", "Regulatory update alerts", "Quarterly health reports"],
    cta: "Learn About Retainers",
  },
];

const ServicesSection = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="services" className="section-padding">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Professional Services
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Need hands-on support implementing the SCRF? Our expert services can help 
            you achieve compliance excellence faster.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card 
              key={index}
              className="group flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl w-fit mb-2 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                  <service.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="font-display text-xl">{service.title}</CardTitle>
                <CardDescription className="text-base">{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={scrollToContact}
                >
                  {service.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
