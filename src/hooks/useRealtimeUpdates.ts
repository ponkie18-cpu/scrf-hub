import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RealtimeCallbacks {
  onScoreUpdate?: (domain: string, score: number) => void;
  onActionUpdate?: (action: unknown) => void;
  onNotification?: (notification: unknown) => void;
}

export const useRealtimeUpdates = (callbacks: RealtimeCallbacks = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  const setupRealtimeListeners = useCallback(() => {
    if (!user) return;

    // Cleanup existing channels
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Listen for score history updates (new scores)
    const scoreChannel = supabase
      .channel("score-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "score_history",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Score update received:", payload);
          const { domain, score } = payload.new as { domain: string; score: number };
          
          if (callbacks.onScoreUpdate) {
            callbacks.onScoreUpdate(domain, score);
          }

          if (domain !== "overall") {
            toast({
              title: "Score Updated",
              description: `Your ${domain} score is now ${score}`,
            });
          }
        }
      )
      .subscribe();

    channelsRef.current.push(scoreChannel);

    // Listen for action item changes
    const actionChannel = supabase
      .channel("action-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "action_items",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Action update received:", payload);
          
          if (callbacks.onActionUpdate) {
            callbacks.onActionUpdate(payload.new || payload.old);
          }

          if (payload.eventType === "INSERT") {
            const action = payload.new as { title: string };
            toast({
              title: "New Action Item",
              description: action.title,
            });
          }
        }
      )
      .subscribe();

    channelsRef.current.push(actionChannel);

    // Listen for notifications
    const notificationChannel = supabase
      .channel("notification-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Notification received:", payload);
          
          if (callbacks.onNotification) {
            callbacks.onNotification(payload.new);
          }

          const notification = payload.new as { title: string; message?: string };
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .subscribe();

    channelsRef.current.push(notificationChannel);
  }, [user, callbacks, toast]);

  useEffect(() => {
    setupRealtimeListeners();

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [setupRealtimeListeners]);

  const refreshSubscriptions = useCallback(() => {
    setupRealtimeListeners();
  }, [setupRealtimeListeners]);

  return { refreshSubscriptions };
};