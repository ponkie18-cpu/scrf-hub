import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Building,
  BarChart3,
  Target,
  Lightbulb,
  Zap,
  DollarSign,
  Scale,
  Cpu,
  Users,
  Link2,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const industries = [
  { code: "retail", label: "Retail & E-commerce" },
  { code: "professional_services", label: "Professional Services" },
  { code: "technology", label: "Technology & Software" },
  { code: "manufacturing", label: "Manufacturing" },
  { code: "construction", label: "Construction & Engineering" },
  { code: "healthcare", label: "Healthcare & Wellness" },
  { code: "hospitality", label: "Hospitality & Tourism" },
  { code: "agriculture", label: "Agriculture & Farming" },
  { code: "transport", label: "Transport & Logistics" },
  { code: "education", label: "Education & Training" },
  { code: "financial_services", label: "Financial Services" },
  { code: "media", label: "Media & Creative" },
  { code: "mining", label: "Mining & Resources" },
  { code: "ngo", label: "Non-Profit / NGO" },
  { code: "general", label: "Other" },
];

const sizeOptions = [
  { value: "1-5", label: "1-5 employees" },
  { value: "6-20", label: "6-20 employees" },
  { value: "21-50", label: "21-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "200+", label: "200+ employees" },
];

const revenueOptions = [
  { value: "pre_revenue", label: "Pre-revenue / Startup" },
  { value: "under_1m", label: "Under R1 million" },
  { value: "1m_5m", label: "R1m – R5 million" },
  { value: "5m_20m", label: "R5m – R20 million" },
  { value: "20m_plus", label: "R20 million+" },
];

const legalStructures = [
  { value: "sole_proprietor", label: "Sole Proprietor" },
  { value: "pty_ltd", label: "Pty Ltd / Private Company" },
  { value: "partnership", label: "Partnership" },
  { value: "cc", label: "Close Corporation (CC)" },
  { value: "npc", label: "Non-Profit Company" },
  { value: "other", label: "Other" },
];

const regionOptions = [
  { value: "gauteng", label: "Gauteng" },
  { value: "western_cape", label: "Western Cape" },
  { value: "kwazulu_natal", label: "KwaZulu-Natal" },
  { value: "eastern_cape", label: "Eastern Cape" },
  { value: "free_state", label: "Free State" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "north_west", label: "North West" },
  { value: "northern_cape", label: "Northern Cape" },
  { value: "national", label: "National (all provinces)" },
  { value: "international", label: "International" },
];

const maturityQuestions = [
  { id: "bcp", question: "Do you have a documented business continuity plan?", options: ["Yes", "Partial", "No"] },
  { id: "compliance_review", question: "When did you last review your compliance obligations?", options: ["Last 3 months", "Last 12 months", "Over a year ago", "Never"] },
  { id: "cyber_controls", question: "Do you have formal cybersecurity controls (MFA, backups, etc.)?", options: ["Yes", "Partial", "No"] },
  { id: "financial_forecasting", question: "Do you regularly forecast cash flow (at least quarterly)?", options: ["Yes", "Sometimes", "No"] },
  { id: "risk_register", question: "Do you maintain a risk register or formal risk tracking?", options: ["Yes", "Informal", "No"] },
];

const concernOptions = [
  { id: "cashflow", label: "Cash Flow Stability", icon: DollarSign },
  { id: "compliance", label: "Regulatory Compliance (POPIA, CIPC, Labour Law)", icon: Scale },
  { id: "cyber", label: "Cyber Threats", icon: Cpu },
  { id: "key_person", label: "Key Person Dependency", icon: Users },
  { id: "supply_chain", label: "Supply Chain Disruption", icon: Link2 },
  { id: "competition", label: "Market Competition", icon: TrendingUp },
  { id: "bcp", label: "Business Continuity Planning", icon: Shield },
];

const WIZARD_STORAGE_KEY = "scrf_onboarding_progress";

interface WizardState {
  currentStep: number;
  industry: string;
  companyName: string;
  size: string;
  revenueBand: string;
  yearsOperating: string;
  legalStructure: string;
  regions: string[];
  maturityAnswers: Record<string, string>;
  selectedConcerns: string[];
  goals: string;
}

function loadWizardState(): Partial<WizardState> {
  try {
    const saved = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {};
}

function saveWizardState(state: WizardState) {
  try {
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function clearWizardState() {
  try {
    localStorage.removeItem(WIZARD_STORAGE_KEY);
  } catch { /* ignore */ }
}

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const saved = loadWizardState();

  const [currentStep, setCurrentStep] = useState(saved.currentStep ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Business Profile
  const [industry, setIndustry] = useState(saved.industry ?? "");
  const [companyName, setCompanyName] = useState(saved.companyName ?? "");
  const [size, setSize] = useState(saved.size ?? "");
  const [revenueBand, setRevenueBand] = useState(saved.revenueBand ?? "");
  const [yearsOperating, setYearsOperating] = useState(saved.yearsOperating ?? "");
  const [legalStructure, setLegalStructure] = useState(saved.legalStructure ?? "");
  const [regions, setRegions] = useState<string[]>(saved.regions ?? []);

  // Step 2: Risk Maturity
  const [maturityAnswers, setMaturityAnswers] = useState<Record<string, string>>(saved.maturityAnswers ?? {});

  // Step 3: Top Concerns
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(saved.selectedConcerns ?? []);

  // Step 4: Goals
  const [goals, setGoals] = useState(saved.goals ?? "");

  // Auto-save wizard state on every change
  useEffect(() => {
    saveWizardState({
      currentStep, industry, companyName, size, revenueBand,
      yearsOperating, legalStructure, regions, maturityAnswers,
      selectedConcerns, goals,
    });
  }, [currentStep, industry, companyName, size, revenueBand, yearsOperating, legalStructure, regions, maturityAnswers, selectedConcerns, goals]);

  // Step 5: Summary (computed)

  const totalSteps = 5;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const toggleConcern = (id: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleRegion = (value: string) => {
    setRegions((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  const calculateMaturityScore = (): number => {
    let score = 0;
    let total = 0;
    for (const q of maturityQuestions) {
      const answer = maturityAnswers[q.id];
      if (!answer) continue;
      total++;
      if (q.options.length === 3) {
        if (answer === q.options[0]) score += 100;
        else if (answer === q.options[1]) score += 50;
      } else if (q.options.length === 4) {
        const idx = q.options.indexOf(answer);
        score += [100, 66, 33, 0][idx] || 0;
      }
    }
    return total > 0 ? Math.round(score / total) : 0;
  };

  const getMaturityLabel = (score: number) => {
    if (score >= 75) return { label: "Advanced", color: "bg-green-500/10 text-green-600" };
    if (score >= 50) return { label: "Developing", color: "bg-amber-500/10 text-amber-600" };
    if (score >= 25) return { label: "Basic", color: "bg-orange-500/10 text-orange-600" };
    return { label: "Beginning", color: "bg-destructive/10 text-destructive" };
  };

  const getPriorityTools = (): string[] => {
    const toolMap: Record<string, string[]> = {
      cashflow: ["cashflow-stress", "financial-health"],
      compliance: ["contract-checker", "regulatory-tracker"],
      cyber: ["cyber-scorecard", "incident-playbook"],
      key_person: ["spof", "process-doc"],
      supply_chain: ["vendor-assessment", "bcp-builder"],
      competition: ["horizon-scanner", "nash-equilibrium-simulator"],
      bcp: ["bcp-builder", "spof"],
    };
    const tools: string[] = [];
    for (const concern of selectedConcerns.slice(0, 3)) {
      tools.push(...(toolMap[concern] || []));
    }
    return [...new Set(tools)].slice(0, 3);
  };

  const getToolLabel = (toolId: string): string => {
    const labels: Record<string, string> = {
      "cashflow-stress": "Cash Flow Stress Test",
      "financial-health": "Financial Health Scorecard",
      "contract-checker": "Contract Risk Checker",
      "regulatory-tracker": "Regulatory Tracker",
      "cyber-scorecard": "Cyber Resilience Scorecard",
      "incident-playbook": "Incident Playbook Builder",
      spof: "SPOF Finder",
      "process-doc": "Process Doc Builder",
      "vendor-assessment": "Vendor Assessment",
      "bcp-builder": "BCP Builder",
      "horizon-scanner": "Horizon Scanner",
      "nash-equilibrium-simulator": "Strategic Scenario Simulator",
    };
    return labels[toolId] || toolId;
  };

  const getActionItems = () => {
    const items: Array<{ title: string; domain: string; priority: string }> = [];
    if (selectedConcerns.includes("cashflow")) {
      items.push({ title: "Run Cash Flow Stress Test with 2 scenarios", domain: "financial", priority: "high" });
    }
    if (selectedConcerns.includes("cyber")) {
      items.push({ title: "Complete Cyber Resilience Scorecard assessment", domain: "strategic", priority: "high" });
    }
    if (selectedConcerns.includes("key_person")) {
      items.push({ title: "Identify top 3 single points of failure with SPOF Finder", domain: "operational", priority: "high" });
    }
    if (selectedConcerns.includes("compliance")) {
      items.push({ title: "Review your primary contract with Quick-Checker", domain: "compliance", priority: "high" });
    }
    if (selectedConcerns.includes("supply_chain")) {
      items.push({ title: "Assess your top vendor's reliability", domain: "operational", priority: "medium" });
    }
    if (selectedConcerns.includes("competition")) {
      items.push({ title: "Run Horizon Scanner for your industry trends", domain: "strategic", priority: "medium" });
    }
    if (selectedConcerns.includes("bcp")) {
      items.push({ title: "Start building your Business Continuity Plan", domain: "operational", priority: "high" });
    }
    // Ensure at least 3 starter items even if user selected few concerns
    const fallbacks = [
      { title: "Complete your first SPOF Finder assessment", domain: "operational", priority: "high" },
      { title: "Run the Financial Health Scorecard", domain: "financial", priority: "medium" },
      { title: "Review your compliance posture with Compliance Assessment", domain: "compliance", priority: "medium" },
    ];
    while (items.length < 3) {
      const next = fallbacks.find(f => !items.some(i => i.title === f.title));
      if (next) items.push(next);
      else break;
    }
    return items.slice(0, 3);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return industry && size;
      case 1: return Object.keys(maturityAnswers).length >= 3;
      case 2: return selectedConcerns.length >= 1;
      case 3: return true; // goals are optional
      case 4: return true;
      default: return false;
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const maturityScore = calculateMaturityScore();

      // Update company profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.company_id) {
        await supabase
          .from("companies")
          .update({
            name: companyName || "My Company",
            industry,
            size: size || "1-10",
            revenue_band: revenueBand || "not_specified",
            years_operating: parseInt(yearsOperating) || 0,
            legal_structure: legalStructure || "not_specified",
            operating_regions: regions,
          })
          .eq("id", profile.company_id);
      }

      // Update profile with maturity + concerns + goals
      await supabase
        .from("profiles")
        .update({
          industry_code: industry,
          jurisdiction: regions.length > 0 ? regions[0] : "national",
          risk_maturity_score: maturityScore,
          top_concerns: selectedConcerns,
          goals: goals.slice(0, 140),
        })
        .eq("id", user.id);

      // Create initial domain assessments from maturity
      const domainMap: Record<string, string> = {
        bcp: "operational",
        compliance_review: "compliance",
        cyber_controls: "strategic",
        financial_forecasting: "financial",
        risk_register: "operational",
      };

      const domainScores: Record<string, number[]> = {};
      for (const q of maturityQuestions) {
        const answer = maturityAnswers[q.id];
        if (!answer) continue;
        const domain = domainMap[q.id] || "operational";
        let score = 25;
        if (q.options.length === 3) {
          if (answer === q.options[0]) score = 80;
          else if (answer === q.options[1]) score = 50;
        } else if (q.options.length === 4) {
          const idx = q.options.indexOf(answer);
          score = [85, 60, 35, 15][idx] || 25;
        }
        if (!domainScores[domain]) domainScores[domain] = [];
        domainScores[domain].push(score);
      }

      const assessments = Object.entries(domainScores).map(([domain, scores]) => ({
        user_id: user.id,
        domain,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        assessment_data: { source: "onboarding_v2", maturityAnswers },
      }));

      if (assessments.length > 0) {
        await supabase.from("risk_assessments").insert(assessments);
      }

      // Save score history
      const overallScore = assessments.length > 0
        ? Math.round(assessments.reduce((a, b) => a + b.score, 0) / assessments.length)
        : maturityScore;

      const historyEntries = [
        ...assessments.map((a) => ({
          user_id: user.id,
          domain: a.domain,
          score: a.score,
        })),
        { user_id: user.id, domain: "overall", score: overallScore },
      ];

      await supabase.from("score_history").insert(historyEntries);

      // Create 3 starter action items
      const actionItems = getActionItems();
      if (actionItems.length > 0) {
        await supabase.from("action_items").insert(
          actionItems.map((item) => ({
            user_id: user.id,
            domain: item.domain,
            title: item.title,
            priority: item.priority,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          }))
        );
      }

      // Mark onboarding complete
      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        onboarding_completed: true,
      });

      clearWizardState();
      toast({ title: "Welcome to SCRF Hub!", description: "Your personalised dashboard is ready." });
      onComplete();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({ title: "Setup error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = ["Business Profile", "Risk Maturity", "Top Concerns", "Your Goals", "Your SCRF Brief"];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to SCRF Hub</CardTitle>
          <CardDescription>
            {currentStep < 4
              ? "Let's personalise your experience — this takes about 3 minutes"
              : "Here's your personalised SCRF Agent brief"}
          </CardDescription>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{stepLabels[currentStep]}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* STEP 1: Business Profile */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Business Profile</h3>
              </div>

              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  placeholder="Your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry *</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind.code} value={ind.code}>{ind.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Team Size *</Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger><SelectValue placeholder="Employees" /></SelectTrigger>
                    <SelectContent>
                      {sizeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Revenue Band</Label>
                  <Select value={revenueBand} onValueChange={setRevenueBand}>
                    <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent>
                      {revenueOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Years Operating</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 5"
                    value={yearsOperating}
                    onChange={(e) => setYearsOperating(e.target.value)}
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Legal Structure</Label>
                  <Select value={legalStructure} onValueChange={setLegalStructure}>
                    <SelectTrigger><SelectValue placeholder="Select structure" /></SelectTrigger>
                    <SelectContent>
                      {legalStructures.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Operating Region(s)</Label>
                  <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto border rounded-lg p-2">
                    {regionOptions.map((r) => (
                      <Badge
                        key={r.value}
                        variant={regions.includes(r.value) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleRegion(r.value)}
                      >
                        {r.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Risk Maturity */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Risk Maturity Check</h3>
              </div>
              <p className="text-sm text-muted-foreground">Quick assessment of your current risk management practices.</p>

              {maturityQuestions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <Label className="text-sm font-medium">{q.question}</Label>
                  <RadioGroup
                    value={maturityAnswers[q.id] || ""}
                    onValueChange={(v) => setMaturityAnswers((prev) => ({ ...prev, [q.id]: v }))}
                    className="flex flex-wrap gap-2"
                  >
                    {q.options.map((opt) => (
                      <div key={opt} className="flex items-center">
                        <RadioGroupItem value={opt} id={`${q.id}-${opt}`} className="sr-only" />
                        <Label
                          htmlFor={`${q.id}-${opt}`}
                          className={`cursor-pointer px-3 py-1.5 text-sm rounded-full border transition-all ${
                            maturityAnswers[q.id] === opt
                              ? "bg-primary text-primary-foreground border-primary"
                              : "hover:border-primary/50"
                          }`}
                        >
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: Top Concerns */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">What Concerns You Most?</h3>
              </div>
              <p className="text-sm text-muted-foreground">Select all that apply — we'll prioritise your tools accordingly.</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {concernOptions.map((concern) => {
                  const isSelected = selectedConcerns.includes(concern.id);
                  const Icon = concern.icon;
                  return (
                    <div
                      key={concern.id}
                      onClick={() => toggleConcern(concern.id)}
                      className={`cursor-pointer border rounded-lg p-4 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium">{concern.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Goals */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">What Does Success Look Like?</h3>
              </div>
              <p className="text-sm text-muted-foreground">In one sentence, what would you like to achieve in the next 12 months?</p>
              <Textarea
                placeholder="e.g. Build a documented resilience plan so I can sleep at night knowing my business can survive disruption."
                value={goals}
                onChange={(e) => setGoals(e.target.value.slice(0, 140))}
                className="min-h-[100px]"
                maxLength={140}
              />
              <p className="text-xs text-muted-foreground text-right">{goals.length}/140</p>
            </div>
          )}

          {/* STEP 5: Agent Brief */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Your SCRF Agent Brief</h3>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                <p className="text-sm">
                  Based on your profile as a{" "}
                  <strong>{industries.find((i) => i.code === industry)?.label || industry}</strong> business
                  {size && <> with <strong>{size} employees</strong></>}, here's your personalised plan:
                </p>

                {/* Maturity Score */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Risk Maturity:</span>
                  <Badge className={getMaturityLabel(calculateMaturityScore()).color}>
                    {getMaturityLabel(calculateMaturityScore()).label} ({calculateMaturityScore()}%)
                  </Badge>
                </div>

                {/* Priority Tools */}
                <div>
                  <p className="text-sm font-medium mb-2">Your priority tools:</p>
                  <div className="flex flex-wrap gap-2">
                    {getPriorityTools().map((toolId) => (
                      <Badge key={toolId} variant="outline" className="bg-background">
                        {getToolLabel(toolId)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Starter Actions */}
                <div>
                  <p className="text-sm font-medium mb-2">Your first recommended actions:</p>
                  <ol className="space-y-2">
                    {getActionItems().map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                          {idx + 1}
                        </span>
                        <span className="text-muted-foreground">{item.title}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {goals && (
                  <div className="pt-2 border-t border-primary/10">
                    <p className="text-xs text-muted-foreground">
                      <strong>Your goal:</strong> {goals}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((s) => s - 1)}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              {currentStep < totalSteps - 1 && (
                <Button
                  variant="ghost"
                  className="text-muted-foreground text-sm"
                  onClick={async () => {
                    if (!user) return;
                    await supabase.from("user_preferences").upsert({
                      user_id: user.id,
                      onboarding_completed: true,
                    });
                    clearWizardState();
                    toast({ title: "Onboarding skipped", description: "You can update your profile in Settings anytime." });
                    onComplete();
                  }}
                >
                  Skip for now
                </Button>
              )}
            </div>

            {currentStep === totalSteps - 1 ? (
              <Button onClick={handleComplete} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up your dashboard...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Launch My Dashboard
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed()}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingWizard;
