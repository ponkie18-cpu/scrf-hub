import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, UserCheck } from "lucide-react";

const DOMAINS = [
  { value: "fais_financial_conduct", label: "Financial Conduct & FAIS", description: "Review AI agent responses relating to financial health guidance, cash flow analysis, and the boundary between general financial intelligence and regulated financial advice under the FAIS Act and National Credit Act." },
  { value: "popia", label: "POPIA & Data Protection", description: "Review AI agent responses relating to POPIA compliance and data protection obligations." },
  { value: "cipc_companies_act", label: "CIPC / Companies Act", description: "Review AI agent responses relating to company registration, annual returns, and director obligations." },
  { value: "labour_bcea", label: "Labour Law / BCEA", description: "Review AI agent responses relating to employment contracts, leave, and wage compliance." },
  { value: "fais_financial", label: "Financial Advice / FAIS", description: "Review AI agent responses relating to financial services regulation." },
];

export default function ExpertReviewerRegister() {
  const { user, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    qualification: "",
    regulatory_domain: "",
    registration_number: "",
    email: "",
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const handleSubmit = async () => {
    if (!form.full_name || !form.qualification || !form.regulatory_domain || !form.email) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("expert_reviewers").insert({
        user_id: user.id,
        full_name: form.full_name,
        qualification: form.qualification,
        regulatory_domain: form.regulatory_domain,
        registration_number: form.registration_number || null,
        email: form.email,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Registration submitted! An admin will review your application.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <UserCheck className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">Registration Submitted</h2>
            <p className="text-muted-foreground">
              Thank you, {form.full_name}. Your application to review <strong>{DOMAINS.find(d => d.value === form.regulatory_domain)?.label}</strong> content
              has been submitted. An admin will review and approve your registration. You'll receive an email at <strong>{form.email}</strong> when approved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Expert Reviewer Registration</h1>
            <p className="text-sm text-muted-foreground">Register as a qualified SA regulatory expert to review AI agent responses</p>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Qualifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Dr. Nkosi Mabena" />
            </div>
            <div>
              <Label>Professional Qualification *</Label>
              <Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="CA(SA), SAICA member" />
            </div>
            <div>
              <Label>Regulatory Domain *</Label>
              <Select value={form.regulatory_domain} onValueChange={(v) => setForm({ ...form, regulatory_domain: v })}>
                <SelectTrigger><SelectValue placeholder="Select your expertise area" /></SelectTrigger>
                <SelectContent>
                  {DOMAINS.map(d => (
                    <SelectItem key={d.value} value={d.value}>
                      <span>{d.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.regulatory_domain && (
                <p className="text-xs text-muted-foreground mt-1">
                  {DOMAINS.find(d => d.value === form.regulatory_domain)?.description}
                </p>
              )}
            </div>
            <div>
              <Label>Professional Registration Number</Label>
              <Input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} placeholder="e.g. SAICA number, LSSA number" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.co.za" />
            </div>
            <Button onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Registration"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
