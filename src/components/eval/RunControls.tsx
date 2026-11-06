import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlayCircle, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function RunControls() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("all");

  const triggerEval = useMutation({
    mutationFn: async () => {
      const categories = category === "all" ? ["all"] : category === "adversarial" ? ["scope_compliance"] : [category];
      const { data, error } = await supabase.functions.invoke("run-agent-evaluation", {
        body: { run_type: "manual", categories },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const d = data?.data;
      toast.success(`Evaluation complete: ${d?.passed ? "PASSED" : "FAILED"} — ${d?.avgOverall}/5.0`);
      queryClient.invalidateQueries({ queryKey: ["eval-runs"] });
      queryClient.invalidateQueries({ queryKey: ["eval-details-all"] });
      queryClient.invalidateQueries({ queryKey: ["eval-flags-recent"] });
    },
    onError: (err: Error) => toast.error(`Evaluation failed: ${err.message}`),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Run Controls</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="grounding">Grounding Only</SelectItem>
              <SelectItem value="accuracy">Accuracy Only</SelectItem>
              <SelectItem value="scope_compliance">Scope Compliance Only</SelectItem>
              <SelectItem value="response_quality">Response Quality Only</SelectItem>
              <SelectItem value="sa_context">SA Context Only</SelectItem>
              <SelectItem value="adversarial">Adversarial Only</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => triggerEval.mutate()}
            disabled={triggerEval.isPending}
            size="lg"
          >
            {triggerEval.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...</>
            ) : (
              <><PlayCircle className="h-4 w-4 mr-2" /> Run Evaluation</>
            )}
          </Button>
        </div>

        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium">Schedule Settings</p>
          <div className="grid grid-cols-3 gap-3 text-sm text-muted-foreground">
            <div className="border rounded-lg p-3">
              <p className="font-medium text-foreground">Daily Run</p>
              <p>03:00 SAST (01:00 UTC)</p>
              <p className="text-xs">Full evaluation suite</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-medium text-foreground">Post-Deployment</p>
              <p>Auto-triggered</p>
              <p className="text-xs">After each deployment</p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="font-medium text-foreground">Weekly Deep</p>
              <p>Sundays 02:00 SAST</p>
              <p className="text-xs">Includes adversarial tests</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
