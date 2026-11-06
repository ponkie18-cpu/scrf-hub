import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Scale, 
  FileText, 
  Shield, 
  Bell, 
  ArrowRight, 
  ChevronRight,
  User,
  Users,
  Building,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  CheckCircle,
  Clock,
  FileCheck,
  Brain
} from "lucide-react";
import ContractRiskChecker from "@/components/compliance-risk/ContractRiskChecker";
import ContractClauseAnalyser from "@/components/compliance-risk/ContractClauseAnalyser";
import RegulatoryTracker from "@/components/compliance-risk/RegulatoryTracker";
import DataProtectionAudit from "@/components/compliance-risk/DataProtectionAudit";
import CognitiveBiasDetector from "@/components/behavioral/CognitiveBiasDetector";

const painPoints = [
  {
    icon: FileText,
    title: "Signing Contracts You Don't Fully Understand",
    description: "That nervous moment when you sign a 20-page contract hoping nothing buried in the fine print will come back to haunt you.",
    tip: "Use our Contract Risk Quick-Checker before signing any agreement."
  },
  {
    icon: AlertTriangle,
    title: "Finding Out About New Rules Too Late",
    description: "The shock of learning a regulation changed months ago—and you've been non-compliant without knowing it.",
    tip: "Subscribe to our Regulatory Tracker for personalized, timely updates."
  },
  {
    icon: Shield,
    title: "Your Brand Name Isn't Actually Protected",
    description: "The cold realisation that someone else could legally use your business name because you never registered it properly.",
    tip: "Complete the IP Self-Audit to identify protection gaps."
  },
  {
    icon: Bell,
    title: "Not Sure If You're Handling Data Legally",
    description: "The worry that you're collecting customer information but might be breaking privacy laws you don't fully understand.",
    tip: "Our Data Protection Audit will clarify your compliance duties."
  }
];

const scrfApplication = [
  {
    block: "Cognitive Reframing",
    application: "View contracts and regulations not as bureaucratic hurdles, but as essential frameworks that define and protect business relationships.",
    question: "Does this contract/rule create clarity and protection for us, or just impose burden?"
  },
  {
    block: "Foundational Literacy",
    application: "Learn to identify key clauses: Indemnification, Limitation of Liability, Termination Terms, and Data Processing Requirements.",
    question: "Can we spot the three most critical clauses in a standard service agreement?"
  },
  {
    block: "Procedural Rigor",
    application: "Systemize with a contract review checklist, a regulatory change calendar, and a document retention policy.",
    question: "Do we have a standard process for reviewing any contract before signing?"
  },
  {
    block: "Synergistic Engagement",
    application: "Build a trusted network: a lawyer for review, an industry body for updates, and team training on core compliance areas.",
    question: "Who is our designated 'first call' for legal questions, and when did we last consult them proactively?"
  }
];

const workflowSteps = [
  { step: 1, title: "Map & Inventory", description: "Key Contracts & Rules" },
  { step: 2, title: "Assess & Prioritise", description: "with Quick-Checker" },
  { step: 3, title: "Monitor & Track", description: "Regulatory Changes" },
  { step: 4, title: "Implement & Document", description: "Policies & Training" },
  { step: 5, title: "Schedule Annual", description: "Legal Health Review" }
];

const implementationPathways = [
  {
    icon: User,
    title: "Solo Entrepreneur",
    time: "< 1 hour",
    steps: [
      "Pick one active contract and run it through the Contract Risk Quick-Checker",
      "Use the Regulatory Tracker to subscribe to updates for your primary industry"
    ]
  },
  {
    icon: Users,
    title: "Small Team",
    time: "1-2 hours",
    steps: [
      "As a team, complete the Data Protection & IP Self-Audit",
      "Use the Quick-Checker on your standard service agreement template"
    ]
  },
  {
    icon: Building,
    title: "Growing Company",
    time: "Dedicate a week",
    steps: [
      "Inventory all active major contracts and run them through the Quick-Checker",
      "Set up a quarterly 'Regulatory Review' meeting using the Tracker output",
      "Draft a one-page 'Data Handling Policy' based on the Self-Audit and consult a lawyer to finalize it"
    ]
  }
];


const ComplianceLegalRisk = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Risk Domains</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Compliance & Legal Risk</span>
          </div>
          
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Scale className="h-4 w-4" />
              Compliance & Legal Risk Management
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Navigate Rules with <span className="text-primary">Confidence</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Transform regulatory complexity and contract uncertainty from hidden threats into structured, manageable processes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <a href="#tools">
                  Access Compliance Tools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#framework">Learn the Framework</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">
              The Rulebook of Your Business
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              For most SMEs, legal and compliance matters feel like a maze of invisible tripwires. 
              It's not just about "the law"—it's about contracts that protect you, regulations that change, 
              and intellectual property that forms your value. Ignorance isn't bliss; it's a silent risk 
              to your operations, reputation, and finances.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mt-4">
              This module applies the SCRF to demystify rules and paperwork. We shift the mindset 
              from reactive fear ("I hope this is okay") to proactive confidence ("We've documented our due diligence").
            </p>
            <p className="text-sm text-muted-foreground/70 mt-6 italic">
              This tool covers regulatory compliance obligations. Tax obligations (VAT, PAYE, income tax) fall outside the scope of this platform — please consult a registered tax practitioner for tax-specific guidance.
            </p>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Are Rules and Paperwork a Blind Spot?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Click each pain point to discover actionable solutions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {painPoints.map((point, index) => (
              <Card key={index} className="group hover:border-primary/50 transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <point.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{point.title}</CardTitle>
                      <CardDescription className="mt-2">{point.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-primary">{point.tip}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SCRF Application */}
      <section id="framework" className="py-16 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Applying the SCRF to Compliance & Legal Risk
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              How the four building blocks translate into legal and regulatory confidence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {scrfApplication.map((item, index) => (
              <Card key={index} className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-primary">{item.block}</CardTitle>
                  <CardDescription>{item.application}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">Key Question:</p>
                    <p className="text-sm text-muted-foreground italic mt-1">"{item.question}"</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Tools */}
      <section id="tools" className="py-16">
        <div className="container max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Compliance & Legal Toolkit
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Interactive tools to assess contracts, track regulations, and audit your data practices.
            </p>
          </div>
          
          <Tabs defaultValue="contract-checker" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="contract-checker" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">Quick Checker</span>
                <span className="md:hidden">Checker</span>
              </TabsTrigger>
              <TabsTrigger value="clause-analyser" className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                <span className="hidden md:inline">Clause Analyser</span>
                <span className="md:hidden">Analyser</span>
              </TabsTrigger>
              <TabsTrigger value="regulatory-tracker" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden md:inline">Regulatory Tracker</span>
                <span className="md:hidden">Regulations</span>
              </TabsTrigger>
              <TabsTrigger value="data-audit" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden md:inline">Data & IP Audit</span>
                <span className="md:hidden">Data/IP</span>
              </TabsTrigger>
              <TabsTrigger value="bias-detector" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden md:inline">Risk Psychology</span>
                <span className="md:hidden">Biases</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="contract-checker">
              <ContractRiskChecker />
            </TabsContent>
            <TabsContent value="clause-analyser">
              <ContractClauseAnalyser />
            </TabsContent>
            <TabsContent value="regulatory-tracker">
              <RegulatoryTracker />
            </TabsContent>
            <TabsContent value="data-audit">
              <DataProtectionAudit />
            </TabsContent>
            <TabsContent value="bias-detector">
              <CognitiveBiasDetector />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              The Proactive Compliance Workflow
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A 5-step cycle for building legal and regulatory confidence.
            </p>
          </div>
          
          <div className="relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
              {workflowSteps.map((step, index) => (
                <div key={step.step} className="flex items-center gap-2 md:gap-0 w-full md:w-auto">
                  <div className="flex flex-col items-center text-center p-4 md:p-6 bg-primary/5 rounded-xl border border-primary/20 flex-1 md:flex-initial md:min-w-[160px]">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-3">
                      {step.step}
                    </div>
                    <h4 className="font-semibold text-sm">{step.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-primary shrink-0 hidden md:block" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Continuous feedback loop for ongoing improvement
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Pathway */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Start Here: Implementation Pathway
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose your starting point based on your team size and available time.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {implementationPathways.map((pathway, index) => (
              <Card key={index} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <pathway.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pathway.title}</CardTitle>
                      <CardDescription>Time: {pathway.time}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {pathway.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                          {stepIndex + 1}
                        </span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Cross-linking CTA */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4 md:px-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-2xl font-display font-bold mb-4">
                  Explore Other Risk Domains
                </h3>
                <p className="text-muted-foreground mb-8">
                  Compliance connects directly with operational processes and financial planning. 
                  Continue building your resilience framework.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button asChild variant="outline">
                    <Link to="/operational-risk">
                      <FileCheck className="mr-2 h-4 w-4" />
                      Operational Risk
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/financial-risk">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Financial & Tax Risk
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ComplianceLegalRisk;
