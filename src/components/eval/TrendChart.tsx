import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { EvalRun } from "./useEvalData";
import { formatDateShortSA } from "@/lib/dateFormat";

const DIMENSION_COLORS: Record<string, string> = {
  grounding: "#6366f1",
  accuracy: "#10b981",
  scope: "#f59e0b",
  clarity: "#3b82f6",
  sa_context: "#ec4899",
};

export default function TrendChart({ runs, onRunClick }: { runs: EvalRun[]; onRunClick: (id: string) => void }) {
  const chartData = [...runs]
    .filter((r) => r.completed_at)
    .reverse()
    .map((r) => ({
      date: formatDateShortSA(r.started_at),
      runId: r.id,
      overall: r.avg_overall,
      grounding: r.avg_grounding,
      accuracy: r.avg_accuracy,
      scope: r.avg_scope,
      clarity: r.avg_clarity,
      sa_context: r.avg_sa_context,
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Score Trend (Last 30 Days)</CardTitle></CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Run at least 2 evaluations to see the trend chart.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Score Trend (Last 30 Days)</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} onClick={(e) => {
            if (e?.activePayload?.[0]?.payload?.runId) onRunClick(e.activePayload[0].payload.runId);
          }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={3.5} stroke="#ef4444" strokeDasharray="6 3" label={{ value: "Pass: 3.5", position: "right", fontSize: 10 }} />
            {Object.entries(DIMENSION_COLORS).map(([key, color]) => (
              <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ r: 4 }} name={key.replace("_", " ")} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
