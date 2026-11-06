import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  DollarSign,
  AlertTriangle,
  TrendingUp,
  FileText,
  Brain,
  BookOpen,
  Shield,
  Handshake,
  Clock,
  UserCheck,
  Users,
  Building2,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  PiggyBank,
} from "lucide-react";
import CashFlowStressTest from "@/components/financial-risk/CashFlowStressTest";
import FinancialHealthScorecard from "@/components/financial-risk/FinancialHealthScorecard";

const painPoints = [
  {
    icon: TrendingUp,
    title: "Feast or Famine—Never Stable",
    description: "The anxiety of great months followed by terrifying dry spells where you can't plan or invest.",
    tip: "The Cash Flow Stress Test helps you visualize different scenarios and plan buffers.",
  },
  {
    icon: PiggyBank,
    title: "Wondering How Long You Could Survive",
    description: "Lying awake calculating how many months you'd last if your biggest client walked away tomorrow.",
    tip: "Building reserves starts with understanding your true runway—try the Stress Test.",
  },
  {
    icon: FileText,
    title: "Avoiding the Numbers Because They're Scary",
    description: "The guilt of knowing you should look at the finances more closely, but the jargon is overwhelming.",
    tip: "The Financial Health Scorecard breaks it down into simple, actionable insights.",
  },
  {
    icon: AlertTriangle,
    title: "No Visibility on Financial Health",
    description: "Not knowing if your business is genuinely profitable or just surviving month to month.",
    tip: "Use the Financial Health Scorecard to get a clear picture of your ratios.",
  },
];

const scrfBlocks = [
  {
    icon: Brain,
    title: "Cognitive Reframing",
    application: "View financial management not as a chore, but as the strategic advantage that separates thriving businesses from struggling ones.",
    question: "How can we reframe financial planning as an investment in peace of mind rather than a burden?",
  },
  {
    icon: BookOpen,
    title: "Foundational Literacy",
    application: "Understand key terms: Cash Flow vs. Profit, Accrual vs. Cash Accounting, Working Capital, Allowance for Bad Debt.",
    question: "Do we know the difference between our cash flow statement and our P&L, and why both matter?",
  },
  {
    icon: Shield,
    title: "Procedural Rigor",
    application: "Systemize with cash flow forecasting, regular financial health checks, and reserve-building strategies.",
    question: "Do we have a monthly ritual for reviewing our cash flow forecast and building reserves?",
  },
  {
    icon: Handshake,
    title: "Synergistic Engagement",
    application: "Involve your accountant proactively, not just at year-end. Share financial goals and risk concerns with them.",
    question: "When was the last time we discussed our business strategy with our accountant to align financial planning?",
  },
];

const workflowSteps = [
  { step: 1, title: "Forecast & Simulate", description: "Model cash flow under different scenarios" },
  { step: 2, title: "Assess & Score", description: "Evaluate overall financial health" },
  { step: 3, title: "Identify Gaps", description: "Find weaknesses in your financial position" },
  { step: 4, title: "Implement Buffers", description: "Build reserves and risk mitigations" },
  { step: 5, title: "Monthly Review", description: "Regular check-ins and adjustments" },
];

const implementationPaths = [
  {
    icon: UserCheck,
    title: "Solo Entrepreneur",
    time: "< 1 hour",
    steps: [
      "Run the Cash Flow Stress Test on one scenario to understand your runway",
      "Complete the Financial Health Scorecard to see where you stand",
    ],
  },
  {
    icon: Users,
    title: "Small Team",
    time: "1-2 hours",
    steps: [
      "Run the Cash Flow Stress Test on one 'worst-case' scenario",
      "Take the Financial Health Scorecard together and discuss one improvement",
    ],
  },
  {
    icon: Building2,
    title: "Growing Company",
    time: "Dedicate a week",
    steps: [
      "Conduct stress tests on three scenarios (mild, moderate, severe)",
      "Use the Financial Health Scorecard to benchmark your ratios",
      "Schedule a meeting with your accountant to review results",
    ],
  },
];


const FinancialRisk = () => {
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
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">Risk Domain</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Financial Risk Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Proactively manage cash flow and financial shocks to build a resilient foundation for growth.
          </p>
        </div>

        {/* Introduction */}
        <section className="mb-16">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-0">
            <CardContent className="p-8">
              <h2 className="font-display text-2xl font-bold mb-4">The Lifeblood of Your Business</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Financial risk isn't just about running out of money. It's about the uncertainty that clouds every 
                decision: Can we invest? Can we hire? What if our biggest customer pays late?
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This module helps you apply the SCRF to gain clarity, control, and confidence over your finances. 
                We'll transform financial management from a reactive chore into a strategic asset.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-4 italic">
                SCRF Hub does not provide tax advice. For tax matters (VAT, PAYE, income tax), please consult a registered tax practitioner.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Pain Points */}
        <section className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 text-center">Is Your Financial Health at Risk?</h2>
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
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 text-center">Applying the SCRF to Financial Risk</h2>
          <p className="text-muted-foreground text-center mb-8">How the four building blocks translate into financial resilience.</p>
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
          <p className="text-muted-foreground text-center mb-8">Practical tools to understand and strengthen your financial position.</p>
          <div className="space-y-8">
            <CashFlowStressTest />
            <FinancialHealthScorecard />
          </div>
        </section>

        {/* Workflow */}
        <section className="mb-16">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 text-center">The Financial Resilience Workflow</h2>
          <p className="text-muted-foreground text-center mb-8">A 5-step cycle for continuous financial health.</p>
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
                Feedback Loop: Return to Step 1 monthly
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


        {/* Cross-link to other domains */}
        <section className="mb-16">
          <Card className="bg-secondary/50 border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="font-display font-semibold">Connected Risk Domains</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Financial risks don't exist in isolation. Operational disruptions directly cause cash flow problems, 
                and compliance failures can result in costly penalties.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/operational-risk">
                    Explore Operational Risk
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  Compliance & Legal (Coming soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-primary/10 via-secondary to-accent/10 border-0">
            <CardContent className="p-8">
              <h2 className="font-display text-2xl font-bold mb-4">Ready to Strengthen Your Financial Foundation?</h2>
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
          <p className="text-[10px] text-muted-foreground/50 mt-2">
            SCRF Hub does not provide tax advice. For tax matters, consult a registered tax practitioner.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FinancialRisk;
