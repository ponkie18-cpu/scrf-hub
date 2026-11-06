import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, AlertTriangle, Info, CheckCircle, Filter, Loader2, Save, Eye, Sparkles } from "lucide-react";
import { useAssessmentSave } from "@/hooks/useAssessmentSave";
import type { AssessmentRecommendation } from "@/services/assessmentService";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LocalDisclaimer } from "@/components/advisor/LocalDisclaimer";
import { formatDateSA } from "@/lib/dateFormat";

interface RegulatoryUpdate {
  id: string;
  title: string;
  description: string;
  impact: string;
  category: string;
  effective_date?: string | null;
  industries: string[];
  jurisdictions: string[];
  ai_summary?: string | null;
  created_at: string;
}

const industries = [
  { value: "all", label: "All Industries" },
  { value: "technology", label: "Technology" },
  { value: "retail", label: "Retail" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Financial Services" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "hospitality", label: "Hospitality" },
  { value: "construction", label: "Construction" },
  { value: "services", label: "Professional Services" },
];

const jurisdictions = [
  { value: "national", label: "National (South Africa)" },
  { value: "gauteng", label: "Gauteng" },
  { value: "western_cape", label: "Western Cape" },
  { value: "kwazulu_natal", label: "KwaZulu-Natal" },
  { value: "eastern_cape", label: "Eastern Cape" },
  { value: "free_state", label: "Free State" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "north_west", label: "North West" },
  { value: "northern_cape", label: "Northern Cape" },
];

const RegulatoryTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("national");
  const [updates, setUpdates] = useState<RegulatoryUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [savingPrefs, setSavingPrefs] = useState(false);
  const { saveAssessment, isSaving } = useAssessmentSave();

  // Load user preferences and regulatory updates
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Load user preferences
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("industry_code, jurisdiction")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.industry_code) setSelectedIndustry(profile.industry_code);
        if (profile?.jurisdiction) setSelectedJurisdiction(profile.jurisdiction);

        // Load reviewed items from audit trail
        const { data: auditData } = await supabase
          .from("audit_trail")
          .select("entity_id")
          .eq("user_id", user.id)
          .eq("action", "reviewed_regulatory_alert")
          .eq("entity_type", "regulatory_update");
        if (auditData) {
          setReviewedIds(new Set(auditData.map((a) => a.entity_id)));
        }
      }

      // Load regulatory updates from database
      const { data, error } = await supabase
        .from("regulatory_updates")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setUpdates(data);
      setLoading(false);
    };
    loadData();
  }, [user]);

  // Save industry/jurisdiction preferences
  const savePreferences = async () => {
    if (!user) return;
    setSavingPrefs(true);
    try {
      await supabase
        .from("profiles")
        .update({ industry_code: selectedIndustry, jurisdiction: selectedJurisdiction })
        .eq("id", user.id);
      toast({ title: "Preferences saved", description: "Your alert filters have been updated." });
    } catch (e) {
      console.error("Save prefs error:", e);
    } finally {
      setSavingPrefs(false);
    }
  };

  // Filter updates by user preferences
  const filteredUpdates = updates.filter((update) => {
    const industryMatch =
      selectedIndustry === "all" ||
      update.industries.includes("all") ||
      update.industries.includes(selectedIndustry);
    const jurisdictionMatch =
      update.jurisdictions.includes("national") ||
      update.jurisdictions.includes(selectedJurisdiction) ||
      selectedJurisdiction === "national";
    return industryMatch && jurisdictionMatch;
  });

  const markAsReviewed = async (updateId: string) => {
    if (!user) return;
    try {
      await supabase.from("audit_trail").insert({
        user_id: user.id,
        action: "reviewed_regulatory_alert",
        entity_type: "regulatory_update",
        entity_id: updateId,
        metadata: { reviewed_at: new Date().toISOString() },
      });
      setReviewedIds((prev) => new Set([...prev, updateId]));
      toast({ title: "Marked as reviewed", description: "Logged to your compliance audit trail." });
    } catch (e) {
      console.error("Mark reviewed error:", e);
    }
  };

  const handleSaveToDashboard = async () => {
    const highImpact = filteredUpdates.filter((u) => u.impact === "high");
    const score = Math.max(100 - highImpact.length * 15, 30);
    const insights = [
      `${highImpact.length} high-impact regulatory changes require attention`,
      `Monitoring ${filteredUpdates.length} relevant updates`,
      `Industry: ${industries.find((i) => i.value === selectedIndustry)?.label || selectedIndustry}`,
    ];
    const recommendations: AssessmentRecommendation[] = highImpact.map((u) => ({
      title: `Address: ${u.title}`,
      priority: "high" as const,
      description: u.ai_summary || u.description,
    }));
    const result = await saveAssessment({
      domain: "compliance",
      toolId: "regulatory-tracker",
      answers: { selectedIndustry, selectedJurisdiction, trackedUpdates: filteredUpdates.map((u) => u.id) },
      score,
      insights,
      recommendations,
    });
    if (result.success) setSaved(true);
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high": return <Badge variant="destructive">High Impact</Badge>;
      case "medium": return <Badge className="bg-amber-500 hover:bg-amber-600">Medium</Badge>;
      default: return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "high": return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "medium": return <Info className="h-5 w-5 text-amber-500" />;
      default: return <CheckCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <UpgradeGate toolId="regulatory-tracker" toolName="Regulatory Change Tracker" toolDescription="Stay informed with AI-powered regulatory alerts matched to your industry and jurisdiction.">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Regulatory Change Tracker
          </CardTitle>
          <CardDescription>Proactive alert engine — matched to your business profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Industry & Jurisdiction Filters */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              <span>Your Alert Preferences</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Industry</label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Province / Jurisdiction</label>
                <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {jurisdictions.map((j) => (
                      <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={savePreferences} disabled={savingPrefs} size="sm">
              {savingPrefs ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving...</> : <><Save className="h-3 w-3 mr-1" /> Save Preferences</>}
            </Button>
          </div>

          {/* Updates List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending Updates */}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Pending Updates</h4>
                <span className="text-sm text-muted-foreground">{filteredUpdates.filter(u => !reviewedIds.has(u.id)).length} pending</span>
              </div>

              {filteredUpdates.filter(u => !reviewedIds.has(u.id)).map((update) => (
                <div key={update.id} className="p-4 border rounded-lg transition-colors space-y-3 border-border hover:border-primary/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {getImpactIcon(update.impact)}
                      <div>
                        <h5 className="font-medium">{update.title}</h5>
                        <p className="text-sm text-muted-foreground mt-1">{update.description}</p>
                      </div>
                    </div>
                    {getImpactBadge(update.impact)}
                  </div>
                  {update.ai_summary && (
                    <div className="ml-8 p-3 bg-primary/5 rounded border border-primary/10">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium text-primary">AI Summary</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{update.ai_summary}</p>
                    </div>
                  )}
                  <div className="ml-8 flex items-center gap-3 flex-wrap">
                    <Badge variant="outline">{update.category}</Badge>
                    {update.effective_date && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Effective: {formatDateSA(update.effective_date)}
                      </span>
                    )}
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => markAsReviewed(update.id)}>
                      <Eye className="h-3 w-3 mr-1" /> Mark as Reviewed
                    </Button>
                  </div>
                  <div className="ml-8 text-[10px] text-muted-foreground/60 italic">
                    ℹ️ Enforcement and interpretation vary by jurisdiction. Consult a local professional for definitive guidance.
                  </div>
                </div>
              ))}

              {filteredUpdates.filter(u => !reviewedIds.has(u.id)).length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  All updates reviewed — great compliance hygiene!
                </div>
              )}

              {/* Completed / Reviewed Section */}
              {filteredUpdates.filter(u => reviewedIds.has(u.id)).length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="font-semibold flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Reviewed & Actioned ({filteredUpdates.filter(u => reviewedIds.has(u.id)).length})
                  </h4>
                  {filteredUpdates.filter(u => reviewedIds.has(u.id)).map((update) => (
                    <div key={update.id} className="p-3 border rounded-lg border-green-200 bg-green-50/30 dark:bg-green-950/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="text-sm font-medium">{update.title}</span>
                        </div>
                        {getImpactBadge(update.impact)}
                      </div>
                      {update.effective_date && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          Effective: {formatDateSA(update.effective_date)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Save to Dashboard */}
          <div className="flex flex-col sm:flex-row gap-2">
            {!saved ? (
              <Button onClick={handleSaveToDashboard} disabled={isSaving} className="flex-1">
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save to Dashboard</>}
              </Button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 rounded-md py-2">
                <CheckCircle className="h-4 w-4" /> Saved to Dashboard
              </div>
            )}
          </div>

          {/* Local Intelligence Disclaimer */}
          <LocalDisclaimer />
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default RegulatoryTracker;
