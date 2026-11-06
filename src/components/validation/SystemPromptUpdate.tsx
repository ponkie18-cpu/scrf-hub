import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle, Eye, Clock } from "lucide-react";

interface CorrectionDetail {
  domain: string;
  original_agent_statement: string;
  corrected_statement: string;
  supporting_reference: string | null;
  severity: string | null;
}

interface PendingUpdate {
  id: string;
  correction_id: string;
  proposed_addition: string;
  current_knowledge_snapshot: string | null;
  submitted_by: string;
  submitted_at: string;
  approved_by: string | null;
  approved_at: string | null;
  status: string;
  rejection_reason: string | null;
  correction: CorrectionDetail | null;
}

export default function SystemPromptUpdate() {
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingUpdates, isLoading } = useQuery({
    queryKey: ["system-prompt-updates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("system_prompt_updates")
        .select(`
          *,
          correction:knowledge_corrections(
            domain, original_agent_statement, corrected_statement, 
            supporting_reference, severity
          )
        `)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PendingUpdate[];
    },
  });

  const { data: currentKnowledge } = useQuery({
    queryKey: ["agent-knowledge-base"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_knowledge_base")
        .select("*")
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (updateId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const update = pendingUpdates?.find(u => u.id === updateId);
      if (!update) throw new Error("Update not found");

      if (update.submitted_by === user.email) {
        throw new Error("You cannot approve your own submission. A different admin must approve (4-eyes principle).");
      }

      const { error: updateError } = await (supabase as any)
        .from("system_prompt_updates")
        .update({
          approved_by: user.email,
          approved_at: new Date().toISOString(),
          status: "approved",
        })
        .eq("id", updateId);

      if (updateError) throw updateError;

      const { data, error } = await supabase.functions.invoke("apply-knowledge-correction", {
        body: { correctionId: update.correction_id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Knowledge correction approved and applied");
      queryClient.invalidateQueries({ queryKey: ["system-prompt-updates"] });
      queryClient.invalidateQueries({ queryKey: ["agent-knowledge-base"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-corrections"] });
      setReviewingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ updateId, reason }: { updateId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any)
        .from("system_prompt_updates")
        .update({
          approved_by: user.email,
          approved_at: new Date().toISOString(),
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", updateId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Update rejected");
      queryClient.invalidateQueries({ queryKey: ["system-prompt-updates"] });
      setReviewingId(null);
      setRejectionReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pending = pendingUpdates?.filter(u => u.status === "pending") || [];
  const processed = pendingUpdates?.filter(u => u.status !== "pending") || [];

  const getSeverityBadge = (severity: string | null) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive">CRITICAL</Badge>;
      case "high": return <Badge variant="default">HIGH</Badge>;
      case "medium": return <Badge variant="secondary">MEDIUM</Badge>;
      default: return <Badge variant="outline">LOW</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 4-Eyes Warning Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">4-Eyes Approval Required</p>
              <p className="text-sm text-muted-foreground">
                Critical and high-severity corrections require approval from a different admin than the submitter.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Knowledge Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Current Agent Knowledge Base ({currentKnowledge?.length || 0} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentKnowledge?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No corrections applied yet</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {currentKnowledge?.slice(0, 10).map((entry) => (
                <div key={entry.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{entry.domain}</Badge>
                    {entry.supporting_reference && (
                      <span className="text-xs text-muted-foreground">{entry.supporting_reference}</span>
                    )}
                  </div>
                  <p className="text-foreground">{entry.corrected_statement}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Pending Approvals ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}
          {pending.length === 0 && !isLoading && (
            <p className="text-muted-foreground text-center py-4">No pending approvals</p>
          )}
          <div className="space-y-4">
            {pending.map((update) => (
              <Card key={update.id} className="border-border">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{update.correction?.domain}</Badge>
                        {getSeverityBadge(update.correction?.severity || null)}
                      </div>

                      <div className="grid gap-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Original (incorrect):</p>
                          <p className="text-sm line-through text-destructive/80">
                            {update.correction?.original_agent_statement}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Corrected:</p>
                          <div className="text-sm bg-primary/10 text-foreground p-2 rounded border border-primary/20">
                            {update.correction?.corrected_statement}
                          </div>
                        </div>
                        {update.correction?.supporting_reference && (
                          <p className="text-xs text-muted-foreground">
                            Reference: {update.correction.supporting_reference}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Submitted by {update.submitted_by} on {new Date(update.submitted_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(update.id)}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Dialog open={reviewingId === update.id} onOpenChange={(o) => !o && setReviewingId(null)}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setReviewingId(update.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Knowledge Correction</DialogTitle>
                          </DialogHeader>
                          <Textarea
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          />
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setReviewingId(null)}>Cancel</Button>
                            <Button
                              variant="destructive"
                              onClick={() => rejectMutation.mutate({ updateId: update.id, reason: rejectionReason })}
                              disabled={!rejectionReason.trim() || rejectMutation.isPending}
                            >
                              Confirm Rejection
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processed Updates History */}
      {processed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processed.slice(0, 10).map((update) => (
                <div key={update.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {update.status === "approved" ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{update.correction?.domain}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {update.correction?.corrected_statement}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{update.status === "approved" ? "Approved" : "Rejected"} by {update.approved_by}</p>
                    <p>{update.approved_at && new Date(update.approved_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
