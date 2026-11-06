import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Plus, Trash2, ArrowUpDown, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { useAssessmentSave } from "@/hooks/useAssessmentSave";
import { UpgradeGate } from "@/components/tier/UpgradeGate";

interface ProcessImpact {
  id: string;
  name: string;
  maxDowntimeHours: number;
  financialImpact: "low" | "medium" | "high" | "critical";
  reputationalImpact: "low" | "medium" | "high" | "critical";
}

const impactOptions = [
  { value: "low", label: "Low", description: "Minor inconvenience", score: 1 },
  { value: "medium", label: "Medium", description: "Noticeable disruption", score: 2 },
  { value: "high", label: "High", description: "Significant damage", score: 3 },
  { value: "critical", label: "Critical", description: "Existential threat", score: 4 },
];

const BIALite = () => {
  const [processes, setProcesses] = useState<ProcessImpact[]>([]);
  const [newProcess, setNewProcess] = useState<Partial<ProcessImpact>>({});
  const [showResults, setShowResults] = useState(false);
  const { saveAssessment, isSaving, savedToDb, reset: resetSave } = useAssessmentSave();

  // Save to dashboard when results are shown
  useEffect(() => {
    if (showResults && processes.length > 0 && !savedToDb && !isSaving) {
      const avgPriority = processes.reduce((sum, p) => sum + calculatePriority(p), 0) / processes.length;
      const score = Math.max(0, Math.min(100, 100 - (avgPriority * 5)));
      
      const criticalProcesses = sortedProcesses.filter(p => calculatePriority(p) >= 10);
      
      const recommendations = criticalProcesses.slice(0, 3).map(p => ({
        title: `Create continuity plan for ${p.name}`,
        priority: "high" as const,
        description: `Max downtime: ${p.maxDowntimeHours}h, Financial impact: ${p.financialImpact}`,
      }));

      const insights = [
        `${processes.length} business processes analyzed`,
        `${criticalProcesses.length} critical priority processes`,
        `Average priority score: ${avgPriority.toFixed(1)}/12`,
      ];

      saveAssessment({
        domain: "operational",
        toolId: "bia-lite",
        answers: { processes },
        score,
        confidence: processes.length >= 3 ? 1.0 : 0.6,
        insights,
        recommendations,
      });
    }
  }, [showResults, processes, savedToDb, isSaving]);

  const addProcess = () => {
    if (newProcess.name && newProcess.maxDowntimeHours && newProcess.financialImpact && newProcess.reputationalImpact) {
      setProcesses([
        ...processes,
        {
          id: crypto.randomUUID(),
          name: newProcess.name,
          maxDowntimeHours: newProcess.maxDowntimeHours,
          financialImpact: newProcess.financialImpact,
          reputationalImpact: newProcess.reputationalImpact,
        },
      ]);
      setNewProcess({});
    }
  };

  const removeProcess = (id: string) => {
    setProcesses(processes.filter((p) => p.id !== id));
  };

  const calculatePriority = (process: ProcessImpact) => {
    const financialScore = impactOptions.find((o) => o.value === process.financialImpact)?.score || 0;
    const reputationalScore = impactOptions.find((o) => o.value === process.reputationalImpact)?.score || 0;
    const urgencyScore = process.maxDowntimeHours <= 4 ? 4 : process.maxDowntimeHours <= 24 ? 3 : process.maxDowntimeHours <= 72 ? 2 : 1;
    return financialScore + reputationalScore + urgencyScore;
  };

  const sortedProcesses = [...processes].sort((a, b) => calculatePriority(b) - calculatePriority(a));

  const getPriorityLevel = (score: number) => {
    if (score >= 10) return { label: "Critical Priority", color: "bg-destructive text-destructive-foreground" };
    if (score >= 7) return { label: "High Priority", color: "bg-accent text-accent-foreground" };
    if (score >= 4) return { label: "Medium Priority", color: "bg-pillar-2 text-white" };
    return { label: "Lower Priority", color: "bg-muted text-muted-foreground" };
  };

  const getImpactColor = (impact: string) => {
    const colors = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-pillar-2/20 text-pillar-2",
      high: "bg-accent/20 text-accent",
      critical: "bg-destructive/20 text-destructive",
    };
    return colors[impact as keyof typeof colors] || colors.low;
  };

  if (showResults && processes.length > 0) {
    return (
      <UpgradeGate
        toolId="bia-lite"
        toolName="Business Impact Analysis"
        toolDescription="Calculate Maximum Tolerable Downtime for your key processes and prioritize continuity planning."
        features={["Process prioritization", "Impact scoring", "MTD calculation", "Action recommendations"]}
      >
        <Card className="border-2 border-primary/20">
          <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pillar-3/10 rounded-lg">
                <ArrowUpDown className="h-6 w-6 text-pillar-3" />
              </div>
              <div>
                <CardTitle className="font-display text-xl">Business Impact Analysis Results</CardTitle>
                <CardDescription>Processes prioritised by Maximum Tolerable Downtime</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowResults(false)}>
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Focus Your Continuity Planning</p>
              <p className="text-sm text-muted-foreground">
                Start with the highest priority processes. These need documented backup procedures and contingency plans first.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sortedProcesses.map((process, idx) => {
              const score = calculatePriority(process);
              const priority = getPriorityLevel(score);
              return (
                <div key={process.id} className="p-4 bg-card border rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-display font-bold text-muted-foreground">#{idx + 1}</span>
                        <h4 className="font-semibold">{process.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-secondary rounded">
                          Max Downtime: {process.maxDowntimeHours}h
                        </span>
                        <span className={`px-2 py-1 rounded ${getImpactColor(process.financialImpact)}`}>
                          Financial: {process.financialImpact}
                        </span>
                        <span className={`px-2 py-1 rounded ${getImpactColor(process.reputationalImpact)}`}>
                          Reputation: {process.reputationalImpact}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-secondary rounded-lg">
            <p className="font-semibold text-sm mb-2">Recommended Next Steps:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Document SOPs for your top 3 priority processes</li>
              <li>Identify backup resources and cross-train team members</li>
              <li>Create a 1-page incident response guide</li>
              <li>Schedule quarterly BIA review</li>
            </ol>
          </div>
        </CardContent>
        </Card>
      </UpgradeGate>
    );
  }

  return (
    <UpgradeGate
      toolId="bia-lite"
      toolName="Business Impact Analysis"
      toolDescription="Calculate Maximum Tolerable Downtime for your key processes and prioritize continuity planning."
      features={["Process prioritization", "Impact scoring", "MTD calculation", "Action recommendations"]}
    >
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pillar-3/10 rounded-lg">
            <Calculator className="h-6 w-6 text-pillar-3" />
          </div>
          <div>
            <CardTitle className="font-display text-xl">Business Impact Analysis (BIA) Lite</CardTitle>
            <CardDescription>Calculate Maximum Tolerable Downtime for your key processes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-secondary rounded-lg">
          <p className="text-sm text-muted-foreground">
            For each critical process, estimate how long you could tolerate a disruption before experiencing 
            significant financial or reputational damage.
          </p>
        </div>

        {/* Existing processes */}
        {processes.length > 0 && (
          <div className="space-y-2">
            <Label>Added Processes ({processes.length})</Label>
            {processes.map((process) => (
              <div
                key={process.id}
                className="p-3 bg-muted/50 rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{process.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Max {process.maxDowntimeHours}h • Financial: {process.financialImpact} • Reputation: {process.reputationalImpact}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeProcess(process.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new process form */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <p className="font-semibold text-sm">Add a Process</p>
          <div>
            <Label>Process Name</Label>
            <Input
              placeholder="e.g., Order Fulfillment, Customer Support, Payroll"
              value={newProcess.name || ""}
              onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Maximum Tolerable Downtime (hours)</Label>
            <Input
              type="number"
              placeholder="e.g., 4, 24, 72"
              value={newProcess.maxDowntimeHours || ""}
              onChange={(e) => setNewProcess({ ...newProcess, maxDowntimeHours: parseInt(e.target.value) || 0 })}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How long before this causes significant harm?
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Financial Impact if Disrupted</Label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                value={newProcess.financialImpact || ""}
                onChange={(e) => setNewProcess({ ...newProcess, financialImpact: e.target.value as ProcessImpact["financialImpact"] })}
              >
                <option value="">Select...</option>
                {impactOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Reputational Impact if Disrupted</Label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                value={newProcess.reputationalImpact || ""}
                onChange={(e) => setNewProcess({ ...newProcess, reputationalImpact: e.target.value as ProcessImpact["reputationalImpact"] })}
              >
                <option value="">Select...</option>
                {impactOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={addProcess}
            disabled={!newProcess.name || !newProcess.maxDowntimeHours || !newProcess.financialImpact || !newProcess.reputationalImpact}
            variant="secondary"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Process
          </Button>
        </div>

        <Button
          onClick={() => setShowResults(true)}
          disabled={processes.length === 0}
          className="w-full"
        >
          Analyse & Prioritise ({processes.length} processes)
        </Button>
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default BIALite;
