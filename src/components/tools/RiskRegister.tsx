import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Download, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UpgradeGate } from "@/components/tier/UpgradeGate";

interface RiskEntry {
  id: string;
  title: string;
  description: string;
  domain: string;
  category: string;
  owner: string;
  status: "open" | "mitigating" | "accepted" | "closed";
  likelihood: number;
  impact: number;
  mitigation: string;
  createdAt: string;
  updatedAt: string;
}

const domains = [
  { value: "operational", label: "Operational" },
  { value: "financial", label: "Financial" },
  { value: "compliance", label: "Compliance" },
  { value: "strategic", label: "Strategic" },
  { value: "cyber", label: "Cyber" },
  { value: "supply_chain", label: "Supply Chain" },
];

const statuses = [
  { value: "open", label: "Open", color: "bg-red-100 text-red-700" },
  { value: "mitigating", label: "Mitigating", color: "bg-amber-100 text-amber-700" },
  { value: "accepted", label: "Accepted", color: "bg-blue-100 text-blue-700" },
  { value: "closed", label: "Closed", color: "bg-green-100 text-green-700" },
];

const RiskRegister = () => {
  const [entries, setEntries] = useState<RiskEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    domain: string;
    category: string;
    owner: string;
    status: "open" | "mitigating" | "accepted" | "closed";
    likelihood: number;
    impact: number;
    mitigation: string;
  }>({
    title: "",
    description: "",
    domain: "operational",
    category: "",
    owner: "",
    status: "open",
    likelihood: 3,
    impact: 3,
    mitigation: "",
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      domain: "operational",
      category: "",
      owner: "",
      status: "open",
      likelihood: 3,
      impact: 3,
      mitigation: "",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const addEntry = () => {
    if (!formData.title.trim()) {
      toast({ title: "Please enter a risk title", variant: "destructive" });
      return;
    }

    const now = new Date().toISOString();
    const newEntry: RiskEntry = {
      id: Date.now().toString(),
      ...formData,
      createdAt: now,
      updatedAt: now,
    };

    setEntries([...entries, newEntry]);
    resetForm();
    toast({ title: "Risk added to register" });
  };

  const updateEntry = () => {
    if (!editingId) return;

    setEntries(
      entries.map((e) =>
        e.id === editingId
          ? { ...e, ...formData, updatedAt: new Date().toISOString() }
          : e
      )
    );
    resetForm();
    toast({ title: "Risk updated" });
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
    toast({ title: "Risk removed" });
  };

  const startEdit = (entry: RiskEntry) => {
    setFormData({
      title: entry.title,
      description: entry.description,
      domain: entry.domain,
      category: entry.category,
      owner: entry.owner,
      status: entry.status as "open" | "mitigating" | "accepted" | "closed",
      likelihood: entry.likelihood,
      impact: entry.impact,
      mitigation: entry.mitigation,
    });
    setEditingId(entry.id);
    setIsAdding(true);
  };

  const getRiskScore = (likelihood: number, impact: number) => likelihood * impact;

  const getRiskLevel = (score: number) => {
    if (score >= 16) return { level: "Critical", color: "bg-red-500 text-white" };
    if (score >= 9) return { level: "High", color: "bg-orange-500 text-white" };
    if (score >= 4) return { level: "Medium", color: "bg-yellow-500" };
    return { level: "Low", color: "bg-green-500 text-white" };
  };

  const exportRegister = () => {
    const headers = [
      "ID", "Title", "Description", "Domain", "Category", "Owner", 
      "Status", "Likelihood", "Impact", "Risk Score", "Risk Level", 
      "Mitigation Plan", "Created", "Updated"
    ];

    const rows = entries.map((e) => [
      e.id,
      `"${e.title}"`,
      `"${e.description}"`,
      e.domain,
      e.category,
      e.owner,
      e.status,
      e.likelihood,
      e.impact,
      getRiskScore(e.likelihood, e.impact),
      getRiskLevel(getRiskScore(e.likelihood, e.impact)).level,
      `"${e.mitigation}"`,
      e.createdAt,
      e.updatedAt,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `risk-register-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Risk register exported!" });
  };

  return (
    <UpgradeGate toolId="risk-register" toolName="Risk Register" toolDescription="Track and manage your business risks with full lifecycle management.">
      <div className="space-y-6">
        {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statuses.map((s) => (
          <Card key={s.value}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <Badge className={s.color}>
                  {entries.filter((e) => e.status === s.value).length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Form */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Risk" : "Add New Risk"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Risk Title *</Label>
                <Input
                  placeholder="e.g., Key supplier concentration"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Risk Owner</Label>
                <Input
                  placeholder="e.g., Operations Manager"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the risk in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Domain</Label>
                <Select value={formData.domain} onValueChange={(v) => setFormData({ ...formData, domain: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {domains.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  placeholder="e.g., Supply Chain"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: typeof formData.status) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Likelihood (1-5)</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={formData.likelihood === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, likelihood: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Impact (1-5)</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={formData.impact === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, impact: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Mitigation Plan</Label>
              <Textarea
                placeholder="What actions are being taken to mitigate this risk?"
                value={formData.mitigation}
                onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={editingId ? updateEntry : addEntry}>
                <Check className="h-4 w-4 mr-2" />
                {editingId ? "Update Risk" : "Add Risk"}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Risk
          </Button>
          {entries.length > 0 && (
            <Button variant="outline" onClick={exportRegister}>
              <Download className="h-4 w-4 mr-2" />
              Export Register
            </Button>
          )}
        </div>
      )}

      {/* Risk Table */}
      {entries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Risk Register</CardTitle>
            <CardDescription>{entries.length} risks tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const score = getRiskScore(entry.likelihood, entry.impact);
                    const { level, color } = getRiskLevel(score);
                    const statusInfo = statuses.find((s) => s.value === entry.status);

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{entry.title}</p>
                            {entry.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {entry.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.domain}</Badge>
                        </TableCell>
                        <TableCell>{entry.owner || "—"}</TableCell>
                        <TableCell>
                          <Badge className={color}>
                            {score} ({level})
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(entry)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No risks in the register yet. Add your first risk to get started.</p>
          </CardContent>
        </Card>
        )}
      </div>
    </UpgradeGate>
  );
};

export default RiskRegister;