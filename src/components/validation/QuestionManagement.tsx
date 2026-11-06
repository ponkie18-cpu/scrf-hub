import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Play, Filter } from "lucide-react";

const DOMAINS = [
  { value: "fais_financial_conduct", label: "Financial Conduct & FAIS" },
  { value: "popia", label: "POPIA" },
  { value: "cipc_companies_act", label: "CIPC / Companies Act" },
  { value: "labour_bcea", label: "Labour / BCEA" },
  { value: "fais_financial", label: "FAIS / Financial" },
];

const DIFFICULTIES = [
  { value: "basic", label: "Basic" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function QuestionManagement() {
  const queryClient = useQueryClient();
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newQ, setNewQ] = useState({
    domain: "", question_text: "", question_context: "",
    expected_topic_coverage: "", difficulty: "intermediate",
    sa_law_references: "",
  });

  const { data: questions, isLoading } = useQuery({
    queryKey: ["validation-questions-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("validation_questions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const refs = newQ.sa_law_references.split(",").map((r) => r.trim()).filter(Boolean);
      const { error } = await supabase.from("validation_questions").insert({
        domain: newQ.domain,
        question_text: newQ.question_text,
        question_context: newQ.question_context || null,
        expected_topic_coverage: newQ.expected_topic_coverage || null,
        difficulty: newQ.difficulty,
        sa_law_references: refs,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["validation-questions-full"] });
      setShowAddDialog(false);
      setNewQ({ domain: "", question_text: "", question_context: "", expected_topic_coverage: "", difficulty: "intermediate", sa_law_references: "" });
      toast.success("Question added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("validation_questions")
        .update({ is_active: !isActive } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["validation-questions-full"] }),
  });

  const runBatchMutation = useMutation({
    mutationFn: async (domain: string) => {
      const domainQs = (questions || []).filter((q: any) => q.domain === domain && q.is_active);
      if (!domainQs.length) throw new Error("No active questions in this domain");
      const { data, error } = await supabase.functions.invoke("run-validation-batch", {
        body: { domain, questionIds: domainQs.map((q: any) => q.id) },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(`Batch complete: ${data.responsesGenerated} responses generated`);
      queryClient.invalidateQueries({ queryKey: ["validation-responses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (questions || []).filter((q: any) => {
    if (filterDomain !== "all" && q.domain !== filterDomain) return false;
    if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Question</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Validation Question</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Domain</Label>
                <Select value={newQ.domain} onValueChange={(v) => setNewQ({ ...newQ, domain: v })}>
                  <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                  <SelectContent>
                    {DOMAINS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Question</Label>
                <Textarea value={newQ.question_text} onChange={(e) => setNewQ({ ...newQ, question_text: e.target.value })} placeholder="Enter the validation question..." />
              </div>
              <div>
                <Label>Context (optional)</Label>
                <Input value={newQ.question_context} onChange={(e) => setNewQ({ ...newQ, question_context: e.target.value })} placeholder="Business type / scenario" />
              </div>
              <div>
                <Label>Expected Topic Coverage (optional)</Label>
                <Textarea value={newQ.expected_topic_coverage} onChange={(e) => setNewQ({ ...newQ, expected_topic_coverage: e.target.value })} placeholder="What a correct answer should address" />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={newQ.difficulty} onValueChange={(v) => setNewQ({ ...newQ, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>SA Law References (comma-separated)</Label>
                <Input value={newQ.sa_law_references} onChange={(e) => setNewQ({ ...newQ, sa_law_references: e.target.value })} placeholder="Income Tax Act s10(1)(o), VAT Act s7" />
              </div>
              <Button onClick={() => addMutation.mutate()} disabled={!newQ.domain || !newQ.question_text || addMutation.isPending} className="w-full">
                {addMutation.isPending ? "Adding..." : "Add Question"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {DOMAINS.map((d) => (
          <Button key={d.value} variant="outline" size="sm" onClick={() => runBatchMutation.mutate(d.value)} disabled={runBatchMutation.isPending}>
            <Play className="h-3 w-3 mr-1" />Run {d.label}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterDomain} onValueChange={setFilterDomain}>
          <SelectTrigger className="w-48"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {DOMAINS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            {DIFFICULTIES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Question List */}
      <div className="space-y-3">
        {isLoading && <p className="text-muted-foreground">Loading questions...</p>}
        {filtered.map((q: any) => (
          <Card key={q.id} className={!q.is_active ? "opacity-50" : ""}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{q.question_text}</p>
                  {q.question_context && <p className="text-sm text-muted-foreground">Context: {q.question_context}</p>}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{DOMAINS.find((d) => d.value === q.domain)?.label || q.domain}</Badge>
                    <Badge variant="secondary">{q.difficulty}</Badge>
                    {(q.sa_law_references || []).map((ref: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{ref}</Badge>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleActiveMutation.mutate({ id: q.id, isActive: q.is_active })}>
                  {q.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && !filtered.length && (
          <p className="text-center text-muted-foreground py-8">No questions found. Add your first validation question above.</p>
        )}
      </div>
    </div>
  );
}
