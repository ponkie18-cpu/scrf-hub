import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { EvalRun, EvalDetail, scoreColor, useEvalDetails } from "./useEvalData";
import { formatDateSA } from "@/lib/dateFormat";

function RunDetailDrawer({ runId }: { runId: string }) {
  const { data: details = [] } = useEvalDetails(runId);

  return (
    <div className="space-y-4 mt-4">
      {details.map((d) => (
        <div key={d.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <Badge variant="outline" className="capitalize mb-1">{d.eval_category.replace("_", " ")}</Badge>
              <p className="text-sm font-medium">{d.question_text}</p>
            </div>
            <span className={`text-lg font-bold ${scoreColor(d.overall_score)}`}>{d.overall_score?.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-center text-xs">
            {[["G", d.grounding_score], ["A", d.accuracy_score], ["S", d.scope_score], ["C", d.clarity_score], ["SA", d.sa_context_score]].map(([l, s]) => (
              <div key={l as string}>
                <span className="text-muted-foreground">{l}</span>
                <span className={`ml-1 font-bold ${scoreColor(s as number)}`}>{(s as number)?.toFixed(0) || "—"}</span>
              </div>
            ))}
          </div>
          {(d.hallucination_detected || d.scope_violation || d.generic_response) && (
            <div className="flex gap-1 flex-wrap">
              {d.hallucination_detected && <Badge variant="destructive" className="text-[10px]">Hallucination</Badge>}
              {d.scope_violation && <Badge variant="destructive" className="text-[10px]">Scope Violation</Badge>}
              {d.generic_response && <Badge variant="outline" className="text-[10px]">Generic</Badge>}
            </div>
          )}
          {d.evaluator_notes && <p className="text-xs text-muted-foreground italic">{d.evaluator_notes}</p>}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">View response ({d.response_latency_ms}ms)</summary>
            <pre className="mt-1 p-2 bg-muted rounded text-[11px] whitespace-pre-wrap max-h-32 overflow-y-auto">{d.agent_response}</pre>
          </details>
        </div>
      ))}
    </div>
  );
}

export default function EvalHistory({ runs }: { runs: EvalRun[] }) {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const paged = runs.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(runs.length / pageSize);

  return (
    <Card>
      <CardHeader><CardTitle>Evaluation History</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Type</th>
                <th className="text-center py-2">Overall</th>
                <th className="text-center py-2">Flags</th>
                <th className="text-center py-2">Status</th>
                <th className="text-center py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((run) => (
                <tr key={run.id} className="border-b hover:bg-muted/50">
                  <td className="py-2">{formatDateSA(run.started_at)}</td>
                  <td className="py-2"><Badge variant="outline">{run.run_type}</Badge></td>
                  <td className={`text-center py-2 font-bold ${scoreColor(run.avg_overall)}`}>
                    {run.avg_overall?.toFixed(1) || "—"}
                  </td>
                  <td className="text-center py-2">
                    {(run.critical_flags || 0) > 0 ? (
                      <Badge variant="destructive">{run.critical_flags}</Badge>
                    ) : "0"}
                  </td>
                  <td className="text-center py-2">
                    {run.passed === null ? (
                      <Badge variant="outline">Running</Badge>
                    ) : run.passed ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">Pass</Badge>
                    ) : (
                      <Badge variant="destructive">Fail</Badge>
                    )}
                  </td>
                  <td className="text-center py-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                      </SheetTrigger>
                      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>
                            Eval Run — {formatDateSA(run.started_at)}
                            <span className={`ml-2 ${scoreColor(run.avg_overall)}`}>{run.avg_overall?.toFixed(1)}/5.0</span>
                          </SheetTitle>
                        </SheetHeader>
                        <RunDetailDrawer runId={run.id} />
                      </SheetContent>
                    </Sheet>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
