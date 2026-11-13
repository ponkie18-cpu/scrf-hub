import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, Plus, Zap } from "lucide-react";

const SEVERITY_CONFIG: Record<string, { color: string; variant: "destructive" | "default" | "secondary" | "outline" }> = {
  critical: { color: "text-red-500", variant: "destructive" },
  high: { color: "text-amber-500", variant: "default" },
  medium: { color: "text-blue-500", variant: "secondary" },
  low: { color: "text-muted-foreground", variant: "outline" },
};

const CORRECTION_TYPES = [
  { value: "factual_error", label: "Factual Error" },
  { value: "missing_context", label: "Missing Context" },
  { value: "outdated_law", label: "Outdated Law" },
  { value: "incorrect_threshold", label: "Incorrect Threshold" },
  { value: "wrong_entity_type", label: "Wrong Entity Type" },
  { value: "misleading_framing", label: "Misleading Framing" },
];

export default function CorrectionsTracker() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCorrection, setNewCorrection] = useState({
    review_id: "", domain: "", correction_type: "factual_error",
    original_agent_statement: "", corrected_statement: "",
    supporting_reference: "", severity: "medium",
  });

  const { data: corrections, isLoading } = useQuery({
    queryKey: ["knowledge-corrections-full"],
    queryFn: async () => {
      const { data } = await supabase
        .from("knowledge_corrections")
        .select("*, expert_reviews(reviewer_name, response_id)")
        .order("severity", { ascending: true });
      return data || [];
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews-for-corrections"],
    queryFn: async () => {
      const { data } = await supabase.from("expert_reviews").select("id, reviewer_name, review_status").eq("review_status", "reviewed");
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("knowledge_corrections").insert({
        review_id: newCorrection.review_id,
        domain: newCorrection.domain,
        correction_type: newCorrection.correction_type,
        original_agent_statement: newCorrection.original_agent_statement,
        corrected_statement: newCorrection.corrected_statement,
        supporting_reference: newCorrection.supporting_reference || null,
        severity: newCorrection.severity,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-corrections-full"] });
      setShowAddDialog(false);
      toast.success("Correction added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const applyMutation = useMutation({
    mutationFn: async (correctionId: string) => {
      const { data, error } = await supabase.functions.invoke("apply-knowledge-correction", {
        body: { correctionId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-corrections-full"] });
      queryClient.invalidateQueries({ queryKey: ["system-prompt-updates"] });
      toast.success(data.message);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Sort by severity priority
  const severityOrder = ["critical", "high", "medium", "low"];
  const sorted = [...(corrections || [])].sort((a: any, b: any) =>
    severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Knowledge Corrections</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Correction</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Knowledge Correction</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Review</Label>
                <Select value={newCorrection.review_id} onValueChange={(v) => setNewCorrection({ ...newCorrection, review_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select review" /></SelectTrigger>
                  <SelectContent>
                    {(reviews || []).map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>{r.reviewer_name} — {r.id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Domain</Label>
                <Select value={newCorrection.domain} onValueChange={(v) => setNewCorrection({ ...newCorrection, domain: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[{ value: "tax_sars", label: "Tax / SARS" }, { value: "popia", label: "POPIA" }, { value: "cipc_companies_act", label: "CIPC" }, { value: "labour_bcea", label: "Labour" }, { value: "fais_financial", label: "FAIS" }].map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Correction Type</Label>
                <Select value={newCorrection.correction_type} onValueChange={(v) => setNewCorrection({ ...newCorrection, correction_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CORRECTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={newCorrection.severity} onValueChange={(v) => setNewCorrection({ ...newCorrection, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Original Agent Statement</Label>
                <Textarea value={newCorrection.original_agent_statement} onChange={(e) => setNewCorrection({ ...newCorrection, original_agent_statement: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>Corrected Statement</Label>
                <Textarea value={newCorrection.corrected_statement} onChange={(e) => setNewCorrection({ ...newCorrection, corrected_statement: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>Supporting Reference</Label>
                <Input value={newCorrection.supporting_reference} onChange={(e) => setNewCorrection({ ...newCorrection, supporting_reference: e.target.value })} placeholder="Income Tax Act s10(1)(o)" />
              </div>
              <Button onClick={() => addMutation.mutate()} disabled={!newCorrection.review_id || !newCorrection.domain || addMutation.isPending} className="w-full">
                {addMutation.isPending ? "Adding..." : "Add Correction"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading corrections...</p>}

      <div className="space-y-3">
        {sorted.map((c: any) => {
          const config = SEVERITY_CONFIG[c.severity] || SEVERITY_CONFIG.low;
          return (
            <Card key={c.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant}>{c.severity}</Badge>
                      <Badge variant="outline">{CORRECTION_TYPES.find((t) => t.value === c.correction_type)?.label || c.correction_type}</Badge>
                      <Badge variant="outline">{c.domain}</Badge>
                      {c.applied_to_system_prompt && <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Previously applied</Badge>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-medium text-destructive">Original:</p>
                        <p className="text-muted-foreground">{c.original_agent_statement}</p>
                      </div>
                      <div>
                        <p className="font-medium text-green-600">Corrected:</p>
                        <p>{c.corrected_statement}</p>
                      </div>
                    </div>
                    {c.supporting_reference && (
                      <p className="text-xs text-muted-foreground">Reference: {c.supporting_reference}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={c.severity === "critical" || c.severity === "high" ? "destructive" : "outline"}
                    onClick={() => applyMutation.mutate(c.id)}
                    disabled={applyMutation.isPending}
                  >
                    <Zap className="h-3 w-3 mr-1" />Submit for approval
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && !sorted.length && (
          <p className="text-center text-muted-foreground py-8">No corrections yet. Submit expert reviews to identify corrections.</p>
        )}
      </div>
    </div>
  );
}
