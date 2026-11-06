import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Lock, RefreshCw,
  Loader2, Zap, Target, TrendingUp, Mail, Skull, KeyRound, Bug
} from "lucide-react";
import { useAssessmentSave } from "@/hooks/useAssessmentSave";
import { useAuth } from "@/hooks/useAuth";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { useTierAccess } from "@/hooks/useTierAccess";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Question {
  id: string;
  category: string;
  question: string;
  weight: number;
  helpText: string;
}

const questions: Question[] = [
  { id: "mfa", category: "Access Control", question: "Do you use Multi-Factor Authentication (MFA) on critical accounts (email, banking, cloud)?", weight: 10, helpText: "MFA adds a second layer beyond passwords" },
  { id: "passwords", category: "Access Control", question: "Do you use unique, strong passwords for each important service?", weight: 8, helpText: "Reused passwords are a major vulnerability" },
  { id: "manager", category: "Access Control", question: "Do you use a password manager?", weight: 6, helpText: "Makes strong, unique passwords practical" },
  { id: "access_review", category: "Access Control", question: "Do you review and remove access when employees leave?", weight: 8, helpText: "Orphaned accounts are security risks" },
  { id: "backups", category: "Data Protection", question: "Do you back up critical data at least weekly?", weight: 10, helpText: "Backups are your ransomware insurance" },
  { id: "backup_test", category: "Data Protection", question: "Have you tested restoring from a backup in the last 6 months?", weight: 6, helpText: "Untested backups may not work when needed" },
  { id: "offsite", category: "Data Protection", question: "Are backups stored separately from your main systems (cloud or offsite)?", weight: 7, helpText: "Local-only backups can be lost in disasters" },
  { id: "updates", category: "System Hygiene", question: "Are operating systems and software updated regularly (at least monthly)?", weight: 8, helpText: "Updates patch known security holes" },
  { id: "antivirus", category: "System Hygiene", question: "Is antivirus/anti-malware software installed and current?", weight: 6, helpText: "Basic protection against common threats" },
  { id: "wifi", category: "System Hygiene", question: "Is your business WiFi password-protected with a strong password?", weight: 5, helpText: "Open networks invite intruders" },
  { id: "phishing", category: "Awareness", question: "Have employees been trained to recognise phishing emails?", weight: 9, helpText: "Most breaches start with human error" },
  { id: "policy", category: "Awareness", question: "Do you have a written policy for handling sensitive data?", weight: 5, helpText: "Clear rules reduce mistakes" },
  { id: "incident", category: "Awareness", question: "Do you have a basic incident response plan (who to call, what to do)?", weight: 7, helpText: "Preparation reduces panic and damage" },
  { id: "vendor", category: "Third Parties", question: "Do you know which third parties have access to your data?", weight: 6, helpText: "Supply chain risks are often overlooked" },
  { id: "cloud", category: "Third Parties", question: "Do you review security settings on cloud services (Google, Microsoft, etc.)?", weight: 5, helpText: "Default settings aren't always secure" },
];

// Revenue per day estimates by business size
const REVENUE_ESTIMATES: Record<string, number> = {
  "1-10": 5000, "11-50": 20000, "51-200": 80000, "201-500": 250000, "501+": 500000,
};

interface ThreatScenario {
  id: string;
  icon: typeof Skull;
  title: string;
  narrative: string;
  estimatedCost: string;
  likelihood: string;
  linkedControls: string[];
  color: string;
}

interface ImprovementItem {
  title: string;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  guide: string;
  linkedControl: string;
}

const CyberResilienceScorecard = () => {
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [showResults, setShowResults] = useState(false);
  const { saveAssessment, isSaving, savedToDb, reset: resetSave } = useAssessmentSave();
  const { user } = useAuth();
  const { tier } = useTierAccess();
  const { toast } = useToast();
  const [scoreHistory, setScoreHistory] = useState<{ date: string; score: number }[]>([]);
  const [businessSize, setBusinessSize] = useState("1-10");

  // Fetch score history and business profile
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [historyRes, profileRes] = await Promise.all([
        supabase
          .from("score_history")
          .select("score, recorded_at")
          .eq("user_id", user.id)
          .eq("domain", "strategic")
          .order("recorded_at", { ascending: true }),
        supabase
          .from("companies")
          .select("size")
          .eq("id", (await supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle()).data?.company_id || "")
          .maybeSingle(),
      ]);
      if (historyRes.data) {
        setScoreHistory(historyRes.data.map(h => ({
          date: new Date(h.recorded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          score: h.score,
        })));
      }
      if (profileRes.data?.size) setBusinessSize(profileRes.data.size);
    };
    fetchData();
  }, [user, showResults]);

  const handleAnswer = (id: string, value: boolean) => {
    setAnswers({ ...answers, [id]: value });
  };

  const calculateScore = () => {
    let earned = 0, total = 0;
    questions.forEach((q) => { total += q.weight; if (answers[q.id] === true) earned += q.weight; });
    return Math.round((earned / total) * 100);
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: "Strong", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 60) return { label: "Moderate", color: "text-amber-600", bg: "bg-amber-100" };
    if (score >= 40) return { label: "Vulnerable", color: "text-orange-600", bg: "bg-orange-100" };
    return { label: "Critical Risk", color: "text-red-600", bg: "bg-red-100" };
  };

  const getVulnerabilities = () => questions.filter((q) => answers[q.id] === false).sort((a, b) => b.weight - a.weight);
  const getStrengths = () => questions.filter((q) => answers[q.id] === true);

  const getCategoryScores = () => {
    const cats: Record<string, { earned: number; total: number }> = {};
    questions.forEach((q) => {
      if (!cats[q.category]) cats[q.category] = { earned: 0, total: 0 };
      cats[q.category].total += q.weight;
      if (answers[q.id] === true) cats[q.category].earned += q.weight;
    });
    return Object.entries(cats).map(([name, { earned, total }]) => ({ name, score: Math.round((earned / total) * 100) }));
  };

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const score = calculateScore();
  const level = getScoreLevel(score);
  const categories = [...new Set(questions.map((q) => q.category))];

  const reset = () => { setAnswers({}); setShowResults(false); resetSave(); };

  // === THREAT SIMULATION DATA ===
  const threatScenarios: ThreatScenario[] = useMemo(() => {
    const vulnIds = new Set(getVulnerabilities().map(v => v.id));
    const dailyRevenue = REVENUE_ESTIMATES[businessSize] || 5000;
    const scenarios: ThreatScenario[] = [];

    // Phishing
    const phishingCost = Math.round(dailyRevenue * 3.5);
    scenarios.push({
      id: "phishing",
      icon: Mail,
      title: "Phishing Attack",
      narrative: `If a phishing attack hit you today, ${!vulnIds.has("phishing") ? "your team training provides some defence, but" : "with no phishing training,"} an employee could click a malicious link within hours. ${vulnIds.has("mfa") ? "Without MFA, attackers gain direct access to your email and financial accounts." : "Your MFA provides a safety net, but sophisticated phishing can bypass it."} Estimated data breach cost for your business size: R${phishingCost.toLocaleString()}.`,
      estimatedCost: `R${phishingCost.toLocaleString()}`,
      likelihood: vulnIds.has("phishing") || vulnIds.has("mfa") ? "High" : "Medium",
      linkedControls: ["phishing", "mfa", "passwords"],
      color: "border-red-500/30 bg-red-500/5",
    });

    // Ransomware
    const recoveryDays = vulnIds.has("backups") ? 14 : vulnIds.has("backup_test") ? 5 : 2;
    const ransomCost = dailyRevenue * recoveryDays;
    scenarios.push({
      id: "ransomware",
      icon: Skull,
      title: "Ransomware Attack",
      narrative: `A ransomware attack encrypts all your files. ${vulnIds.has("backups") ? "With no backup system, you face paying a ransom (average R180,000) or losing everything." : vulnIds.has("backup_test") ? "You have backups, but untested restores could add days of downtime." : "Your tested backups mean you can restore without paying, but recovery still takes time."} Estimated downtime: ${recoveryDays} days × R${dailyRevenue.toLocaleString()}/day = R${ransomCost.toLocaleString()}.`,
      estimatedCost: `R${ransomCost.toLocaleString()}`,
      likelihood: vulnIds.has("backups") ? "High" : vulnIds.has("updates") ? "Medium" : "Low",
      linkedControls: ["backups", "backup_test", "offsite", "updates"],
      color: "border-amber-500/30 bg-amber-500/5",
    });

    // Credential compromise
    const credCost = Math.round(dailyRevenue * 2);
    scenarios.push({
      id: "credential",
      icon: KeyRound,
      title: "Credential Compromise",
      narrative: `${vulnIds.has("passwords") ? "Your reused passwords appear in a data breach." : "Despite strong passwords,"} ${vulnIds.has("access_review") ? "a former employee's active account is exploited." : ""} ${vulnIds.has("mfa") ? "Without MFA, the attacker walks straight in." : "MFA blocks the initial attempt, but social engineering could bypass it."} Financial exposure from account takeover: R${credCost.toLocaleString()}.`,
      estimatedCost: `R${credCost.toLocaleString()}`,
      likelihood: vulnIds.has("passwords") || vulnIds.has("manager") ? "High" : "Low",
      linkedControls: ["passwords", "manager", "mfa", "access_review"],
      color: "border-purple-500/30 bg-purple-500/5",
    });

    return scenarios;
  }, [answers, businessSize]);

  // === IMPROVEMENT MATRIX DATA ===
  const improvementMatrix: ImprovementItem[] = useMemo(() => {
    const vulnIds = new Set(getVulnerabilities().map(v => v.id));
    const items: ImprovementItem[] = [];

    const controlMap: Record<string, { effort: "low" | "medium" | "high"; impact: "low" | "medium" | "high"; title: string; guide: string }> = {
      mfa: { effort: "low", impact: "high", title: "Enable MFA on all critical accounts", guide: "Go to account settings for email, banking, and cloud services. Enable 2FA/MFA using an authenticator app." },
      passwords: { effort: "low", impact: "high", title: "Use unique passwords per service", guide: "Install a password manager (Bitwarden is free). Generate unique 16+ character passwords for each service." },
      manager: { effort: "low", impact: "medium", title: "Deploy a password manager", guide: "Choose Bitwarden (free) or 1Password (paid). Import existing passwords and share with team." },
      access_review: { effort: "medium", impact: "high", title: "Implement access review process", guide: "Create a checklist for offboarding. Review all accounts quarterly. Remove access same-day for departures." },
      backups: { effort: "medium", impact: "high", title: "Set up automated weekly backups", guide: "Use cloud backup (Backblaze, Carbonite) or local NAS with cloud sync. Automate the schedule." },
      backup_test: { effort: "low", impact: "medium", title: "Test backup restoration", guide: "Pick a random file, delete it (safely), and restore from backup. Document the process and time taken." },
      offsite: { effort: "medium", impact: "medium", title: "Store backups offsite/cloud", guide: "Enable cloud sync for local backups. Use the 3-2-1 rule: 3 copies, 2 media types, 1 offsite." },
      updates: { effort: "low", impact: "high", title: "Enable automatic updates", guide: "Turn on automatic OS updates. Schedule monthly patch reviews for business software." },
      antivirus: { effort: "low", impact: "medium", title: "Install endpoint protection", guide: "Windows Defender is built-in and effective. For Mac, consider Malwarebytes. Enable real-time scanning." },
      wifi: { effort: "low", impact: "low", title: "Secure WiFi with WPA3", guide: "Change WiFi password to 20+ characters. Enable WPA3 encryption. Create a separate guest network." },
      phishing: { effort: "medium", impact: "high", title: "Run phishing awareness training", guide: "Use free resources from KnowBe4 or SANS. Run a simulated phishing test quarterly." },
      policy: { effort: "medium", impact: "medium", title: "Write data handling policy", guide: "Document who can access what data, how it's stored, and what happens if there's a breach." },
      incident: { effort: "medium", impact: "high", title: "Create incident response plan", guide: "Document: who to call, how to contain, how to communicate. Test with a tabletop exercise." },
      vendor: { effort: "medium", impact: "medium", title: "Audit third-party data access", guide: "List all vendors with data access. Review their security practices. Revoke unnecessary access." },
      cloud: { effort: "low", impact: "medium", title: "Review cloud security settings", guide: "Check sharing settings, admin roles, and API access in Google/Microsoft/AWS admin consoles." },
    };

    Object.entries(controlMap).forEach(([id, info]) => {
      if (vulnIds.has(id)) {
        items.push({ ...info, linkedControl: id });
      }
    });

    return items;
  }, [answers]);

  // Group matrix items into quadrants
  const quickWins = improvementMatrix.filter(i => i.effort === "low" && (i.impact === "high" || i.impact === "medium"));
  const majorProjects = improvementMatrix.filter(i => (i.effort === "medium" || i.effort === "high") && i.impact === "high");
  const fillIns = improvementMatrix.filter(i => i.effort === "low" && i.impact === "low");
  const hardSlogs = improvementMatrix.filter(i => (i.effort === "medium" || i.effort === "high") && (i.impact === "low" || i.impact === "medium"));

  // Save to dashboard when results are shown
  useEffect(() => {
    if (showResults && !savedToDb && !isSaving) {
      const vulnerabilities = getVulnerabilities();
      const recommendations = vulnerabilities.slice(0, 5).map(v => ({
        title: `Enable ${v.question.includes("MFA") ? "Multi-Factor Authentication" : v.id.replace(/_/g, " ")}`,
        priority: (v.weight >= 8 ? "high" : "medium") as "high" | "medium",
        description: v.helpText,
      }));
      const insights = [
        `Cyber resilience score: ${score}/100 (${level.label})`,
        `${vulnerabilities.length} vulnerabilities identified`,
        `${getStrengths().length} security controls in place`,
      ];
      saveAssessment({
        domain: "strategic",
        toolId: "cyber-scorecard",
        answers: answers as Record<string, unknown>,
        score,
        confidence: allAnswered ? 1.0 : 0.7,
        insights,
        recommendations,
      });
    }
  }, [showResults, savedToDb, isSaving]);

  const handleScheduleReassessment = async () => {
    if (!user) return;
    try {
      await supabase.from("action_items").insert({
        user_id: user.id,
        title: "Reassess Cyber Resilience Scorecard",
        description: "Quarterly reassessment to track improvement trends",
        domain: "strategic",
        priority: "medium",
        due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      toast({ title: "Reassessment scheduled", description: "Action item created for 90 days from now" });
    } catch {
      toast({ title: "Error scheduling", variant: "destructive" });
    }
  };

  return (
    <UpgradeGate toolId="cyber-scorecard" toolName="Cyber Resilience Scorecard" toolDescription="A non-technical 15-point assessment of your human and procedural security.">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Cyber Resilience Scorecard
          </CardTitle>
          <CardDescription>
            A non-technical 15-point assessment of your human and procedural security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showResults ? (
            <>
              {categories.map((category) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{category}</h4>
                  {questions.filter((q) => q.category === category).map((q) => (
                    <div key={q.id} className="p-3 border rounded-lg space-y-2">
                      <p className="text-sm font-medium">{q.question}</p>
                      <p className="text-xs text-muted-foreground">{q.helpText}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant={answers[q.id] === true ? "default" : "outline"} onClick={() => handleAnswer(q.id, true)}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Yes
                        </Button>
                        <Button size="sm" variant={answers[q.id] === false ? "destructive" : "outline"} onClick={() => handleAnswer(q.id, false)}>
                          <XCircle className="h-4 w-4 mr-1" /> No
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <Button onClick={() => setShowResults(true)} disabled={!allAnswered} className="w-full">
                <Lock className="h-4 w-4 mr-2" /> Calculate My Score
              </Button>
              {!allAnswered && (
                <p className="text-xs text-center text-muted-foreground">
                  Answer all {questions.length} questions to see your score
                </p>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className={`text-center p-6 rounded-lg ${level.bg}`}>
                <p className="text-6xl font-bold mb-2">{score}</p>
                <Badge className={`${level.color} ${level.bg} border-0 text-lg px-4 py-1`}>{level.label}</Badge>
                <p className="text-sm mt-2 text-muted-foreground">out of 100 points</p>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium">Score by Category</h4>
                {getCategoryScores().map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{cat.name}</span>
                      <span className="font-medium">{cat.score}%</span>
                    </div>
                    <Progress value={cat.score} className="h-2" />
                  </div>
                ))}
              </div>

              {/* === ENHANCED PRO FEATURES === */}
              {tier === "pro" && (
                <Tabs defaultValue="threats" className="mt-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="threats" className="text-xs">
                      <Bug className="h-3.5 w-3.5 mr-1" /> Threat Sim
                    </TabsTrigger>
                    <TabsTrigger value="matrix" className="text-xs">
                      <Target className="h-3.5 w-3.5 mr-1" /> Priority Matrix
                    </TabsTrigger>
                    <TabsTrigger value="trend" className="text-xs">
                      <TrendingUp className="h-3.5 w-3.5 mr-1" /> Trend
                    </TabsTrigger>
                  </TabsList>

                  {/* THREAT SIMULATION */}
                  <TabsContent value="threats" className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">Pro Feature</Badge>
                      <span className="text-xs text-muted-foreground">Threat simulations based on your vulnerability profile</span>
                    </div>
                    {threatScenarios.map((scenario) => {
                      const Icon = scenario.icon;
                      return (
                        <Card key={scenario.id} className={`${scenario.color} border`}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-5 w-5" />
                                <h4 className="font-semibold text-sm">{scenario.title}</h4>
                              </div>
                              <Badge variant={scenario.likelihood === "High" ? "destructive" : scenario.likelihood === "Medium" ? "secondary" : "outline"} className="text-xs">
                                {scenario.likelihood} Risk
                              </Badge>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground italic">
                              "If a {scenario.title.toLowerCase()} hit you today..."
                            </p>
                            <p className="text-sm leading-relaxed">{scenario.narrative}</p>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-xs text-muted-foreground">Estimated financial impact</span>
                              <span className="text-lg font-bold text-destructive">{scenario.estimatedCost}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {scenario.linkedControls.map(c => (
                                <Badge key={c} variant="outline" className="text-xs">
                                  {answers[c] === true ? "✅" : "❌"} {c.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </TabsContent>

                  {/* PRIORITISED IMPROVEMENT MATRIX */}
                  <TabsContent value="matrix" className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">Pro Feature</Badge>
                      <span className="text-xs text-muted-foreground">Effort vs Impact prioritisation of improvements</span>
                    </div>

                    {/* 2x2 Visual Matrix */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Quick Wins */}
                      <Card className="border-green-500/30 bg-green-500/5">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-xs flex items-center gap-1 text-green-700">
                            <Zap className="h-3 w-3" /> Quick Wins
                          </CardTitle>
                          <CardDescription className="text-[10px]">Low effort, High impact</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-1.5">
                          {quickWins.length === 0 ? (
                            <p className="text-xs text-muted-foreground">All quick wins implemented! 🎉</p>
                          ) : quickWins.map((item, i) => (
                            <div key={i} className="p-1.5 rounded bg-background/80 text-xs">{item.title}</div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Major Projects */}
                      <Card className="border-amber-500/30 bg-amber-500/5">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-xs flex items-center gap-1 text-amber-700">
                            <Target className="h-3 w-3" /> Major Projects
                          </CardTitle>
                          <CardDescription className="text-[10px]">Higher effort, High impact</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-1.5">
                          {majorProjects.length === 0 ? (
                            <p className="text-xs text-muted-foreground">None needed currently</p>
                          ) : majorProjects.map((item, i) => (
                            <div key={i} className="p-1.5 rounded bg-background/80 text-xs">{item.title}</div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Fill-ins */}
                      <Card className="border-muted">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-xs text-muted-foreground">Fill-Ins</CardTitle>
                          <CardDescription className="text-[10px]">Low effort, Lower impact</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-1.5">
                          {fillIns.length === 0 ? (
                            <p className="text-xs text-muted-foreground">—</p>
                          ) : fillIns.map((item, i) => (
                            <div key={i} className="p-1.5 rounded bg-muted/50 text-xs">{item.title}</div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Hard slogs */}
                      <Card className="border-muted">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-xs text-muted-foreground">Consider Later</CardTitle>
                          <CardDescription className="text-[10px]">Higher effort, Lower impact</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-1.5">
                          {hardSlogs.length === 0 ? (
                            <p className="text-xs text-muted-foreground">—</p>
                          ) : hardSlogs.map((item, i) => (
                            <div key={i} className="p-1.5 rounded bg-muted/50 text-xs">{item.title}</div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Implementation guides for quick wins */}
                    {quickWins.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-1">
                          <Zap className="h-4 w-4 text-green-600" /> Quick Win Guides
                        </h4>
                        {quickWins.map((item, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-green-500/5">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{item.guide}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* CYBER RESILIENCE TREND */}
                  <TabsContent value="trend" className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">Pro Feature</Badge>
                      <span className="text-xs text-muted-foreground">Track your cyber resilience over time</span>
                    </div>

                    {scoreHistory.length >= 2 ? (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Cyber Resilience Trend</CardTitle>
                          <CardDescription className="text-xs">Score progression from your assessments</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={scoreHistory}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                                <Tooltip
                                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                                  formatter={(value: number) => [`${value}/100`, "Score"]}
                                />
                                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          {scoreHistory.length > 1 && (
                            <div className="mt-3 p-2 rounded bg-muted/50 text-xs text-center text-muted-foreground">
                              {scoreHistory[scoreHistory.length - 1].score > scoreHistory[scoreHistory.length - 2].score
                                ? `📈 Improving! Up from ${scoreHistory[scoreHistory.length - 2].score} to ${scoreHistory[scoreHistory.length - 1].score}`
                                : scoreHistory[scoreHistory.length - 1].score < scoreHistory[scoreHistory.length - 2].score
                                ? `📉 Score declined from ${scoreHistory[scoreHistory.length - 2].score} to ${scoreHistory[scoreHistory.length - 1].score} — review recent changes`
                                : `➡️ Stable at ${scoreHistory[scoreHistory.length - 1].score}`}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Complete 2+ assessments to see your trend chart.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Current assessment: {scoreHistory.length === 1 ? "1 recorded" : "This is your first"}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    <Button variant="outline" className="w-full" onClick={handleScheduleReassessment}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Schedule Quarterly Reassessment (90 days)
                    </Button>
                  </TabsContent>
                </Tabs>
              )}

              {/* Vulnerabilities (always shown) */}
              {getVulnerabilities().length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Prioritised Vulnerabilities
                  </h4>
                  {getVulnerabilities().slice(0, 5).map((v, i) => (
                    <div key={v.id} className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <div>
                          <p className="text-sm font-medium">{v.question.replace("Do you ", "").replace("?", "")}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Priority: {v.weight >= 8 ? "Critical" : v.weight >= 6 ? "High" : "Medium"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Strengths */}
              {getStrengths().length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Your Strengths ({getStrengths().length}/{questions.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {getStrengths().map((s) => (
                      <Badge key={s.id} variant="outline" className="bg-green-500/5">
                        {s.question.replace("Do you ", "").replace("?", "").slice(0, 30)}...
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Plan */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-medium mb-2">🎯 Your Top 3 Actions This Week</h4>
                <ol className="space-y-2 text-sm">
                  {getVulnerabilities().slice(0, 3).map((v, i) => (
                    <li key={v.id} className="flex gap-2">
                      <span className="font-bold">{i + 1}.</span>
                      <span>
                        {v.id === "mfa" && "Enable MFA on your email and banking accounts today"}
                        {v.id === "passwords" && "Change your 3 most important passwords to unique, strong ones"}
                        {v.id === "backups" && "Set up automatic weekly backups for critical files"}
                        {v.id === "phishing" && "Share a phishing awareness video with your team"}
                        {v.id === "updates" && "Run all pending software updates this week"}
                        {v.id === "incident" && "Draft a one-page 'who to call' incident response list"}
                        {v.id === "access_review" && "Audit and remove access for any departed staff"}
                        {!["mfa", "passwords", "backups", "phishing", "updates", "incident", "access_review"].includes(v.id) && v.helpText}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <Button onClick={reset} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" /> Retake Assessment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default CyberResilienceScorecard;
