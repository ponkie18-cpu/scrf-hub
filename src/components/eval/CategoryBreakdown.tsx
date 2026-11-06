import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { EvalDetail, scoreColor } from "./useEvalData";

export default function CategoryBreakdown({ evaluations }: { evaluations: EvalDetail[] }) {
  const categories = evaluations.reduce((acc, e) => {
    const cat = e.eval_category;
    if (!acc[cat]) acc[cat] = { scores: [], questions: [] };
    acc[cat].scores.push(e.overall_score || 0);
    acc[cat].questions.push(e);
    return acc;
  }, {} as Record<string, { scores: number[]; questions: EvalDetail[] }>);

  const chartData = Object.entries(categories)
    .map(([cat, data]) => ({
      name: cat.replace("_", " "),
      avg: +(data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(2),
      count: data.scores.length,
    }))
    .sort((a, b) => a.avg - b.avg);

  const lowestCat = chartData[0];

  // Find worst single question this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentEvals = evaluations.filter((e) => e.evaluated_at >= weekAgo);
  const worstQuestion = recentEvals.sort((a, b) => (a.overall_score || 0) - (b.overall_score || 0))[0];

  const barColor = (score: number) =>
    score >= 4.5 ? "#16a34a" : score >= 3.5 ? "#0d9488" : score >= 2.5 ? "#d97706" : "#dc2626";

  return (
    <Card>
      <CardHeader><CardTitle>Score by Category</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {chartData.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No evaluation data available.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={barColor(entry.avg)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {lowestCat && (
              <div className="border rounded-lg p-3 bg-amber-50/50">
                <p className="text-sm font-medium">
                  Most common failure: <Badge variant="outline" className="ml-1 capitalize">{lowestCat.name}</Badge>
                  <span className="text-muted-foreground ml-2">avg {lowestCat.avg}/5.0</span>
                </p>
                {worstQuestion && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Lowest question this week: "{worstQuestion.question_text?.substring(0, 80)}..."
                    — scored {worstQuestion.overall_score?.toFixed(1)}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
