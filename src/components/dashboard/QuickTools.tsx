import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Target,
  TrendingUp,
  FileText,
  Shield,
  Compass,
  Search,
  Calculator,
  Settings,
  GripVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuickToolsProps {
  selectedTools: string[];
  onUpdate: (tools: string[]) => void;
}

const allTools = [
  { id: "spof", name: "SPOF Finder", href: "/operational-risk", icon: Search, domain: "operational" },
  { id: "bia", name: "BIA Lite", href: "/operational-risk", icon: Target, domain: "operational" },
  { id: "process", name: "Process Docs", href: "/operational-risk", icon: FileText, domain: "operational" },
  { id: "cashflow", name: "Cash Flow Test", href: "/financial-risk", icon: TrendingUp, domain: "financial" },
  { id: "financial-health", name: "Financial Health", href: "/financial-risk", icon: Shield, domain: "financial" },
  { id: "contract", name: "Contract Checker", href: "/compliance-risk", icon: FileText, domain: "compliance" },
  { id: "regulatory", name: "Reg Tracker", href: "/compliance-risk", icon: Search, domain: "compliance" },
  { id: "dataprotection", name: "Data & IP Audit", href: "/compliance-risk", icon: Shield, domain: "compliance" },
  { id: "cyber", name: "Cyber Scorecard", href: "/strategic-cyber-risk", icon: Shield, domain: "strategic" },
  { id: "horizon", name: "Horizon Scanner", href: "/strategic-cyber-risk", icon: Compass, domain: "strategic" },
  { id: "playbook", name: "Incident Playbook", href: "/strategic-cyber-risk", icon: FileText, domain: "strategic" },
];

const domainColors: Record<string, string> = {
  operational: "text-blue-600",
  financial: "text-green-600",
  compliance: "text-purple-600",
  strategic: "text-amber-600",
};

const QuickTools = ({ selectedTools, onUpdate }: QuickToolsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>(selectedTools);

  const displayTools = selectedTools
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean)
    .slice(0, 6);

  const handleToggleTool = (toolId: string) => {
    if (tempSelection.includes(toolId)) {
      setTempSelection(tempSelection.filter((id) => id !== toolId));
    } else if (tempSelection.length < 8) {
      setTempSelection([...tempSelection, toolId]);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          quick_tools: tempSelection,
        });

      if (error) throw error;

      onUpdate(tempSelection);
      setIsEditing(false);
      toast({
        title: "Quick tools updated",
        description: "Your dashboard has been customised.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Quick Tools</CardTitle>
          <CardDescription>Jump directly to assessment tools</CardDescription>
        </div>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Customise Quick Tools</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select up to 8 tools to show on your dashboard (currently {tempSelection.length} selected)
              </p>

              {["operational", "financial", "compliance", "strategic"].map((domain) => (
                <div key={domain} className="space-y-2">
                  <p className={`text-sm font-medium capitalize ${domainColors[domain]}`}>
                    {domain === "strategic" ? "Strategic & Cyber" : domain}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {allTools
                      .filter((t) => t.domain === domain)
                      .map((tool) => (
                        <div
                          key={tool.id}
                          className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${
                            tempSelection.includes(tool.id)
                              ? "border-primary bg-primary/5"
                              : "hover:border-muted-foreground/50"
                          }`}
                          onClick={() => handleToggleTool(tool.id)}
                        >
                          <Checkbox
                            checked={tempSelection.includes(tool.id)}
                            onCheckedChange={() => handleToggleTool(tool.id)}
                          />
                          <tool.icon className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-sm cursor-pointer">{tool.name}</Label>
                        </div>
                      ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {displayTools.map((tool) => {
            if (!tool) return null;
            const Icon = tool.icon;
            return (
              <Link key={tool.id} to={tool.href}>
                <Button
                  variant="outline"
                  className={`w-full h-auto py-4 flex flex-col gap-2 hover:border-primary/50 ${domainColors[tool.domain]}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs text-center">{tool.name}</span>
                </Button>
              </Link>
            );
          })}
          {displayTools.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-4">
              No tools selected. Click the settings icon to customise.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickTools;
