import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus, Play } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface DomainCardProps {
  domain: {
    id: string;
    name: string;
    score: number | null;
    trend?: "up" | "down" | "stable";
    lastUpdated?: string;
    pendingActions: number;
    href: string;
  };
  icon: LucideIcon;
  color: string;
  primaryTool?: {
    id: string;
    name: string;
    estimatedTime: number;
  };
  onRunTool?: (toolId: string) => void;
}

const DomainCard = ({ domain, icon: Icon, color, primaryTool, onRunTool }: DomainCardProps) => {
  const getScoreBadgeClass = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-700 border-green-200";
    if (score >= 50) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const TrendIcon = domain.trend === "up" 
    ? TrendingUp 
    : domain.trend === "down" 
    ? TrendingDown 
    : Minus;

  const trendColor = domain.trend === "up" 
    ? "text-green-500" 
    : domain.trend === "down" 
    ? "text-red-500" 
    : "text-muted-foreground";

  const isLowScore = domain.score !== null && domain.score < 50;

  return (
    <div 
      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
        isLowScore ? "border-amber-300 bg-amber-50/30" : "hover:border-primary/50"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <Link to={domain.href}>
              <p className="font-medium hover:text-primary transition-colors">
                {domain.name}
              </p>
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {domain.lastUpdated && (
                <span>Last: {getRelativeTime(domain.lastUpdated)}</span>
              )}
              {domain.trend && (
                <TrendIcon className={`h-3 w-3 ${trendColor}`} />
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          {domain.score !== null ? (
            <Badge className={getScoreBadgeClass(domain.score)}>
              {domain.score}
            </Badge>
          ) : (
            <Badge variant="outline">Not assessed</Badge>
          )}
        </div>
      </div>

      {domain.score !== null && (
        <Progress value={domain.score} className="h-2 mb-3" />
      )}

      <div className="flex items-center justify-between">
        {domain.pendingActions > 0 ? (
          <Badge variant="secondary" className="text-xs">
            {domain.pendingActions} action{domain.pendingActions > 1 ? "s" : ""} pending
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">No pending actions</span>
        )}

        {primaryTool && onRunTool && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onRunTool(primaryTool.id);
            }}
            className="text-xs"
          >
            <Play className="h-3 w-3 mr-1" />
            {primaryTool.estimatedTime}min
          </Button>
        )}
      </div>
    </div>
  );
};

export default DomainCard;