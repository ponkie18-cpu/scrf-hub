import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import HorizonScanner from "@/components/strategic-cyber/HorizonScanner";
import CyberResilienceScorecard from "@/components/strategic-cyber/CyberResilienceScorecard";
import IncidentPlaybookBuilder from "@/components/strategic-cyber/IncidentPlaybookBuilder";
import NashEquilibriumSimulator from "@/components/strategic-cyber/NashEquilibriumSimulator";
import CollaborationRiskAuditor from "@/components/strategic-cyber/CollaborationRiskAuditor";
import MarketEntryAdvisor from "@/components/strategic-cyber/MarketEntryAdvisor";
import PartnerReliabilityTracker from "@/components/strategic-cyber/PartnerReliabilityTracker";
import PreMortemExercise from "@/components/behavioral/PreMortemExercise";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import {
  Compass,
  Shield,
  AlertTriangle,
  Target,
  Brain,
  BookOpen,
  Cog,
  Users,
  TrendingUp,
  Clock,
  Lightbulb,
  FileText,
  Star,
  Skull,
  ArrowRight,
} from "lucide-react";

const StrategicCyberRisk = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-4">
            <Compass className="h-3 w-3 mr-1" />
            SCRF Risk Domain
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Strategic & Cyber Risk Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Future-Proof Your Business: Navigate market shifts, digital threats, and competitive challenges by building anticipatory resilience.
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-semibold mb-4">
                The External Forces Shaping Your Future
              </h2>
              <p className="text-muted-foreground mb-4">
                Strategic and cyber risks represent the dual challenges of the modern business landscape: 
                navigating uncertain futures and defending against invisible digital threats. While strategic 
                risks (market changes, new competitors, reputational shifts) happen <em>to</em> your business, 
                cyber risks (data breaches, system failures) happen <em>within</em> it. Both require looking 
                ahead, not just reacting.
              </p>
              <p className="text-muted-foreground">
                This module applies the SCRF to cultivate strategic foresight and digital vigilance. We move 
                from being passive to being prepared, turning uncertainty into a structured planning exercise.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            "Are You Prepared for What's Next?"
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Clock,
                title: "So busy surviving today that tomorrow is a surprise",
                description: "That moment when a competitor launches something and you wonder why you didn't see it coming.",
              },
              {
                icon: Shield,
                title: "Running a digital business while feeling exposed",
                description: "The nagging worry that your website, cloud data, or customer information could be compromised at any moment.",
              },
              {
                icon: AlertTriangle,
                title: "One bad review away from disaster",
                description: "The fear that a single viral complaint or social media crisis could undo years of reputation building.",
              },
              {
                icon: Brain,
                title: "Cyber threats you can't even understand",
                description: "The overwhelm of phishing, malware, ransomware—words you've heard but don't know how to defend against.",
              },
            ].map((pain, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex gap-4">
                  <pain.icon className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-medium mb-1">"{pain.title}"</h3>
                    <p className="text-sm text-muted-foreground">{pain.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SCRF Application Table */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Applying the SCRF to Strategic & Cyber Risk
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left">SCRF Building Block</th>
                  <th className="border p-3 text-left">Strategic & Cyber Application</th>
                  <th className="border p-3 text-left">Key Question for Leaders</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="font-medium">Cognitive Reframing</span>
                    </div>
                  </td>
                  <td className="border p-3 text-sm">
                    View strategic planning and cybersecurity not as complex specialties, but as essential 
                    business hygiene—like financial planning for your future and locks on your digital doors.
                  </td>
                  <td className="border p-3 text-sm italic">
                    "What small, regular habit could we build to improve our strategic awareness or digital security this quarter?"
                  </td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium">Foundational Literacy</span>
                    </div>
                  </td>
                  <td className="border p-3 text-sm">
                    Learn key concepts: PESTLE Analysis (Political, Economic, Social, Technological, Legal, Environmental), 
                    Threat Surface, Multi-Factor Authentication (MFA), Business Email Compromise (BEC).
                  </td>
                  <td className="border p-3 text-sm italic">
                    "Can we name our two biggest external opportunities and two biggest digital vulnerabilities?"
                  </td>
                </tr>
                <tr>
                  <td className="border p-3">
                    <div className="flex items-center gap-2">
                      <Cog className="h-4 w-4 text-primary" />
                      <span className="font-medium">Procedural Rigor</span>
                    </div>
                  </td>
                  <td className="border p-3 text-sm">
                    Systemize with quarterly strategy reviews, mandatory cyber hygiene checklists (e.g., password updates), 
                    and a basic incident response plan.
                  </td>
                  <td className="border p-3 text-sm italic">
                    "Do we have a written, one-page plan for what to do if our social media is hacked or our website goes down?"
                  </td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium">Synergistic Engagement</span>
                    </div>
                  </td>
                  <td className="border p-3 text-sm">
                    Foster a culture where every employee is a sensor for market trends and a defender against phishing attempts. 
                    Engage experts (strategic consultants, IT security) as needed.
                  </td>
                  <td className="border p-3 text-sm italic">
                    "When did we last train our team on spotting phishing emails or discussing a competitor's new product?"
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Interactive Tools */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold mb-2 text-center">
            Interactive Toolkit for Strategic & Cyber Risk
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Practical tools to build foresight and digital resilience
          </p>

          <Tabs defaultValue="horizon" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
              <TabsTrigger value="horizon" className="flex items-center gap-1">
                <Compass className="h-4 w-4" />
                <span className="hidden md:inline">Horizon Scanner</span>
                <span className="md:hidden text-xs">Scanner</span>
              </TabsTrigger>
              <TabsTrigger value="cyber" className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span className="hidden md:inline">Cyber Scorecard</span>
                <span className="md:hidden text-xs">Cyber</span>
              </TabsTrigger>
              <TabsTrigger value="playbook" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">Incident Playbook</span>
                <span className="md:hidden text-xs">Playbook</span>
              </TabsTrigger>
              <TabsTrigger value="nash" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span className="hidden md:inline">Game Theory</span>
                <span className="md:hidden text-xs">Nash</span>
              </TabsTrigger>
              <TabsTrigger value="collaboration" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Partnership Risk</span>
                <span className="md:hidden text-xs">Partner</span>
              </TabsTrigger>
              <TabsTrigger value="market-entry" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden md:inline">Market Entry</span>
                <span className="md:hidden text-xs">Entry</span>
              </TabsTrigger>
              <TabsTrigger value="partner-tracker" className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span className="hidden md:inline">Partner Tracker</span>
                <span className="md:hidden text-xs">Tracker</span>
              </TabsTrigger>
              <TabsTrigger value="pre-mortem" className="flex items-center gap-1">
                <Skull className="h-4 w-4" />
                <span className="hidden md:inline">Pre-Mortem</span>
                <span className="md:hidden text-xs">Pre-Mortem</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="horizon">
              <HorizonScanner />
            </TabsContent>
            <TabsContent value="cyber">
              <CyberResilienceScorecard />
            </TabsContent>
            <TabsContent value="playbook">
              <IncidentPlaybookBuilder />
            </TabsContent>
            <TabsContent value="nash">
              <NashEquilibriumSimulator />
            </TabsContent>
            <TabsContent value="collaboration">
              <CollaborationRiskAuditor />
            </TabsContent>
            <TabsContent value="market-entry">
              <MarketEntryAdvisor />
            </TabsContent>
            <TabsContent value="partner-tracker">
              <PartnerReliabilityTracker />
            </TabsContent>
            <TabsContent value="pre-mortem">
              <PreMortemExercise />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Workflow Diagram */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            The Anticipatory Resilience Workflow
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {[
                  { step: 1, title: "Scan Horizons", desc: "for Trends & Threats", icon: Compass },
                  { step: 2, title: "Assess Cyber", desc: "& Strategic Posture", icon: Shield },
                  { step: 3, title: "Develop Simple", desc: "Response Playbooks", icon: FileText },
                  { step: 4, title: "Train Team", desc: "& Implement Controls", icon: Users },
                  { step: 5, title: "Quarterly Review", desc: "& Simulation Test", icon: TrendingUp },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <item.icon className="h-8 w-8 text-primary" />
                      </div>
                      <p className="font-medium text-sm">Step {item.step}</p>
                      <p className="text-xs text-muted-foreground">{item.title}</p>
                    </div>
                    {index < 4 && (
                      <ArrowRight className="h-6 w-6 text-muted-foreground mx-2 hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Badge variant="outline" className="text-xs">
                  ↺ Continuous feedback loop back to Step 1
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Implementation Pathway */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            "Start Here" Implementation Pathway
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <Badge className="mb-4">Solo Entrepreneur</Badge>
                <p className="text-sm text-muted-foreground mb-4">Time: &lt;1 hour</p>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">1.</span>
                    Take the Cyber Resilience Scorecard and implement the #1 recommendation (often enabling MFA).
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">2.</span>
                    Use the Horizon Scanner to brainstorm and note two potential opportunities or threats.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Badge className="mb-4">Small Team</Badge>
                <p className="text-sm text-muted-foreground mb-4">Time: 1-2 hours</p>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">1.</span>
                    Complete the Cyber Resilience Scorecard as a team and assign one action item to each person.
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">2.</span>
                    Hold a 30-minute "Horizon Scanning" brainstorming session using the tool's prompts.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Badge className="mb-4">Growing Company</Badge>
                <p className="text-sm text-muted-foreground mb-4">Time: Dedicate a week</p>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">1.</span>
                    Run a full Horizon Scanning workshop and integrate findings into the annual plan.
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">2.</span>
                    Achieve a target score on the Cyber Scorecard and document the Incident Response Playbook.
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-primary">3.</span>
                    Conduct a simulated "phishing test" or "bad news scenario" with the team using the playbook.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Cross-Links */}
      <section className="py-12 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Complete Your SCRF Journey
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            With all four modules, the SCRF Hub provides a complete, structured journey for SMEs
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/operational-risk">
              <Card className="hover:shadow-md transition-all hover:border-primary/50 h-full">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-medium">Operational Risk</h3>
                  <p className="text-xs text-muted-foreground">Secure your core processes</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/financial-risk">
              <Card className="hover:shadow-md transition-all hover:border-primary/50 h-full">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-medium">Financial & Tax Risk</h3>
                  <p className="text-xs text-muted-foreground">Secure your capital</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/compliance-risk">
              <Card className="hover:shadow-md transition-all hover:border-primary/50 h-full">
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-medium">Compliance & Legal</h3>
                  <p className="text-xs text-muted-foreground">Secure your legal standing</p>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-primary bg-primary/10">
              <CardContent className="p-4 text-center">
                <Compass className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium">Strategic & Cyber</h3>
                <p className="text-xs text-muted-foreground">You are here</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StrategicCyberRisk;
