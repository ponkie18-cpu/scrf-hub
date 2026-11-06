import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgentRatingProps {
  logId?: string;
  className?: string;
}

export default function AgentRating({ logId, className = "" }: AgentRatingProps) {
  const [rating, setRating] = useState<number | null>(null);
  const { toast } = useToast();

  const handleRate = async (value: 1 | -1) => {
    setRating(value);

    if (!logId) return;

    try {
      await supabase
        .from("agent_accuracy_logs" as any)
        .update({ user_rating: value } as any)
        .eq("id", logId);
    } catch {
      toast({ title: "Could not save rating", variant: "destructive" });
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-xs text-muted-foreground mr-1">Helpful?</span>
      <Button
        variant={rating === 1 ? "default" : "ghost"}
        size="icon"
        className="h-7 w-7"
        onClick={() => handleRate(1)}
        disabled={rating !== null}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={rating === -1 ? "destructive" : "ghost"}
        size="icon"
        className="h-7 w-7"
        onClick={() => handleRate(-1)}
        disabled={rating !== null}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
