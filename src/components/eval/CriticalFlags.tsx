import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { EvalDetail } from "./useEvalData";
import { formatDateSA } from "@/lib/dateFormat";

export default function CriticalFlags({ flags }: { flags: EvalDetail[] }) {
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const unresolvedCount = flags.filter((f) => !resolved.has(f.id)).length;

  return (
    <Card className={unresolvedCount > 0 ? "border-destructive" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Critical Flags (Last 24h)
          </CardTitle>
          {unresolvedCount > 0 ? (
            <Badge variant="destructive">{unresolvedCount} unresolved — deployment blocked</Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-100 text-green-700">All clear</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {flags.length === 0 ? (
          <div className="flex items-center gap-2 text-green-700 py-4 justify-center">
            <CheckCircle className="h-5 w-5" />
            <p>No critical flags in the last 24 hours.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Question</th>
                  <th className="text-left py-2">Flag</th>
                  <th className="text-left py-2">Response Snippet</th>
                  <th className="text-left py-2">Time</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((f) => (
                  <tr key={f.id} className="border-b">
                    <td className="py-2 max-w-[200px] truncate">{f.question_text}</td>
                    <td className="py-2">
                      {f.hallucination_detected && <Badge variant="destructive" className="mr-1">Hallucination</Badge>}
                      {f.scope_violation && <Badge variant="destructive">Scope Violation</Badge>}
                    </td>
                    <td className="py-2 max-w-[250px] truncate text-muted-foreground text-xs">
                      {f.agent_response?.substring(0, 100)}...
                    </td>
                    <td className="py-2 text-xs">{formatDateSA(f.evaluated_at)}</td>
                    <td className="text-center py-2">
                      {resolved.has(f.id) ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" /> Resolved
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => setResolved((prev) => new Set([...prev, f.id]))}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
