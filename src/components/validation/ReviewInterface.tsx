import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, BookOpen, Send, AlertTriangle, HelpCircle } from "lucide-react";
import { evaluateReview, createEscalation, autoCreateCorrections, SCORE_GUIDANCE } from "./EscalationEngine";

const DOMAINS = [
  { value: "fais_financial_conduct", label: "Financial Conduct & FAIS" },
  { value: "popia", label: "POPIA" },
  { value: "cipc_companies_act", label: "CIPC / Companies Act" },
  { value: "labour_bcea", label: "Labour / BCEA" },
  { value: "fais_financial", label: "FAIS / Financial" },
];

interface ReviewForm {
  reviewer_name: string;
  reviewer_qualification: string;
  accuracy_score: number;
  sa_compliance_score: number;
  completeness_score: number;
  sme_accessibility_score: number;
  is_advice_harmful: boolean;
  is_advice_misleading: boolean;
  is_advice_incomplete: boolean;
  specific_errors: string;
  missing_content: string;
  correct_answer_summary: string;
  sa_references_to_add: string;
}

const defaultForm: ReviewForm = {
  reviewer_name: "", reviewer_qualification: "",
  accuracy_score: 3, sa_compliance_score: 3, completeness_score: 3, sme_accessibility_score: 3,
  is_advice_harmful: false, is_advice_misleading: false, is_advice_incomplete: false,
  specific_errors: "", missing_content: "", correct_answer_summary: "", sa_references_to_add: "",
};

const SCORE_KEYS = [
  { key: "accuracy_score", label: "Accuracy", guidance: SCORE_GUIDANCE.accuracy },
  { key: "sa_compliance_score", label: "SA Compliance", guidance: SCORE_GUIDANCE.sa_compliance },
  { key: "completeness_score", label: "Completeness", guidance: SCORE_GUIDANCE.completeness },
  { key: "sme_accessibility_score", label: "SME Accessibility", guidance: SCORE_GUIDANCE.sme_accessibility },
];

export default function ReviewInterface() {
  const queryClient = useQueryClient();
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [form, setForm] = useState<ReviewForm>({ ...defaultForm });
  const [showGuidance, setShowGuidance] = useState(false);

  const { data: responses } = useQuery({
    queryKey: ["validation-responses-for-review"],
    queryFn: async () => {
      const { data } = await supabase
        .from("validation_responses")
        .select("*, validation_questions(*)")
        .order("response_generated_at", { ascending: false });
      return data || [];
    },
  });

  const { data: existingReviews } = useQuery({
    queryKey: ["existing-reviews"],
    queryFn: async () => {
      const { data } = await supabase.from("expert_reviews").select("response_id");
      return new Set((data || []).map((r: any) => r.response_id));
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (responseId: string) => {
      const refs = form.sa_references_to_add.split(",").map((r) => r.trim()).filter(Boolean);
      const question = filtered[currentIndex]?.validation_questions;

      const { data: inserted, error } = await supabase.from("expert_reviews").insert({
        response_id: responseId,
        reviewer_name: form.reviewer_name,
        reviewer_qualification: form.reviewer_qualification,
        reviewer_domain: question?.domain || "fais_financial_conduct",
        accuracy_score: form.accuracy_score,
        sa_compliance_score: form.sa_compliance_score,
        completeness_score: form.completeness_score,
        sme_accessibility_score: form.sme_accessibility_score,
        is_advice_harmful: form.is_advice_harmful,
        is_advice_misleading: form.is_advice_misleading,
        is_advice_incomplete: form.is_advice_incomplete,
        specific_errors: form.specific_errors || null,
        missing_content: form.missing_content || null,
        correct_answer_summary: form.correct_answer_summary || null,
        sa_references_to_add: refs,
        review_status: "reviewed",
      } as any).select("id").single();
      if (error) throw error;

      // Evaluate escalation
      const escalation = evaluateReview(form);
      if (inserted && (escalation.level === "critical" || escalation.level === "high")) {
        await createEscalation(responseId, inserted.id, escalation);
      }

      // Auto-create corrections if errors/missing content provided
      if (inserted && (form.specific_errors?.trim() || form.missing_content?.trim())) {
        const count = await autoCreateCorrections(inserted.id, {
          specific_errors: form.specific_errors,
          missing_content: form.missing_content,
          is_advice_harmful: form.is_advice_harmful,
          accuracy_score: form.accuracy_score,
          sa_compliance_score: form.sa_compliance_score,
          reviewer_domain: question?.domain || "fais_financial_conduct",
        });
        if (count > 0) {
          toast.info(`${count} correction(s) auto-generated for admin review`);
        }
      }

      return escalation;
    },
    onSuccess: (escalation) => {
      queryClient.invalidateQueries({ queryKey: ["existing-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["expert-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-corrections-full"] });

      if (escalation.blocked) {
        toast.warning(`ESCALATED (${escalation.level.toUpperCase()}): ${escalation.reason}`);
      } else if (escalation.level === "high") {
        toast.warning(`Escalated: ${escalation.reason}`);
      } else {
        toast.success("Review submitted successfully");
      }

      setForm({ ...defaultForm, reviewer_name: form.reviewer_name, reviewer_qualification: form.reviewer_qualification });
      if (currentIndex < filtered.length - 1) setCurrentIndex(currentIndex + 1);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (responses || []).filter((r: any) => {
    if (filterDomain !== "all" && r.validation_questions?.domain !== filterDomain) return false;
    if (existingReviews?.has(r.id)) return false;
    return true;
  });

  const current = filtered[currentIndex];
  const question = current?.validation_questions;

  // Live escalation preview
  const liveEscalation = evaluateReview(form);

  return (
    <div className="space-y-4">
      {/* Reviewer Info */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Reviewer Name</Label>
              <Input value={form.reviewer_name} onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })} placeholder="Dr. Nkosi Mabena" />
            </div>
            <div>
              <Label>Qualification</Label>
              <Input value={form.reviewer_qualification} onChange={(e) => setForm({ ...form, reviewer_qualification: e.target.value })} placeholder="CA(SA), SAICA member" />
            </div>
            <div>
              <Label>Filter Domain</Label>
              <Select value={filterDomain} onValueChange={(v) => { setFilterDomain(v); setCurrentIndex(0); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {DOMAINS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Escalation Status */}
      {(liveEscalation.level === "critical" || liveEscalation.level === "high" || liveEscalation.level === "below_threshold") && (
        <Card className={liveEscalation.level === "critical" ? "border-destructive bg-destructive/5" : liveEscalation.level === "high" ? "border-amber-500 bg-amber-500/5" : "border-muted"}>
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${liveEscalation.level === "critical" ? "text-destructive" : "text-amber-500"}`} />
            <span className="text-sm font-medium">{liveEscalation.reason}</span>
          </CardContent>
        </Card>
      )}

      {!current ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No unreviewed responses available. Run a validation batch first.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Question + Response */}
          <div className="space-y-4">
            {/* Business Scenario Context */}
            {question?.question_context && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-3">
                  <p className="text-sm font-medium text-primary">📋 Business Scenario</p>
                  <p className="text-sm mt-1">{question.question_context}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Validation Question</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{DOMAINS.find((d) => d.value === question?.domain)?.label}</Badge>
                    <Badge variant="secondary">{question?.difficulty}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-medium">{question?.question_text}</p>
                {question?.expected_topic_coverage && <p className="text-sm text-muted-foreground"><strong>Expected coverage:</strong> {question.expected_topic_coverage}</p>}
              </CardContent>
            </Card>

            {/* SA Law References Panel */}
            {(question?.sa_law_references ?? []).length > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" />SA Law References</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(question?.sa_law_references ?? []).map((ref: string, i: number) => (
                      <Badge key={i} variant="outline">{ref}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-base">Agent Response</CardTitle></CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap bg-muted/50 p-4 rounded-md max-h-96 overflow-y-auto">
                  {current.agent_response}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Model: {current.agent_model_version || "unknown"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Scoring Panel */}
          <div className="space-y-4">
            {/* Scoring Guidance Toggle */}
            <Collapsible open={showGuidance} onOpenChange={setShowGuidance}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  {showGuidance ? "Hide" : "Show"} Scoring Guidance
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2 bg-muted/30">
                  <CardContent className="pt-4 space-y-3">
                    {SCORE_KEYS.map(({ label, guidance }) => (
                      <div key={label}>
                        <p className="font-medium text-sm">{label}</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5 ml-2">
                          {guidance.map((g, i) => <li key={i}>{g}</li>)}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            <Card>
              <CardHeader><CardTitle className="text-base">Scoring (1–5)</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {SCORE_KEYS.map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <Label>{label}</Label>
                      <span className="font-bold text-primary">{(form as any)[key]}</span>
                    </div>
                    <Slider
                      value={[(form as any)[key]]}
                      onValueChange={([v]) => setForm({ ...form, [key]: v })}
                      min={1} max={5} step={1}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Flags</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "is_advice_harmful", label: "⚠️ Harmful advice (dangerous / illegal)" },
                  { key: "is_advice_misleading", label: "🔶 Misleading advice" },
                  { key: "is_advice_incomplete", label: "📝 Incomplete advice" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      checked={(form as any)[key]}
                      onCheckedChange={(v) => setForm({ ...form, [key]: !!v })}
                    />
                    <Label className="text-sm">{label}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Detailed Feedback</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Specific Errors Found</Label>
                  <Textarea value={form.specific_errors} onChange={(e) => setForm({ ...form, specific_errors: e.target.value })} placeholder="Exact factual errors..." rows={2} />
                </div>
                <div>
                  <Label>Missing Content</Label>
                  <Textarea value={form.missing_content} onChange={(e) => setForm({ ...form, missing_content: e.target.value })} placeholder="Important content the agent omitted..." rows={2} />
                </div>
                <div>
                  <Label>Correct Answer Summary</Label>
                  <Textarea value={form.correct_answer_summary} onChange={(e) => setForm({ ...form, correct_answer_summary: e.target.value })} placeholder="What the agent SHOULD have said..." rows={2} />
                </div>
                <div>
                  <Label>SA References to Add (comma-separated)</Label>
                  <Input value={form.sa_references_to_add} onChange={(e) => setForm({ ...form, sa_references_to_add: e.target.value })} placeholder="Income Tax Act s10, POPIA s19" />
                </div>
              </CardContent>
            </Card>

            {/* Navigation + Submit */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{currentIndex + 1} / {filtered.length}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentIndex(Math.min(filtered.length - 1, currentIndex + 1))} disabled={currentIndex >= filtered.length - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={() => submitMutation.mutate(current.id)}
                disabled={!form.reviewer_name || !form.reviewer_qualification || submitMutation.isPending}
                variant={liveEscalation.level === "critical" ? "destructive" : "default"}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitMutation.isPending ? "Submitting..." : liveEscalation.blocked ? "Submit & Block" : "Submit Review"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
