import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle, Clock, CheckCircle2, Loader2,
  ArrowRight, LayoutGrid,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActionItem {
  id: string;
  domain: string;
  title: string;
  description?: string;
  priority: string;
  due_date: string | null;
  completed: boolean;
}

interface KanbanActionsProps {
  actions: ActionItem[];
  onActionComplete: () => void;
  onRefresh: () => void;
}

const domainColors: Record<string, string> = {
  operational: "bg-blue-500",
  financial: "bg-green-500",
  compliance: "bg-purple-500",
  strategic: "bg-amber-500",
};

export default function KanbanActions({ actions, onActionComplete, onRefresh }: KanbanActionsProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const overdue = actions.filter(a => !a.completed && a.due_date && new Date(a.due_date) < new Date());
  const inProgress = actions.filter(a => !a.completed && (!a.due_date || new Date(a.due_date) >= new Date()));
  const completed = actions.filter(a => a.completed).slice(0, 5);

  const handleComplete = useCallback(async (id: string) => {
    setCompletingId(id);
    try {
      await supabase.from("action_items").update({ completed: true, completed_at: new Date().toISOString() }).eq("id", id);
      onActionComplete();
      toast({ title: "Action completed!", description: "Great work on reducing your risk." });
    } catch {
      toast({ title: "Error", description: "Failed to complete action.", variant: "destructive" });
    } finally {
      setCompletingId(null);
    }
  }, [onActionComplete, toast]);

  const formatDue = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((d.getTime() - now.getTime()) / 86400000);
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, cls: "text-red-600" };
    if (diff === 0) return { text: "Today", cls: "text-amber-600" };
    if (diff <= 3) return { text: `${diff}d`, cls: "text-amber-600" };
    return { text: `${diff}d`, cls: "text-muted-foreground" };
  };

  const renderItem = (action: ActionItem) => {
    const due = formatDue(action.due_date);
    return (
      <div key={action.id} className="p-3 bg-background rounded-lg border hover:shadow-sm transition-shadow">
        <div className="flex items-start gap-2">
          {completingId === action.id ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5" />
          ) : (
            <Checkbox
              checked={action.completed}
              onCheckedChange={() => !action.completed && handleComplete(action.id)}
              disabled={action.completed}
              className="mt-0.5"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium leading-tight ${action.completed ? "line-through opacity-60" : ""}`}>
              {action.title}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${domainColors[action.domain] || "bg-muted"}`} />
              <span className="text-[10px] text-muted-foreground capitalize">{action.domain}</span>
              {due && <span className={`text-[10px] ${due.cls}`}>{due.text}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Column = ({ title, icon: Icon, items, count, accent }: {
    title: string; icon: typeof AlertTriangle; items: ActionItem[]; count: number; accent: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={`h-3.5 w-3.5 ${accent}`} />
          <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
        </div>
        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{count}</Badge>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2 pr-2">
          {items.length > 0 ? items.map(renderItem) : (
            <p className="text-[10px] text-muted-foreground text-center py-6">None</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <LayoutGrid className="h-4 w-4 text-primary" />
          Action Kanban
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <Column title="Overdue" icon={AlertTriangle} items={overdue} count={overdue.length} accent="text-red-500" />
          <Column title="In Progress" icon={Clock} items={inProgress.slice(0, 10)} count={inProgress.length} accent="text-amber-500" />
          <Column title="Done" icon={CheckCircle2} items={completed} count={actions.filter(a => a.completed).length} accent="text-green-500" />
        </div>
      </CardContent>
    </Card>
  );
}
