import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Clock, CheckCircle, Plus, Loader2, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateSA } from "@/lib/dateFormat";

interface ActionItem {
  id: string;
  domain: string;
  title: string;
  description?: string;
  priority: string;
  due_date: string | null;
  completed: boolean;
}

interface ActionCenterProps {
  actions: ActionItem[];
  onActionComplete: (id: string) => void;
  onRefresh: () => void;
}

const domainColors: Record<string, string> = {
  operational: "bg-blue-100 text-blue-700",
  financial: "bg-green-100 text-green-700",
  compliance: "bg-purple-100 text-purple-700",
  strategic: "bg-amber-100 text-amber-700",
};

const ActionCenter = ({ actions, onActionComplete, onRefresh }: ActionCenterProps) => {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();

  const pendingActions = actions.filter((a) => !a.completed);
  const completedActions = actions.filter((a) => a.completed);

  const highPriority = pendingActions.filter((a) => a.priority === "high");
  const mediumPriority = pendingActions.filter((a) => a.priority === "medium");
  const lowPriority = pendingActions.filter((a) => a.priority === "low");

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    try {
      const { error } = await supabase
        .from("action_items")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      onActionComplete(id);
      toast({
        title: "Action completed!",
        description: "Great work on reducing your risk.",
      });
    } catch (error) {
      console.error("Error completing action:", error);
      toast({
        title: "Error",
        description: "Failed to complete action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompletingId(null);
    }
  };

  const formatDueDate = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", className: "text-red-600" };
    if (diffDays === 0) return { text: "Due today", className: "text-amber-600" };
    if (diffDays === 1) return { text: "Due tomorrow", className: "text-amber-600" };
    if (diffDays < 7) return { text: `Due in ${diffDays} days`, className: "text-muted-foreground" };
    return { text: formatDateSA(d), className: "text-muted-foreground" };
  };

  const renderActionItem = (action: ActionItem) => {
    const dueInfo = formatDueDate(action.due_date);
    const isCompleting = completingId === action.id;

    return (
      <div
        key={action.id}
        className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
          action.completed ? "bg-muted/30 opacity-60" : "hover:bg-muted/50"
        }`}
      >
        <div className="pt-0.5">
          {isCompleting ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Checkbox
              checked={action.completed}
              onCheckedChange={() => !action.completed && handleComplete(action.id)}
              disabled={action.completed}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${action.completed ? "line-through" : ""}`}>
            {action.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className={domainColors[action.domain]}>
              {action.domain}
            </Badge>
            {dueInfo && (
              <span className={`text-xs ${dueInfo.className}`}>{dueInfo.text}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Priority Action Center
        </CardTitle>
        <CardDescription>Tasks requiring your attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingActions.length === 0 && completedActions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground space-y-3">
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground text-sm">No action items yet</p>
              <p className="text-xs mt-1">Complete your first tool to generate actionable tasks.</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/operational-risk">Complete your first tool →</Link>
            </Button>
          </div>
        ) : (
          <>
            {highPriority.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <p className="text-xs font-medium uppercase text-red-600">
                    High Priority ({highPriority.length})
                  </p>
                </div>
                {highPriority.map(renderActionItem)}
              </div>
            )}

            {mediumPriority.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <p className="text-xs font-medium uppercase text-amber-600">
                    Medium Priority ({mediumPriority.length})
                  </p>
                </div>
                {mediumPriority.map(renderActionItem)}
              </div>
            )}

            {lowPriority.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Upcoming ({lowPriority.length})
                  </p>
                </div>
                {lowPriority.map(renderActionItem)}
              </div>
            )}

            {completedActions.length > 0 && (
              <div className="pt-2 border-t">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showCompleted ? "Hide" : "Show"} completed ({completedActions.length})
                </button>
                {showCompleted && (
                  <div className="space-y-2 mt-2">
                    {completedActions.map(renderActionItem)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionCenter;
