import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Trash2, Download, GripVertical, CheckCircle, Loader2, GitBranch, Sparkles, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useAssessmentSave } from "@/hooks/useAssessmentSave";
import type { AssessmentRecommendation } from "@/services/assessmentService";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { downloadPDF } from "@/lib/pdfExport";

interface ProcessStep {
  id: string;
  instruction: string;
  notes: string;
  type: "action" | "decision";
  yesNextStepId?: string;
  noNextStepId?: string;
  roleAssignment?: string;
}

const ProcessDocBuilder = () => {
  const [processName, setProcessName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [responsible, setResponsible] = useState("");
  const [backupPerson, setBackupPerson] = useState("");
  const [steps, setSteps] = useState<ProcessStep[]>([
    { id: crypto.randomUUID(), instruction: "", notes: "", type: "action" },
  ]);
  const [troubleshooting, setTroubleshooting] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  
  const { saveAssessment, isSaving } = useAssessmentSave();

  const fetchAICompliance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setAiLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          type: "sop_compliance",
          sopData: { processName, purpose, steps: steps.filter(s => s.instruction).map(s => ({ instruction: s.instruction, type: s.type })) },
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setAiSuggestions(data.suggestions || data.recommendations || []);
      }
    } catch (e) {
      console.error("AI compliance suggestions failed:", e);
    } finally {
      setAiLoading(false);
    }
  };

  const calculateCompleteness = (): number => {
    let score = 0;
    if (processName) score += 15;
    if (purpose) score += 15;
    if (responsible) score += 20;
    if (backupPerson) score += 10;
    const validSteps = steps.filter(s => s.instruction).length;
    score += Math.min(validSteps * 10, 30);
    if (troubleshooting) score += 10;
    return Math.min(score, 100);
  };

  const handleSaveToDashboard = async () => {
    const score = calculateCompleteness();
    const insights: string[] = [];
    const recommendations: AssessmentRecommendation[] = [];

    if (!backupPerson) {
      insights.push("No backup person assigned - single point of failure risk");
      recommendations.push({
        title: `Assign backup person for "${processName}" process`,
        priority: "high",
        description: "Ensure business continuity by assigning a backup person who can cover this process"
      });
    }

    const validSteps = steps.filter(s => s.instruction).length;
    if (validSteps < 3) {
      insights.push("Process documentation is minimal - consider adding more detailed steps");
      recommendations.push({
        title: "Expand process documentation detail",
        priority: "medium",
        description: "Add more granular steps to ensure the process can be followed by anyone"
      });
    }

    if (!troubleshooting) {
      insights.push("No troubleshooting guidance provided");
      recommendations.push({
        title: "Add troubleshooting section to SOP",
        priority: "medium",
        description: "Document common issues and solutions to reduce resolution time"
      });
    }

    if (score >= 80) {
      insights.push("Comprehensive SOP created - schedule regular reviews");
    }

    const result = await saveAssessment({
      domain: "operational",
      toolId: "process-doc-builder",
      answers: { processName, purpose, responsible, backupPerson, steps, troubleshooting },
      score,
      insights,
      recommendations
    });

    if (result.success) setSaved(true);
  };

  const addStep = (type: "action" | "decision" = "action") => {
    setSteps([...steps, { id: crypto.randomUUID(), instruction: "", notes: "", type }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter((s) => s.id !== id));
    }
  };

  const updateStep = (id: string, field: "instruction" | "notes", value: string) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const isComplete = processName && purpose && responsible && steps.some((s) => s.instruction);

  if (showPreview) {
    return (
      <UpgradeGate
        toolId="process-doc-builder"
        toolName="Process Documentation Builder"
        toolDescription="Create Standard Operating Procedures (SOPs) for critical business processes with step-by-step instructions."
        features={["SOP template builder", "Step-by-step guidance", "PDF export", "Dashboard integration"]}
      >
        <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-xl">Standard Operating Procedure</CardTitle>
              <CardDescription className="text-lg font-semibold text-foreground mt-1">
                {processName}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Responsible Person</p>
              <p className="font-semibold">{responsible}</p>
            </div>
            {backupPerson && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Backup Person</p>
                <p className="font-semibold">{backupPerson}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Purpose</p>
            <p>{purpose}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Step-by-Step Instructions</p>
            <div className="space-y-3">
              {steps.filter((s) => s.instruction).map((step, idx) => (
                <div key={step.id} className={`flex gap-3 ${step.type === "decision" ? "border-l-4 border-primary pl-2" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${step.type === "decision" ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground"}`}>
                    {step.type === "decision" ? <GitBranch className="h-4 w-4" /> : idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {step.type === "decision" && <Badge variant="outline" className="text-xs border-primary text-primary">Decision Point</Badge>}
                      {step.roleAssignment && <Badge variant="secondary" className="text-xs"><User className="h-3 w-3 mr-1" />{step.roleAssignment}</Badge>}
                    </div>
                    <p className="font-medium mt-1">{step.instruction}</p>
                    {step.type === "decision" && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="p-2 bg-green-500/5 border border-green-500/20 rounded text-xs"><span className="font-medium text-green-700">Yes →</span> Continue</div>
                        <div className="p-2 bg-destructive/5 border border-destructive/20 rounded text-xs"><span className="font-medium text-destructive">No →</span> Alternate path</div>
                      </div>
                    )}
                    {step.notes && (
                      <p className="text-sm text-muted-foreground mt-1 italic">Note: {step.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {troubleshooting && (
            <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Troubleshooting</p>
              <p className="text-sm">{troubleshooting}</p>
            </div>
          )}

          <div className="p-3 bg-secondary rounded-lg text-sm text-muted-foreground">
            📅 Schedule a review of this SOP in 6 months to keep it current.
          </div>

          <Button
            className="w-full"
            onClick={() => {
              const validSteps = steps.filter(s => s.instruction);
              downloadPDF({
                reportTitle: processName || "Standard Operating Procedure",
                reportType: "SOP Document",
                score: calculateCompleteness(),
                grade: calculateCompleteness() >= 80 ? "Complete" : "In Progress",
                completedAt: new Date().toLocaleDateString(),
                userName: responsible || undefined,
                sections: [
                  {
                    title: "Process Overview",
                    items: [
                      { label: "Process Name", value: processName },
                      { label: "Purpose", value: purpose },
                      { label: "Responsible Person", value: responsible },
                      ...(backupPerson ? [{ label: "Backup Person", value: backupPerson }] : []),
                    ],
                  },
                  {
                    title: "Step-by-Step Instructions",
                    items: validSteps.map((step, idx) => ({
                      label: `Step ${idx + 1}`,
                      value: step.instruction + (step.notes ? ` — Note: ${step.notes}` : ""),
                    })),
                  },
                  ...(troubleshooting ? [{
                    title: "Troubleshooting",
                    items: [{ label: "Common Issues & Solutions", value: troubleshooting }],
                  }] : []),
                ],
              }, `SOP-${processName.replace(/\s+/g, "-")}`);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download SOP as PDF
          </Button>

          {/* Save to Dashboard */}
          {!saved ? (
            <Button 
              onClick={handleSaveToDashboard} 
              disabled={isSaving}
              className="w-full"
              variant="secondary"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" /> Save to Dashboard</>
              )}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 rounded-md py-3">
              <CheckCircle className="h-4 w-4" /> Saved to Dashboard
            </div>
          )}
        </CardContent>
        </Card>
      </UpgradeGate>
    );
  }

  return (
    <UpgradeGate
      toolId="process-doc-builder"
      toolName="Process Documentation Builder"
      toolDescription="Create Standard Operating Procedures (SOPs) for critical business processes with step-by-step instructions."
      features={["SOP template builder", "Step-by-step guidance", "PDF export", "Dashboard integration"]}
    >
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-xl">Process Documentation Builder</CardTitle>
            <CardDescription>Create a Standard Operating Procedure (SOP) for a critical process</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="processName">Process Name *</Label>
            <Input
              id="processName"
              placeholder="e.g., Weekly Inventory Check"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="purpose">Purpose *</Label>
            <Textarea
              id="purpose"
              placeholder="Why does this process exist? What problem does it solve?"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="responsible">Responsible Person *</Label>
              <Input
                id="responsible"
                placeholder="Who owns this process?"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="backup">Backup Person (optional)</Label>
              <Input
                id="backup"
                placeholder="Who can cover?"
                value={backupPerson}
                onChange={(e) => setBackupPerson(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <Label>Step-by-Step Instructions *</Label>
          {steps.map((step, idx) => (
            <div key={step.id} className={`flex gap-2 items-start ${step.type === "decision" ? "border-l-4 border-primary pl-2" : ""}`}>
              <div className="flex items-center gap-1 pt-2 text-muted-foreground">
                <GripVertical className="h-4 w-4" />
                <span className="text-sm font-medium w-6">{idx + 1}.</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {step.type === "decision" ? (
                    <Badge variant="outline" className="text-xs shrink-0 border-primary text-primary">
                      <GitBranch className="h-3 w-3 mr-1" /> Decision
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs shrink-0">Action</Badge>
                  )}
                  <Input
                    placeholder={step.type === "decision" ? "e.g. Is the patient a new registration?" : "What action needs to be taken?"}
                    value={step.instruction}
                    onChange={(e) => updateStep(step.id, "instruction", e.target.value)}
                    className="flex-1"
                  />
                </div>
                {step.type === "decision" && (
                  <div className="grid grid-cols-2 gap-2 pl-2">
                    <div className="p-2 bg-green-500/5 border border-green-500/20 rounded text-xs">
                      <span className="font-medium text-green-700">Yes →</span> Step {steps.findIndex(s => s.id === step.yesNextStepId) + 1 || "next"}
                    </div>
                    <div className="p-2 bg-destructive/5 border border-destructive/20 rounded text-xs">
                      <span className="font-medium text-destructive">No →</span> Step {steps.findIndex(s => s.id === step.noNextStepId) + 1 || "skip"}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Notes or tips (optional)"
                    value={step.notes}
                    onChange={(e) => updateStep(step.id, "notes", e.target.value)}
                    className="text-sm flex-1"
                  />
                  <Input
                    placeholder="Role (optional)"
                    value={step.roleAssignment || ""}
                    onChange={(e) => setSteps(steps.map(s => s.id === step.id ? { ...s, roleAssignment: e.target.value } : s))}
                    className="text-sm w-32"
                  />
                </div>
              </div>
              <Button variant="ghost" size="icon" className="mt-1" onClick={() => removeStep(step.id)} disabled={steps.length === 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addStep("action")}>
              <Plus className="h-4 w-4 mr-1" /> Add Step
            </Button>
            <Button variant="outline" size="sm" onClick={() => addStep("decision")}>
              <GitBranch className="h-4 w-4 mr-1" /> Add Decision Point
            </Button>
          </div>
        </div>

        {/* AI Compliance Suggestions */}
        <div className="space-y-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchAICompliance}
            disabled={aiLoading || !processName || steps.filter(s => s.instruction).length === 0}
          >
            {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Get AI Compliance Suggestions
          </Button>
          {aiSuggestions.length > 0 && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-primary flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Compliance Checkpoints</p>
              {aiSuggestions.map((s, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {typeof s === 'string' ? s : JSON.stringify(s)}</p>
              ))}
            </div>
          )}
        </div>

        {/* Troubleshooting */}
        <div>
          <Label htmlFor="troubleshooting">Troubleshooting (optional)</Label>
          <Textarea
            id="troubleshooting"
            placeholder="What should someone do if something goes wrong?"
            value={troubleshooting}
            onChange={(e) => setTroubleshooting(e.target.value)}
            className="mt-1"
            rows={2}
          />
        </div>

        <Button onClick={() => setShowPreview(true)} disabled={!isComplete} className="w-full">
          Preview SOP Document
        </Button>
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default ProcessDocBuilder;
