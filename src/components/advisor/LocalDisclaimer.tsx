import { Info } from 'lucide-react';

interface LocalDisclaimerProps {
  /** Type of advice being disclaimed */
  adviceType?: 'legal' | 'tax' | 'regulatory' | 'general';
}

export function LocalDisclaimer({ adviceType = 'general' }: LocalDisclaimerProps) {
  const getDisclaimerText = () => {
    switch (adviceType) {
      case 'legal':
        return 'Enforcement and interpretation of legal requirements can vary by jurisdiction. This tool provides a framework for understanding; consult a qualified legal professional for definitive advice on your situation.';
      case 'tax':
        return 'Tax rules and enforcement vary significantly by location. This tool provides general guidance; always consult a qualified accountant or tax advisor for advice specific to your circumstances.';
      case 'regulatory':
        return 'Regulatory requirements and enforcement can vary by industry and jurisdiction. This tool provides a framework for understanding; consult a local professional or industry body for definitive guidance.';
      default:
        return 'Enforcement and interpretation can vary. This tool provides a framework for understanding; consult a local professional for definitive advice on your situation.';
    }
  };

  return (
    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-muted-foreground/10 text-sm">
      <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">Local Note: </span>
        {getDisclaimerText()}
      </p>
    </div>
  );
}
