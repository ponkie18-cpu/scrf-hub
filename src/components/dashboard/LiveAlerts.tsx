import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Clock, ExternalLink, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateShortSA } from "@/lib/dateFormat";

interface Alert {
  id: string;
  type: string;
  title: string;
  message?: string;
  priority: string;
  domain?: string;
  created_at: string;
}

interface LiveAlertsProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
}

const LiveAlerts = ({ alerts, onDismiss, onSnooze }: LiveAlertsProps) => {
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const { toast } = useToast();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "medium":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const handleDismiss = async (id: string) => {
    setDismissingId(id);
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ dismissed: true })
        .eq("id", id);

      if (error) throw error;
      onDismiss(id);
    } catch (error) {
      console.error("Error dismissing alert:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive",
      });
    } finally {
      setDismissingId(null);
    }
  };

  const handleSnooze = async (id: string) => {
    try {
      const snoozedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("alerts")
        .update({ snoozed_until: snoozedUntil })
        .eq("id", id);

      if (error) throw error;
      onSnooze(id);
      toast({
        title: "Alert snoozed",
        description: "Reminder set for 1 week from now",
      });
    } catch (error) {
      console.error("Error snoozing alert:", error);
      toast({
        title: "Error",
        description: "Failed to snooze alert",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => formatDateShortSA(dateString);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Live Alerts</CardTitle>
            <Badge variant="secondary">{alerts.length}</Badge>
          </div>
        </div>
        <CardDescription>Regulatory updates and system notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
          >
            <div className="pt-0.5">{getPriorityIcon(alert.priority)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{alert.title}</p>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${getPriorityBadgeClass(alert.priority)}`}
                >
                  {alert.priority}
                </Badge>
              </div>
              {alert.message && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {alert.message}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground">
                  {formatDate(alert.created_at)}
                </span>
                {alert.domain && (
                  <Badge variant="outline" className="text-xs">
                    {alert.domain}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleSnooze(alert.id)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Snooze
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => handleDismiss(alert.id)}
                  disabled={dismissingId === alert.id}
                >
                  <X className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LiveAlerts;