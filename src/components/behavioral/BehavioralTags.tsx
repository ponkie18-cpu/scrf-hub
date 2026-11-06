import { Badge } from "@/components/ui/badge";
import { Wallet, Shield, Heart, Brain } from "lucide-react";

interface BehavioralTagsProps {
  domain: string;
  motivationType?: "trust" | "power" | "neutral";
  mentalAccountContext?: string;
  trustElements?: string[];
  powerElements?: string[];
  compact?: boolean;
}

const domainAccountLabels: Record<string, { name: string; icon: typeof Wallet }> = {
  operational: { name: "Operational Safety Fund", icon: Shield },
  financial: { name: "Financial Buffer Account", icon: Wallet },
  compliance: { name: "Compliance Shield", icon: Shield },
  strategic: { name: "Future Vision Reserve", icon: Brain },
};

const BehavioralTags = ({
  domain,
  motivationType = "neutral",
  mentalAccountContext,
  trustElements = [],
  powerElements = [],
  compact = false,
}: BehavioralTagsProps) => {
  const accountInfo = domainAccountLabels[domain] || domainAccountLabels.operational;
  const AccountIcon = accountInfo.icon;

  const motivationConfig = {
    trust: {
      color: "bg-green-100 text-green-700 border-green-200",
      icon: Heart,
      label: "Trust-based",
    },
    power: {
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: Shield,
      label: "Enforcement",
    },
    neutral: {
      color: "bg-gray-100 text-gray-700 border-gray-200",
      icon: Brain,
      label: "Balanced",
    },
  };

  const config = motivationConfig[motivationType];
  const MotivationIcon = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="outline" className={`text-[10px] py-0 ${config.color}`}>
          <MotivationIcon className="h-2.5 w-2.5 mr-0.5" />
          {config.label}
        </Badge>
        <Badge variant="outline" className="text-[10px] py-0 bg-primary/5">
          <AccountIcon className="h-2.5 w-2.5 mr-0.5" />
          {accountInfo.name.split(' ')[0]}
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
      {/* Slippery Slope Tag */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={config.color}>
          <MotivationIcon className="h-3 w-3 mr-1" />
          {config.label} Approach
        </Badge>
        {trustElements.length > 0 && (
          <span className="text-xs text-muted-foreground">
            +{trustElements.length} trust elements
          </span>
        )}
      </div>

      {/* Mental Accounting Tag */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-primary/5 border-primary/20">
          <AccountIcon className="h-3 w-3 mr-1" />
          {mentalAccountContext || `Protects your ${accountInfo.name}`}
        </Badge>
      </div>

      {/* Behavioral Insight */}
      <p className="text-xs text-muted-foreground">
        {motivationType === "trust" 
          ? "Understanding the 'why' creates lasting compliance habits."
          : motivationType === "power"
          ? "Consider adding trust-building elements for sustainability."
          : "Balance enforcement with understanding for best results."
        }
      </p>
    </div>
  );
};

export default BehavioralTags;
