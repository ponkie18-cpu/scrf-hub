import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Compass, Plus, Trash2, TrendingUp, Clock, AlertTriangle, CheckCircle, Loader2, Save } from "lucide-react";
import { useAssessmentSave } from "@/hooks/useAssessmentSave";
import type { AssessmentRecommendation } from "@/services/assessmentService";
import { UpgradeGate } from "@/components/tier/UpgradeGate";

interface Trend {
  id: string;
  category: string;
  description: string;
  impact: "low" | "medium" | "high";
  timeframe: "now" | "1year" | "3years";
}

const categories = [
  { value: "political", label: "Political", color: "bg-red-500" },
  { value: "economic", label: "Economic", color: "bg-amber-500" },
  { value: "social", label: "Social", color: "bg-green-500" },
  { value: "technological", label: "Technological", color: "bg-blue-500" },
  { value: "legal", label: "Legal", color: "bg-purple-500" },
  { value: "environmental", label: "Environmental", color: "bg-teal-500" },
];

const prompts = [
  "What new technology is changing your industry?",
  "How are customer expectations evolving?",
  "What regulations might affect you soon?",
  "Who are your emerging competitors?",
  "What economic trends impact your costs?",
  "How is talent availability changing?",
];

const HorizonScanner = () => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [currentTrend, setCurrentTrend] = useState({
    category: "",
    description: "",
    impact: "" as "low" | "medium" | "high" | "",
    timeframe: "" as "now" | "1year" | "3years" | "",
  });
  const [showMap, setShowMap] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const { saveAssessment, isSaving } = useAssessmentSave();

  const calculateStrategicReadiness = (): number => {
    if (trends.length === 0) return 50;
    const hasAllCategories = new Set(trends.map(t => t.category)).size >= 3;
    const hasMultipleTimeframes = new Set(trends.map(t => t.timeframe)).size >= 2;
    const highImpactCovered = trends.filter(t => t.impact === "high").length;
    
    let score = 50;
    score += Math.min(trends.length * 5, 20);
    if (hasAllCategories) score += 15;
    if (hasMultipleTimeframes) score += 10;
    if (highImpactCovered > 0) score += 5;
    return Math.min(score, 100);
  };

  const handleSaveToDashboard = async () => {
    const score = calculateStrategicReadiness();
    const highImpactNow = trends.filter(t => t.impact === "high" && t.timeframe === "now");
    
    const insights: string[] = [
      `Identified ${trends.length} strategic trends across ${new Set(trends.map(t => t.category)).size} categories`,
      highImpactNow.length > 0 
        ? `${highImpactNow.length} high-impact trends require immediate attention`
        : "No immediate high-impact threats identified"
    ];

    const recommendations: AssessmentRecommendation[] = [];
    
    highImpactNow.forEach(trend => {
      recommendations.push({
        title: `Address: ${trend.description.slice(0, 50)}...`,
        priority: "high",
        description: `High-impact ${categories.find(c => c.value === trend.category)?.label} trend requiring immediate action`
      });
    });

    if (trends.filter(t => t.timeframe === "3years").length === 0) {
      recommendations.push({
        title: "Add long-term horizon scanning",
        priority: "medium",
        description: "Consider trends 3+ years out for strategic planning"
      });
    }

    const result = await saveAssessment({
      domain: "strategic",
      toolId: "horizon-scanner",
      answers: { trends },
      score,
      insights,
      recommendations
    });

    if (result.success) setSaved(true);
  };

  const addTrend = () => {
    if (currentTrend.category && currentTrend.description && currentTrend.impact && currentTrend.timeframe) {
      setTrends([
        ...trends,
        {
          id: Date.now().toString(),
          category: currentTrend.category,
          description: currentTrend.description,
          impact: currentTrend.impact as "low" | "medium" | "high",
          timeframe: currentTrend.timeframe as "now" | "1year" | "3years",
        },
      ]);
      setCurrentTrend({ category: "", description: "", impact: "", timeframe: "" });
    }
  };

  const removeTrend = (id: string) => {
    setTrends(trends.filter((t) => t.id !== id));
  };

  const getCategoryColor = (cat: string) => {
    return categories.find((c) => c.value === cat)?.color || "bg-muted";
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-amber-600 bg-amber-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "";
    }
  };

  const getTimeframeLabel = (tf: string) => {
    switch (tf) {
      case "now": return "Immediate";
      case "1year": return "Next Year";
      case "3years": return "3+ Years";
      default: return "";
    }
  };

  const getMonitoringActions = () => {
    const actions: string[] = [];
    const highImpactNow = trends.filter((t) => t.impact === "high" && t.timeframe === "now");
    const techTrends = trends.filter((t) => t.category === "technological");
    const legalTrends = trends.filter((t) => t.category === "legal");

    if (highImpactNow.length > 0) {
      actions.push(`🚨 Prioritize immediate action on ${highImpactNow.length} high-impact trend(s) affecting you now`);
    }
    if (techTrends.length > 0) {
      actions.push("💡 Schedule monthly tech trend reviews to stay ahead of digital disruption");
    }
    if (legalTrends.length > 0) {
      actions.push("⚖️ Set up regulatory alerts for your industry via government portals");
    }
    if (trends.filter((t) => t.timeframe === "3years").length > 0) {
      actions.push("🔭 Include long-term trends in annual strategic planning sessions");
    }
    if (trends.length > 0) {
      actions.push("📊 Review and update this horizon map quarterly");
    }

    return actions;
  };

  return (
    <UpgradeGate toolId="horizon-scanner" toolName="Strategic Horizon Scanner" toolDescription="Identify and map external forces shaping your business future using PESTLE analysis.">
      <Card className="border-primary/20">
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          Strategic Horizon Scanner
        </CardTitle>
        <CardDescription>
          Identify and map external forces shaping your business future using PESTLE analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prompts */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm font-medium mb-2">Consider these questions:</p>
          <div className="grid md:grid-cols-2 gap-2">
            {prompts.map((prompt, i) => (
              <p key={i} className="text-sm text-muted-foreground">• {prompt}</p>
            ))}
          </div>
        </div>

        {/* Add Trend Form */}
        <div className="grid md:grid-cols-2 gap-4 p-4 border rounded-lg">
          <div className="md:col-span-2">
            <Label>Trend/Force Description</Label>
            <Input
              placeholder="e.g., AI tools reducing need for manual data entry"
              value={currentTrend.description}
              onChange={(e) => setCurrentTrend({ ...currentTrend, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Category (PESTLE)</Label>
            <Select
              value={currentTrend.category}
              onValueChange={(v) => setCurrentTrend({ ...currentTrend, category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Potential Impact</Label>
            <Select
              value={currentTrend.impact}
              onValueChange={(v) => setCurrentTrend({ ...currentTrend, impact: v as "low" | "medium" | "high" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select impact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Time Horizon</Label>
            <Select
              value={currentTrend.timeframe}
              onValueChange={(v) => setCurrentTrend({ ...currentTrend, timeframe: v as "now" | "1year" | "3years" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">Happening Now</SelectItem>
                <SelectItem value="1year">Next Year</SelectItem>
                <SelectItem value="3years">3+ Years Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={addTrend} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add to Map
            </Button>
          </div>
        </div>

        {/* Trends List */}
        {trends.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">Identified Trends ({trends.length})</p>
            {trends.map((trend) => (
              <div key={trend.id} className="flex items-center gap-2 p-3 border rounded-lg">
                <div className={`w-3 h-3 rounded-full ${getCategoryColor(trend.category)}`} />
                <span className="flex-1 text-sm">{trend.description}</span>
                <Badge variant="outline" className={getImpactColor(trend.impact)}>
                  {trend.impact}
                </Badge>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {getTimeframeLabel(trend.timeframe)}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => removeTrend(trend.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Generate Map */}
        {trends.length >= 2 && !showMap && (
          <Button onClick={() => setShowMap(true)} className="w-full" variant="default">
            <TrendingUp className="h-4 w-4 mr-2" /> Generate Horizon Map
          </Button>
        )}

        {/* Horizon Map Results */}
        {showMap && trends.length >= 2 && (
          <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-semibold flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              Your Strategic Horizon Map
            </h4>

            {/* Visual Grid */}
            <div className="grid grid-cols-3 gap-2">
              {["now", "1year", "3years"].map((tf) => (
                <div key={tf} className="space-y-2">
                  <p className="text-xs font-medium text-center text-muted-foreground">
                    {getTimeframeLabel(tf)}
                  </p>
                  <div className="min-h-[120px] border rounded-lg p-2 bg-background">
                    {trends
                      .filter((t) => t.timeframe === tf)
                      .map((trend) => (
                        <div
                          key={trend.id}
                          className={`text-xs p-2 rounded mb-1 ${
                            trend.impact === "high"
                              ? "bg-red-100 border-red-300"
                              : trend.impact === "medium"
                              ? "bg-amber-100 border-amber-300"
                              : "bg-green-100 border-green-300"
                          } border`}
                        >
                          <div className={`w-2 h-2 rounded-full ${getCategoryColor(trend.category)} inline-block mr-1`} />
                          {trend.description.slice(0, 40)}...
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Category Legend */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div key={cat.value} className="flex items-center gap-1 text-xs">
                  <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                  {cat.label}
                </div>
              ))}
            </div>

            {/* Monitoring Actions */}
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Recommended Monitoring Actions
              </p>
              <ul className="space-y-1">
                {getMonitoringActions().map((action, i) => (
                  <li key={i} className="text-sm p-2 bg-background rounded">{action}</li>
                ))}
              </ul>
            </div>

            {/* Save to Dashboard */}
            {!saved ? (
              <Button 
                onClick={handleSaveToDashboard} 
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save to Dashboard</>
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 rounded-md py-3">
                <CheckCircle className="h-4 w-4" /> Saved to Dashboard
              </div>
            )}
          </div>
        )}
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default HorizonScanner;
