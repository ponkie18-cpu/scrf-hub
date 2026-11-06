import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Cog, 
  Users, 
  Package, 
  Server,
  Brain,
  BookOpen,
  Shield,
  Handshake,
  Clock,
  UserCheck,
  Building2,
  ArrowRight,
  FileText,
  CheckCircle2,
  Lightbulb
} from "lucide-react";
import SPOFFinder from "@/components/operational-risk/SPOFFinder";
import ProcessDocBuilder from "@/components/operational-risk/ProcessDocBuilder";
import BIALite from "@/components/operational-risk/BIALite";

const painPoints = [
  {
    icon: Users,
    title: "The Panic When Only One Person Knows",
    description: "That sick feeling when your key employee calls in sick—and they're the only one who can run the critical system.",
    tip: "Use our SPOF Finder tool below to identify and document these vulnerabilities.",
  },
  {
    icon: FileText,
    title: "Processes Trapped in People's Heads",
    description: "The chaos when someone leaves and takes years of institutional knowledge with them overnight.",
    tip: "The Process Documentation Builder helps create simple SOPs in minutes.",
  },
  {
    icon: Cog,
    title: "Exhausting Firefighting Every Single Day",
    description: "The burnout of constantly reacting to the same problems—quality defects, shipment errors, customer complaints—that never get fixed.",
    tip: "Breaking this cycle starts with identifying root causes, not just symptoms.",
  },
  {
    icon: Package,
    title: "One Bad Month Away from Disaster",
    description: "The dread of knowing a minor hiccup—a late payment, a supplier delay—could spiral into a cash flow crisis.",
    tip: "Use the BIA Lite to prioritise which processes need contingency plans first.",
  },
];

const scrfBlocks = [
  {
    icon: Brain,
    title: "Cognitive Reframing",
    application: "View operational hiccups not as failures, but as system feedback. Each incident reveals a chance to strengthen a process.",
    question: "What is this problem telling us about a weakness in our system?",
  },
  {
    icon: BookOpen,
    title: "Foundational Literacy",
    application: "Learn to map and label key components: Single Point of Failure (SPOF), Process Map, Business Impact Analysis (BIA).",
    question: "Can we visually map our most critical process and identify its SPOFs?",
  },
  {
    icon: Shield,
    title: "Procedural Rigor",
    application: "Systemize with Standard Operating Procedures (SOPs), backup supplier lists, and cross-training schedules.",
    question: "Do we have a clear, written playbook for our top 5 critical operations?",
  },
  {
    icon: Handshake,
    title: "Synergistic Engagement",
    application: "Make risk everyone's job. The warehouse staff spots supply issues; customer service hears about process failures first.",
    question: "Who, outside of leadership, is responsible for flagging operational risks this month?",
  },
];

const workflowSteps = [
  { step: 1, title: "Identify Critical Processes", description: "List operations that would cause significant harm if disrupted" },
  { step: 2, title: "Find Single Points of Failure", description: "Identify irreplaceable people, suppliers, tools, or systems" },
  { step: 3, title: "Document & Cross-Train", description: "Create SOPs and ensure backup knowledge exists" },
  { step: 4, title: "Develop Contingency Plans", description: "Plan B for when things go wrong" },
  { step: 5, title: "Review & Adapt Quarterly", description: "Keep plans current as business evolves" },
];

const implementationPaths = [
  {
    icon: UserCheck,
    title: "Solo Entrepreneur",
    time: "< 1 hour",
    steps: [
      "Use the SPOF Finder on just ONE critical process",
      "Brainstorm one quick backup (e.g., alternative freelance help)",
    ],
  },
  {
    icon: Users,
    title: "Small Team",
    time: "1-2 hours",
    steps: [
      "Run the SPOF Finder with your team in a 30-minute meeting",
      "Use the Process Builder to document the most vulnerable process",
    ],
  },
  {
    icon: Building2,
    title: "Growing Company",
    time: "Dedicate a week",
    steps: [
      "Conduct BIA Lite on 3-5 core processes",
      "Document SOPs and assign 'backup owners' for key roles",
      "Draft a one-page Critical Incident Response handout",
    ],
  },
];


const OperationalRisk = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Hub</span>
          </Link>
          <Link to="/" className="font-display text-xl font-bold text-primary">
            SCRF
          </Link>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 md:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full mb-6">
            <Cog className="h-4 w-4" />
            <span className="text-sm font-medium">Risk Domain</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Operational Risk Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Anticipate disruptions, streamline processes, and secure your business core.
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-0">
            <CardContent className="p-8">
              <h2 className="font-display text-2xl font-bold mb-4">The Heart of Your Business</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Operational risk isn't about rare disasters; it's about the 100 small things that can derail your week. 
                It's the supplier who fails to deliver, the key employee who falls ill, the critical process that only 
                one person knows, or the software that crashes during your busiest season.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Managing it isn't about fear—it's about building predictable, resilient operations that let you sleep 
                soundly and seize opportunities confidently. This section applies the SCRF's four blocks to turn 
                operational vulnerabilities into strengths.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Pain Points */}
        <section className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 text-center">Is Your Business Exposed?</h2>
          <p className="text-muted-foreground text-center mb-8">Click each card for a quick tip on getting started.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {painPoints.map((point, idx) => (
              <Card key={idx} className="group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                      <point.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg mb-2">"{point.title}"</h3>
                      <p className="text-muted-foreground text-sm mb-3">{point.description}</p>
                      <div className="p-3 bg-secondary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <p className="text-sm text-primary">{point.tip}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* SCRF Application */}
        <section className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 text-center">Applying the SCRF to Operational Risk</h2>
          <p className="text-muted-foreground text-center mb-8">How the four building blocks translate into operational resilience.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {scrfBlocks.map((block, idx) => (
              <Card key={idx} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <block.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="font-display text-lg">{block.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{block.application}</p>
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-sm font-medium text-primary">Key Question: {block.question}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Interactive Tools */}
        <section className="mb-16" id="tools">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 text-center">Core Interactive Toolkit</h2>
          <p className="text-muted-foreground text-center mb-8">Practical tools to identify and address operational risks.</p>
          <div className="space-y-8">
            <SPOFFinder />
            <ProcessDocBuilder />
            <BIALite />
          </div>
        </section>

        {/* Workflow */}
        <section className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 text-center">The Operational Resilience Workflow</h2>
          <p className="text-muted-foreground text-center mb-8">A 5-step cycle showing how the tools and concepts fit together.</p>
          <div className="relative">
            <div className="grid md:grid-cols-5 gap-4">
              {workflowSteps.map((item, idx) => (
                <div key={idx} className="relative">
                  <Card className="h-full text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto mb-3">
                        {item.step}
                      </div>
                      <h4 className="font-semibold text-sm mb-2">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                  {idx < workflowSteps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 h-6 w-6 text-muted-foreground z-10" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Feedback Loop: Return to Step 1 quarterly
              </span>
            </div>
          </div>
        </section>

        {/* Implementation Paths */}
        <section className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 text-center">"Start Here" Implementation Pathway</h2>
          <p className="text-muted-foreground text-center mb-8">Choose your path based on your size and available time.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {implementationPaths.map((path, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-secondary rounded-lg">
                      <path.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-lg">{path.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {path.time}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {path.steps.map((step, stepIdx) => (
                      <li key={stepIdx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>


        {/* CTA */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-primary/10 via-secondary to-accent/10 border-0">
            <CardContent className="p-8">
              <h2 className="font-display text-2xl font-bold mb-4">Ready to Build Operational Resilience?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Start with the tools above, or explore other risk domains to build comprehensive business resilience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" })}>
                  Use the Tools Above
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/">
                    Explore Other Risk Domains
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container max-w-6xl mx-auto px-4 md:px-8 py-8 text-center text-sm text-muted-foreground">
          <Link to="/" className="font-display font-bold text-primary hover:text-primary/80 transition-colors">
            SCRF
          </Link>
          <span className="mx-2">•</span>
          Strategic Compliance & Risk Framework
        </div>
      </footer>
    </div>
  );
};

export default OperationalRisk;
