import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send, 
  UserPlus, 
  Loader2, 
  CheckCircle2, 
  FileText,
  Mail
} from 'lucide-react';
import { z } from 'zod';

const advisorEmailSchema = z.object({
  advisorEmail: z.string().trim().email({ message: "Please enter a valid email address" }).max(255),
  advisorName: z.string().trim().max(100).optional(),
  personalMessage: z.string().trim().max(500).optional(),
});

interface AdvisorShareModalProps {
  /** The type of report being shared */
  reportType: string;
  /** Human-readable name for the report */
  reportName: string;
  /** Summary data to include in the report */
  summaryData: {
    score?: number;
    highlights?: string[];
    recommendations?: string[];
    completedAt?: string;
  };
  /** Optional trigger button - defaults to standard share button */
  trigger?: React.ReactNode;
}

export function AdvisorShareModal({ 
  reportType, 
  reportName, 
  summaryData,
  trigger 
}: AdvisorShareModalProps) {
  const [open, setOpen] = useState(false);
  const [advisorEmail, setAdvisorEmail] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = () => {
    try {
      advisorEmailSchema.parse({ advisorEmail, advisorName, personalMessage });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            fieldErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-advisor-report', {
        body: {
          advisorEmail: advisorEmail.trim(),
          advisorName: advisorName.trim() || undefined,
          personalMessage: personalMessage.trim() || undefined,
          reportType,
          reportName,
          summaryData,
        },
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Report Sent!",
        description: `Your ${reportName} summary has been sent to ${advisorEmail}`,
      });

      // Reset after short delay
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setAdvisorEmail('');
        setAdvisorName('');
        setPersonalMessage('');
      }, 2000);

    } catch (error) {
      console.error('Error sending advisor report:', error);
      toast({
        title: "Failed to Send",
        description: "There was a problem sending the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <UserPlus className="h-4 w-4" />
      Get Advisor Feedback
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Share with Your Advisor
          </DialogTitle>
          <DialogDescription>
            Send a branded summary of your {reportName} results to your accountant, lawyer, or business advisor for professional feedback.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="font-semibold">Report Sent Successfully!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your advisor will receive a professional summary of your results.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Report Preview */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">{reportName} Summary</p>
                  {summaryData.score !== undefined && (
                    <p className="text-muted-foreground">Score: {summaryData.score}%</p>
                  )}
                  {summaryData.highlights && summaryData.highlights.length > 0 && (
                    <p className="text-muted-foreground">
                      {summaryData.highlights.length} key findings included
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Advisor Email */}
            <div className="space-y-2">
              <Label htmlFor="advisorEmail">Advisor's Email *</Label>
              <Input
                id="advisorEmail"
                type="email"
                placeholder="advisor@example.com"
                value={advisorEmail}
                onChange={(e) => setAdvisorEmail(e.target.value)}
                className={errors.advisorEmail ? "border-destructive" : ""}
              />
              {errors.advisorEmail && (
                <p className="text-xs text-destructive">{errors.advisorEmail}</p>
              )}
            </div>

            {/* Advisor Name (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="advisorName">Advisor's Name (Optional)</Label>
              <Input
                id="advisorName"
                type="text"
                placeholder="John Smith"
                value={advisorName}
                onChange={(e) => setAdvisorName(e.target.value)}
              />
            </div>

            {/* Personal Message (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="personalMessage">Personal Note (Optional)</Label>
              <Textarea
                id="personalMessage"
                placeholder="Hi, I'd love your feedback on these results..."
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {personalMessage.length}/500
              </p>
            </div>

            {/* Privacy Note */}
            <p className="text-xs text-muted-foreground">
              💡 Your advisor will receive a professional PDF summary. This helps them understand your situation and provide targeted advice.
            </p>

            {/* Send Button */}
            <Button 
              onClick={handleSend} 
              disabled={isSending || !advisorEmail} 
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Report to Advisor
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
