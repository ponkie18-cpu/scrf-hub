import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { downloadPDF, type PDFReportData } from '@/lib/pdfExport';
import { useToast } from '@/hooks/use-toast';

interface PDFExportButtonProps {
  reportData: PDFReportData;
  filename?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

export function PDFExportButton({
  reportData,
  filename,
  variant = 'outline',
  size = 'sm',
  className,
  label = 'Export PDF',
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      downloadPDF(reportData, filename);
      toast({ title: 'PDF Downloaded', description: 'Your branded report has been saved.' });
    } catch (err) {
      console.error('PDF export failed:', err);
      toast({ title: 'Export Failed', description: 'Could not generate PDF. Please try again.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleExport} disabled={isExporting}>
      {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  );
}
