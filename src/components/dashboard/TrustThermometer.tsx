import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, Shield } from "lucide-react";

interface TrustThermometerProps {
  trustPercentage: number;
  trustElements?: string[];
  powerElements?: string[];
  domain: string;
  compact?: boolean;
}

const domainAccountLabels: Record<string, string> = {
  operational: "Operational Safety Fund",
  financial: "Financial Buffer Account",
  compliance: "Compliance Shield",
  strategic: "Future Vision Reserve",
};

const TrustThermometer = ({ 
  trustPercentage, 
  trustElements = [], 
  powerElements = [],
  domain,
  compact = false
}: TrustThermometerProps) => {
  const powerPercentage = 100 - trustPercentage;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-2 rounded-full bg-muted overflow-hidden flex">
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${trustPercentage}%` }}
                />
                <div 
                  className="h-full bg-amber-500"
                  style={{ width: `${powerPercentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{trustPercentage}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{trustPercentage}% trust-based approach</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      {/* Trust vs Power Bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-green-600 flex items-center gap-1">
          <Heart className="h-3 w-3" />
          Trust
        </span>
        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500 flex items-center justify-center"
                  style={{ width: `${trustPercentage}%` }}
                >
                  {trustPercentage > 20 && (
                    <span className="text-[10px] text-white font-medium">{trustPercentage}%</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium text-xs mb-1">Trust-Building Elements:</p>
                {trustElements.length > 0 ? (
                  <ul className="text-xs space-y-0.5">
                    {trustElements.map((el, i) => (
                      <li key={i}>• {el}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Understanding the why behind requirements</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 flex items-center justify-center"
                  style={{ width: `${powerPercentage}%` }}
                >
                  {powerPercentage > 20 && (
                    <span className="text-[10px] text-white font-medium">{powerPercentage}%</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium text-xs mb-1">Enforcement Elements:</p>
                {powerElements.length > 0 ? (
                  <ul className="text-xs space-y-0.5">
                    {powerElements.map((el, i) => (
                      <li key={i}>• {el}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Rules, penalties, and compliance requirements</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-xs text-amber-600 flex items-center gap-1">
          Power
          <Shield className="h-3 w-3" />
        </span>
      </div>

      {/* Mental Accounting Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs bg-primary/5">
          📊 Protects your "{domainAccountLabels[domain] || 'Risk Account'}"
        </Badge>
      </div>
    </div>
  );
};

export default TrustThermometer;
