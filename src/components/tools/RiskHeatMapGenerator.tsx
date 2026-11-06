import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Download, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UpgradeGate } from "@/components/tier/UpgradeGate";

interface Risk {
  id: string;
  name: string;
  domain: string;
  likelihood: number;
  impact: number;
}

const domains = [
  { value: "operational", label: "Operational", color: "bg-blue-500" },
  { value: "financial", label: "Financial", color: "bg-green-500" },
  { value: "compliance", label: "Compliance", color: "bg-purple-500" },
  { value: "strategic", label: "Strategic", color: "bg-amber-500" },
];

const RiskHeatMapGenerator = () => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [newRisk, setNewRisk] = useState({ name: "", domain: "operational", likelihood: 3, impact: 3 });
  const { toast } = useToast();

  const addRisk = () => {
    if (!newRisk.name.trim()) {
      toast({ title: "Please enter a risk name", variant: "destructive" });
      return;
    }
    
    setRisks([
      ...risks,
      {
        id: Date.now().toString(),
        name: newRisk.name,
        domain: newRisk.domain,
        likelihood: newRisk.likelihood,
        impact: newRisk.impact,
      },
    ]);
    setNewRisk({ ...newRisk, name: "" });
    toast({ title: "Risk added to heat map" });
  };

  const removeRisk = (id: string) => {
    setRisks(risks.filter((r) => r.id !== id));
  };

  const getRiskLevel = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    if (score >= 16) return { level: "Critical", color: "bg-red-500" };
    if (score >= 9) return { level: "High", color: "bg-orange-500" };
    if (score >= 4) return { level: "Medium", color: "bg-yellow-500" };
    return { level: "Low", color: "bg-green-500" };
  };

  const getDomainColor = (domain: string) => {
    return domains.find((d) => d.value === domain)?.color || "bg-gray-500";
  };

  const exportHeatMap = () => {
    const data = risks.map((r) => ({
      ...r,
      riskScore: r.likelihood * r.impact,
      riskLevel: getRiskLevel(r.likelihood, r.impact).level,
    }));
    
    const csv = [
      "Risk Name,Domain,Likelihood,Impact,Risk Score,Risk Level",
      ...data.map((r) => `"${r.name}",${r.domain},${r.likelihood},${r.impact},${r.riskScore},${r.riskLevel}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `risk-heat-map-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Heat map exported!" });
  };

  // Create 5x5 grid positions
  const getGridPosition = (likelihood: number, impact: number) => {
    // likelihood is Y axis (bottom to top), impact is X axis (left to right)
    const col = impact; // 1-5
    const row = 6 - likelihood; // Invert so high likelihood is at top
    return { col, row };
  };

  return (
    <UpgradeGate toolId="risk-heatmap" toolName="Risk Heat Map Generator" toolDescription="Visualize your risks on a heat map by likelihood and impact.">
      <div className="space-y-6">
        {/* Add Risk Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a Risk</CardTitle>
          <CardDescription>Plot your risks on the heat map by likelihood and impact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="riskName">Risk Description</Label>
              <Input
                id="riskName"
                placeholder="e.g., Key supplier bankruptcy"
                value={newRisk.name}
                onChange={(e) => setNewRisk({ ...newRisk, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="domain">Domain</Label>
              <Select value={newRisk.domain} onValueChange={(v) => setNewRisk({ ...newRisk, domain: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Likelihood (1-5)</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={newRisk.likelihood === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewRisk({ ...newRisk, likelihood: n })}
                  >
                    {n}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">1 = Rare, 5 = Almost Certain</p>
            </div>
            <div>
              <Label>Impact (1-5)</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={newRisk.impact === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewRisk({ ...newRisk, impact: n })}
                  >
                    {n}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">1 = Negligible, 5 = Catastrophic</p>
            </div>
          </div>
          <Button onClick={addRisk} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add to Heat Map
          </Button>
        </CardContent>
      </Card>

      {/* Heat Map Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Risk Heat Map</CardTitle>
            <CardDescription>{risks.length} risks plotted</CardDescription>
          </div>
          {risks.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportHeatMap}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* Y-axis label */}
            <div className="flex flex-col justify-center">
              <span className="text-xs text-muted-foreground -rotate-90 whitespace-nowrap">
                LIKELIHOOD →
              </span>
            </div>
            
            <div className="flex-1">
              {/* Grid */}
              <div className="grid grid-cols-5 gap-1 mb-2">
                {[5, 4, 3, 2, 1].map((likelihood) =>
                  [1, 2, 3, 4, 5].map((impact) => {
                    const cellRisks = risks.filter(
                      (r) => r.likelihood === likelihood && r.impact === impact
                    );
                    const { color } = getRiskLevel(likelihood, impact);
                    
                    return (
                      <div
                        key={`${likelihood}-${impact}`}
                        className={`${color} bg-opacity-30 border rounded-md p-2 min-h-[60px] relative`}
                      >
                        {cellRisks.map((risk) => (
                          <div
                            key={risk.id}
                            className={`${getDomainColor(risk.domain)} text-white text-xs p-1 rounded mb-1 flex items-center justify-between group`}
                          >
                            <span className="truncate flex-1" title={risk.name}>
                              {risk.name.length > 12 ? risk.name.slice(0, 12) + "..." : risk.name}
                            </span>
                            <button
                              onClick={() => removeRisk(risk.id)}
                              className="opacity-0 group-hover:opacity-100 ml-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* X-axis label */}
              <div className="text-center">
                <span className="text-xs text-muted-foreground">IMPACT →</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Risk Level:</span>
              <Badge className="bg-green-500">Low</Badge>
              <Badge className="bg-yellow-500">Medium</Badge>
              <Badge className="bg-orange-500">High</Badge>
              <Badge className="bg-red-500">Critical</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Domain:</span>
              {domains.map((d) => (
                <Badge key={d.value} className={d.color}>{d.label}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk List */}
      {risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Register</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {risks.map((risk) => {
                const { level, color } = getRiskLevel(risk.likelihood, risk.impact);
                return (
                  <div key={risk.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-4 w-4 ${color.replace("bg-", "text-")}`} />
                      <div>
                        <p className="font-medium text-sm">{risk.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            L:{risk.likelihood} × I:{risk.impact} = {risk.likelihood * risk.impact}
                          </Badge>
                          <Badge className={getDomainColor(risk.domain) + " text-xs"}>
                            {domains.find((d) => d.value === risk.domain)?.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={color}>{level}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeRisk(risk.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </UpgradeGate>
  );
};

export default RiskHeatMapGenerator;