import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EvalQuestion } from "./useEvalData";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const sb = supabase as any;

export default function QuestionManagement({ questions }: { questions: EvalQuestion[] }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newQ, setNewQ] = useState({ category: "grounding", question_text: "", expected_behaviour: "", red_flags: "", difficulty: "basic", domain: "operational" });

  const toggleActive = async (q: EvalQuestion) => {
    await sb.from("eval_questions").update({ is_active: !q.is_active }).eq("id", q.id);
    queryClient.invalidateQueries({ queryKey: ["eval-questions-all"] });
    toast.success(`Question ${q.is_active ? "deactivated" : "activated"}`);
  };

  const addQuestion = async () => {
    if (!newQ.question_text || !newQ.expected_behaviour) { toast.error("Question and expected behaviour required"); return; }
    await sb.from("eval_questions").insert({
      ...newQ,
      red_flags: newQ.red_flags.split(",").map((s: string) => s.trim()).filter(Boolean),
    });
    queryClient.invalidateQueries({ queryKey: ["eval-questions-all"] });
    setDialogOpen(false);
    setNewQ({ category: "grounding", question_text: "", expected_behaviour: "", red_flags: "", difficulty: "basic", domain: "operational" });
    toast.success("Question added");
  };

  const active = questions.filter((q) => q.is_active);
  const inactive = questions.filter((q) => !q.is_active);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Question Bank ({active.length} active, {inactive.length} inactive)</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Question</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Evaluation Question</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={newQ.category} onValueChange={(v) => setNewQ({ ...newQ, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {["grounding", "accuracy", "scope_compliance", "response_quality", "sa_context"].map((c) => (
                        <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newQ.domain} onValueChange={(v) => setNewQ({ ...newQ, domain: v })}>
                    <SelectTrigger><SelectValue placeholder="Domain" /></SelectTrigger>
                    <SelectContent>
                      {["operational", "financial", "compliance", "strategic", "boundary"].map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={newQ.difficulty} onValueChange={(v) => setNewQ({ ...newQ, difficulty: v })}>
                  <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                  <SelectContent>
                    {["basic", "intermediate", "advanced", "adversarial"].map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea placeholder="Question text" value={newQ.question_text} onChange={(e) => setNewQ({ ...newQ, question_text: e.target.value })} />
                <Textarea placeholder="Expected behaviour" value={newQ.expected_behaviour} onChange={(e) => setNewQ({ ...newQ, expected_behaviour: e.target.value })} />
                <Input placeholder="Red flags (comma-separated)" value={newQ.red_flags} onChange={(e) => setNewQ({ ...newQ, red_flags: e.target.value })} />
                <Button onClick={addQuestion} className="w-full">Add Question</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Category</th>
                <th className="text-left py-2">Question</th>
                <th className="text-left py-2">Domain</th>
                <th className="text-left py-2">Difficulty</th>
                <th className="text-center py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className={`border-b ${!q.is_active ? "opacity-50" : ""}`}>
                  <td className="py-2"><Badge variant="outline" className="capitalize">{q.category?.replace("_", " ")}</Badge></td>
                  <td className="py-2 max-w-[300px] truncate">{q.question_text}</td>
                  <td className="py-2"><Badge variant="secondary">{q.domain}</Badge></td>
                  <td className="py-2">
                    <Badge variant={q.difficulty === "adversarial" ? "destructive" : "default"}>{q.difficulty}</Badge>
                  </td>
                  <td className="text-center py-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(q)}>
                      {q.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
