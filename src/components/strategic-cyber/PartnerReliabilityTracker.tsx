import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle, Clock, Star, Trash2, History, Shield, Heart
} from "lucide-react";

interface Partner {
  id: string;
  user_id: string;
  name: string;
  relationship_type: string;
  start_date: string | null;
  contract_value_band: string | null;
  notes: string | null;
  reliability_score: number | null;
  created_at: string;
  updated_at: string;
}

interface Interaction {
  id: string;
  user_id: string;
  partner_id: string;
  interaction_date: string;
  on_time: string;
  commitments_honoured: string;
  communication_score: number;
  incident_notes: string | null;
  created_at: string;
}

const RELATIONSHIP_TYPES = [
  { value: "supplier", label: "Supplier" },
  { value: "client", label: "Client" },
  { value: "contractor", label: "Contractor" },
  { value: "partner", label: "Business Partner" },
  { value: "distributor", label: "Distributor" },
  { value: "investor", label: "Investor" },
];

const CONTRACT_BANDS = [
  { value: "not_specified", label: "Not specified" },
  { value: "under_10k", label: "Under R10,000" },
  { value: "10k_50k", label: "R10,000 – R50,000" },
  { value: "50k_250k", label: "R50,000 – R250,000" },
  { value: "250k_1m", label: "R250,000 – R1M" },
  { value: "over_1m", label: "Over R1M" },
];

function getScoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-destructive";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-destructive";
}

function getTrendIcon(interactions: Interaction[]) {
  if (interactions.length < 3) return <Minus className="h-4 w-4 text-muted-foreground" />;
  const recent = interactions.slice(0, 3);
  const older = interactions.slice(3, 6);
  if (older.length === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
  const recentAvg = recent.reduce((s, i) => s + i.communication_score, 0) / recent.length;
  const olderAvg = older.reduce((s, i) => s + i.communication_score, 0) / older.length;
  if (recentAvg > olderAvg + 0.3) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (recentAvg < olderAvg - 0.3) return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function calculateReliability(interactions: Interaction[]): number {
  if (interactions.length === 0) return 50;
  let total = 0;
  let weightSum = 0;
  interactions.forEach((inter, idx) => {
    const recencyWeight = Math.pow(0.85, idx); // decay
    let score = 0;
    score += inter.on_time === "yes" ? 30 : inter.on_time === "partial" ? 15 : 0;
    score += inter.commitments_honoured === "yes" ? 40 : inter.commitments_honoured === "partial" ? 20 : 0;
    score += (inter.communication_score / 5) * 30;
    if (inter.incident_notes && inter.incident_notes.trim().length > 0) score -= 10;
    total += score * recencyWeight;
    weightSum += recencyWeight;
  });
  return Math.max(0, Math.min(100, Math.round(total / weightSum)));
}

// Trust Thermometer inline
const TrustThermometer = ({ score }: { score: number }) => {
  const trustPct = score;
  return (
    <div className="flex items-center gap-2">
      <Heart className="h-3 w-3 text-green-500" />
      <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden flex">
        <div className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500" style={{ width: `${trustPct}%` }} />
        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500" style={{ width: `${100 - trustPct}%` }} />
      </div>
      <Shield className="h-3 w-3 text-amber-500" />
      <span className="text-xs font-medium">{score}</span>
    </div>
  );
};

const PartnerReliabilityTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [interactions, setInteractions] = useState<Record<string, Interaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showAddInteraction, setShowAddInteraction] = useState(false);

  // Add partner form
  const [newPartner, setNewPartner] = useState({
    name: "", relationship_type: "supplier", start_date: "", contract_value_band: "not_specified", notes: ""
  });

  // Add interaction form
  const [newInteraction, setNewInteraction] = useState({
    interaction_date: new Date().toISOString().split("T")[0],
    on_time: "yes", commitments_honoured: "yes", communication_score: 3, incident_notes: ""
  });

  const fetchPartners = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setPartners(data);
    setLoading(false);
  }, [user]);

  const fetchInteractions = useCallback(async (partnerId: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("partner_interactions")
      .select("*")
      .eq("partner_id", partnerId)
      .eq("user_id", user.id)
      .order("interaction_date", { ascending: false });
    if (!error && data) {
      setInteractions(prev => ({ ...prev, [partnerId]: data }));
    }
  }, [user]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  useEffect(() => {
    partners.forEach(p => fetchInteractions(p.id));
  }, [partners, fetchInteractions]);

  // Recalculate reliability scores based on interactions
  useEffect(() => {
    partners.forEach(async (p) => {
      const ints = interactions[p.id];
      if (!ints) return;
      const newScore = calculateReliability(ints);
      if (newScore !== p.reliability_score) {
        await supabase.from("partners").update({ reliability_score: newScore }).eq("id", p.id);
        setPartners(prev => prev.map(pp => pp.id === p.id ? { ...pp, reliability_score: newScore } : pp));
      }
    });
  }, [interactions]);

  const handleAddPartner = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!newPartner.name.trim()) { toast({ title: "Partner name required", variant: "destructive" }); return; }
    if (partners.length >= 20) { toast({ title: "Maximum 20 partners", description: "Remove a partner before adding a new one.", variant: "destructive" }); return; }

    const { error } = await supabase.from("partners").insert({
      user_id: user.id,
      name: newPartner.name.trim(),
      relationship_type: newPartner.relationship_type,
      start_date: newPartner.start_date || null,
      contract_value_band: newPartner.contract_value_band,
      notes: newPartner.notes || null,
    });

    if (error) { toast({ title: "Error adding partner", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Partner added" });
    setNewPartner({ name: "", relationship_type: "supplier", start_date: "", contract_value_band: "not_specified", notes: "" });
    setShowAddPartner(false);
    fetchPartners();
  };

  const handleDeletePartner = async (id: string) => {
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (!error) {
      toast({ title: "Partner removed" });
      if (selectedPartner?.id === id) setSelectedPartner(null);
      fetchPartners();
    }
  };

  const handleAddInteraction = async () => {
    if (!user || !selectedPartner) return;
    const { error } = await supabase.from("partner_interactions").insert({
      user_id: user.id,
      partner_id: selectedPartner.id,
      interaction_date: newInteraction.interaction_date,
      on_time: newInteraction.on_time,
      commitments_honoured: newInteraction.commitments_honoured,
      communication_score: newInteraction.communication_score,
      incident_notes: newInteraction.incident_notes || null,
    });
    if (error) { toast({ title: "Error logging interaction", variant: "destructive" }); return; }
    toast({ title: "Interaction logged" });
    setNewInteraction({ interaction_date: new Date().toISOString().split("T")[0], on_time: "yes", commitments_honoured: "yes", communication_score: 3, incident_notes: "" });
    setShowAddInteraction(false);
    fetchInteractions(selectedPartner.id);
  };

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Sign in to track partner reliability</h3>
          <p className="text-sm text-muted-foreground">Create an account to start building your partner registry.</p>
        </CardContent>
      </Card>
    );
  }

  // Summary stats
  const topPartners = [...partners].sort((a, b) => (b.reliability_score ?? 0) - (a.reliability_score ?? 0)).slice(0, 3);
  const atRiskPartners = partners.filter(p => (p.reliability_score ?? 0) < 50);

  return (
    <UpgradeGate toolId="partner-reliability-tracker" toolName="Partner Reliability Tracker"
      toolDescription="Track and score partner reliability using repeated-interaction game theory"
      features={["Partner registry (up to 20)", "Interaction logging & scoring", "Trust Thermometer per partner", "AI defection risk insights"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Partner Reliability Tracker
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Model long-term partner behaviour using repeated-interaction game theory
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Powered by Repeated Interactions Framework
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Partners</p>
                  <p className="text-2xl font-bold">{partners.length}<span className="text-sm text-muted-foreground font-normal">/20</span></p>
                </div>
                <Users className="h-8 w-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Top Reliable</p>
                  {topPartners.length > 0 ? (
                    <div className="space-y-0.5 mt-1">
                      {topPartners.map(p => (
                        <p key={p.id} className="text-xs flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          {p.name} — <span className={getScoreColor(p.reliability_score ?? 0)}>{p.reliability_score ?? 0}</span>
                        </p>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No partners yet</p>}
                </div>
                <CheckCircle className="h-8 w-8 text-green-500/40" />
              </div>
            </CardContent>
          </Card>
          <Card className={atRiskPartners.length > 0 ? "border-destructive/30" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">At Risk</p>
                  <p className="text-2xl font-bold">{atRiskPartners.length}</p>
                  {atRiskPartners.length > 0 && (
                    <p className="text-xs text-destructive mt-0.5">Showing defection signals</p>
                  )}
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="registry" className="space-y-4">
          <TabsList>
            <TabsTrigger value="registry">Partner Registry</TabsTrigger>
            <TabsTrigger value="detail" disabled={!selectedPartner}>
              {selectedPartner ? selectedPartner.name : "Select Partner"}
            </TabsTrigger>
          </TabsList>

          {/* REGISTRY TAB */}
          <TabsContent value="registry" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showAddPartner} onOpenChange={setShowAddPartner}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={partners.length >= 20}>
                    <Plus className="h-4 w-4 mr-1" /> Add Partner
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Partner</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Name *</Label>
                      <Input value={newPartner.name} onChange={e => setNewPartner(p => ({ ...p, name: e.target.value }))} placeholder="Partner / supplier name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Relationship Type</Label>
                        <Select value={newPartner.relationship_type} onValueChange={v => setNewPartner(p => ({ ...p, relationship_type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Contract Value Band</Label>
                        <Select value={newPartner.contract_value_band} onValueChange={v => setNewPartner(p => ({ ...p, contract_value_band: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONTRACT_BANDS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input type="date" value={newPartner.start_date} onChange={e => setNewPartner(p => ({ ...p, start_date: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea value={newPartner.notes} onChange={e => setNewPartner(p => ({ ...p, notes: e.target.value }))} placeholder="Key details about this relationship" rows={2} />
                    </div>
                    <Button onClick={handleAddPartner} className="w-full">Add Partner</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading partners...</div>
            ) : partners.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center space-y-3">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Add your first partner</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Track supplier and partner reliability using repeated-interaction game theory.
                      Click "Add Partner" above to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {partners.map(partner => {
                  const ints = interactions[partner.id] || [];
                  const trend = getTrendIcon(ints);
                  return (
                    <Card key={partner.id} className="cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => setSelectedPartner(partner)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{partner.name}</h4>
                              <Badge variant="secondary" className="text-xs capitalize">{partner.relationship_type}</Badge>
                              {(partner.reliability_score ?? 0) < 50 && (
                                <Badge variant="destructive" className="text-xs">At Risk</Badge>
                              )}
                            </div>
                            <TrustThermometer score={partner.reliability_score ?? 0} />
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><History className="h-3 w-3" />{ints.length} interactions</span>
                              <span className="flex items-center gap-1">{trend} Trend</span>
                              {partner.start_date && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Since {partner.start_date}</span>}
                            </div>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={e => { e.stopPropagation(); handleDeletePartner(partner.id); }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove partner</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* DETAIL TAB */}
          <TabsContent value="detail" className="space-y-4">
            {selectedPartner && (() => {
              const ints = interactions[selectedPartner.id] || [];
              const score = selectedPartner.reliability_score ?? 0;
              return (
                <div className="space-y-4">
                  {/* Partner header */}
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{selectedPartner.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{selectedPartner.relationship_type}</p>
                          {selectedPartner.notes && <p className="text-xs text-muted-foreground mt-1">{selectedPartner.notes}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Reliability Score</p>
                          <p className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <TrustThermometer score={score} />
                      </div>
                      {score < 50 && (
                        <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <p className="text-sm font-medium text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" /> Defection Risk Detected
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Consider contractual safeguards: milestone-based payments, performance bonuses, or relationship review meetings.
                          </p>
                        </div>
                      )}
                      {score >= 75 && (
                        <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <p className="text-sm font-medium text-green-700 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" /> High Reliability Partner
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            This partner shows consistent cooperation signals. Consider deepening the engagement.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Log interaction */}
                  <div className="flex justify-end">
                    <Dialog open={showAddInteraction} onOpenChange={setShowAddInteraction}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Log Interaction</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Log Interaction with {selectedPartner.name}</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Date</Label>
                            <Input type="date" value={newInteraction.interaction_date} onChange={e => setNewInteraction(p => ({ ...p, interaction_date: e.target.value }))} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Delivery on time?</Label>
                              <Select value={newInteraction.on_time} onValueChange={v => setNewInteraction(p => ({ ...p, on_time: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="partial">Partial</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Commitments honoured?</Label>
                              <Select value={newInteraction.commitments_honoured} onValueChange={v => setNewInteraction(p => ({ ...p, commitments_honoured: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yes">Yes</SelectItem>
                                  <SelectItem value="partial">Partial</SelectItem>
                                  <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label>Communication quality: {newInteraction.communication_score}/5</Label>
                            <Slider min={1} max={5} step={1} value={[newInteraction.communication_score]}
                              onValueChange={([v]) => setNewInteraction(p => ({ ...p, communication_score: v }))} className="mt-2" />
                          </div>
                          <div>
                            <Label>Incident notes (optional)</Label>
                            <Textarea value={newInteraction.incident_notes} onChange={e => setNewInteraction(p => ({ ...p, incident_notes: e.target.value }))}
                              placeholder="Any adverse incidents or concerns" rows={2} />
                          </div>
                          <Button onClick={handleAddInteraction} className="w-full">Log Interaction</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Interaction history */}
                  {ints.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="p-6 text-center text-sm text-muted-foreground">
                        No interactions logged yet. Click "Log Interaction" to start tracking.
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Interaction History</CardTitle>
                        <CardDescription className="text-xs">{ints.length} recorded interactions</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Date</TableHead>
                              <TableHead className="text-xs">On Time</TableHead>
                              <TableHead className="text-xs">Commitments</TableHead>
                              <TableHead className="text-xs">Comms</TableHead>
                              <TableHead className="text-xs">Incidents</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ints.map(inter => (
                              <TableRow key={inter.id}>
                                <TableCell className="text-xs">{inter.interaction_date}</TableCell>
                                <TableCell>
                                  <Badge variant={inter.on_time === "yes" ? "default" : inter.on_time === "partial" ? "secondary" : "destructive"} className="text-xs capitalize">
                                    {inter.on_time}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={inter.commitments_honoured === "yes" ? "default" : inter.commitments_honoured === "partial" ? "secondary" : "destructive"} className="text-xs capitalize">
                                    {inter.commitments_honoured}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs">{inter.communication_score}/5</TableCell>
                                <TableCell className="text-xs max-w-[150px] truncate">{inter.incident_notes || "—"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {/* Cooperation incentive suggestions for at-risk */}
                  {score < 50 && (
                    <Card className="border-amber-500/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4 text-amber-500" />
                          Recommended Cooperation Incentives
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {[
                          { title: "Milestone-based payments", desc: "Structure payments around delivery milestones to align incentives" },
                          { title: "Performance bonuses", desc: "Offer bonuses for consistent on-time delivery over 3+ months" },
                          { title: "Relationship review meeting", desc: "Schedule a candid review meeting to address concerns and reset expectations" },
                          { title: "Penalty clauses", desc: "Consider adding SLA penalties for repeated failures" },
                        ].map((item, i) => (
                          <div key={i} className="p-2 rounded bg-muted/50">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center italic">
          ⚖️ This tracker provides indicative partner reliability scores based on your logged interactions.
          It does not constitute professional advice. Always exercise due diligence in business relationships.
        </p>
      </div>
    </UpgradeGate>
  );
};

export default PartnerReliabilityTracker;
