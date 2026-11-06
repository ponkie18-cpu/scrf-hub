import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, Loader2, AlertTriangle, Info, CheckCircle2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  action_url?: string | null;
  read: boolean | null;
  created_at: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const regulatoryAlerts = notifications.filter((n) => n.type === "regulatory_alert");

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAsReviewed = async (notification: Notification) => {
    if (!user) return;
    // Mark as read
    await markAsRead(notification.id);
    // Log to audit trail
    try {
      await supabase.from("audit_trail").insert({
        user_id: user.id,
        action: "reviewed_regulatory_alert",
        entity_type: "notification",
        entity_id: notification.id,
        metadata: { title: notification.title, reviewed_at: new Date().toISOString() },
      });
      toast({ title: "Marked as reviewed", description: "Logged to your compliance audit trail." });
    } catch (e) {
      console.error("Audit trail error:", e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({ title: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getUrgencyIcon = (type: string, title: string) => {
    if (type === "regulatory_alert") {
      if (title.toLowerCase().includes("high") || title.includes("📋")) return <AlertTriangle className="h-4 w-4 text-destructive" />;
      return <Info className="h-4 w-4 text-amber-500" />;
    }
    return <Bell className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs" variant="destructive">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">Notification Centre</h4>
            {regulatoryAlerts.length > 0 && (
              <Badge variant="outline" className="text-xs">{regulatoryAlerts.filter(a => !a.read).length} regulatory</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}>
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No notifications yet</div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">
                      {!notification.read ? (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {getUrgencyIcon(notification.type, notification.title)}
                          <p className="text-sm font-medium leading-tight">{notification.title.replace("📋 ", "")}</p>
                        </div>
                      </div>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{notification.message}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">{formatTime(notification.created_at)}</span>
                        {notification.type === "regulatory_alert" && (
                          <Badge variant="outline" className="text-xs h-5">Regulatory</Badge>
                        )}
                      </div>
                      {/* Actions for regulatory alerts */}
                      {notification.type === "regulatory_alert" && (
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.read && (
                            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => markAsReviewed(notification)}>
                              <Eye className="h-3 w-3 mr-1" /> Mark as Reviewed
                            </Button>
                          )}
                          {notification.action_url && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { window.location.href = notification.action_url!; setIsOpen(false); }}>
                              View Details →
                            </Button>
                          )}
                        </div>
                      )}
                      {/* Local Intelligence Disclaimer */}
                      {notification.type === "regulatory_alert" && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5 italic">
                          ℹ️ Local Intelligence: Enforcement varies by jurisdiction. Consult a local professional for definitive guidance.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
