import { useTierAccess } from '@/hooks/useTierAccess';
import { Badge } from '@/components/ui/badge';
import { Crown, BookOpen, User } from 'lucide-react';

interface TierBadgeProps {
  showDetails?: boolean;
  className?: string;
}

export function TierBadge({ showDetails = false, className }: TierBadgeProps) {
  const { tier, features, savesUsed, maxSaves } = useTierAccess();

  if (tier === 'anonymous') {
    return (
      <Badge variant="outline" className={className}>
        <User className="h-3 w-3 mr-1" />
        Guest
      </Badge>
    );
  }

  if (tier === 'pro') {
    const trialDaysLeft = features.trialEndsAt 
      ? Math.ceil((features.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <div className="flex items-center gap-2">
        <Badge className={`bg-primary/10 text-primary border-primary/20 ${className}`}>
          <Crown className="h-3 w-3 mr-1" />
          Pro
        </Badge>
        {showDetails && features.isOnTrial && trialDaysLeft !== null && (
          <span className="text-xs text-muted-foreground">
            {trialDaysLeft} days left in trial
          </span>
        )}
      </div>
    );
  }

  // free_registered
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className={className}>
        <BookOpen className="h-3 w-3 mr-1" />
        Free
      </Badge>
      {showDetails && (
        <span className="text-xs text-muted-foreground">
          {maxSaves - savesUsed}/{maxSaves} saves
        </span>
      )}
    </div>
  );
}
