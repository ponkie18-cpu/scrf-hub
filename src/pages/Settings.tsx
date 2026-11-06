import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTierAccess } from "@/hooks/useTierAccess";
import { BillingPortal } from "@/components/billing/BillingPortal";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TierBadge } from "@/components/tier/TierBadge";
import {
  Shield, ArrowLeft, Loader2, Save, Building, User,
  Info, Crown, Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const industries = [
  { code: "retail", label: "Retail & E-commerce" },
  { code: "professional_services", label: "Professional Services" },
  { code: "technology", label: "Technology & Software" },
  { code: "manufacturing", label: "Manufacturing" },
  { code: "construction", label: "Construction & Engineering" },
  { code: "healthcare", label: "Healthcare & Wellness" },
  { code: "hospitality", label: "Hospitality & Tourism" },
  { code: "agriculture", label: "Agriculture & Farming" },
  { code: "transport", label: "Transport & Logistics" },
  { code: "education", label: "Education & Training" },
  { code: "financial_services", label: "Financial Services" },
  { code: "media", label: "Media & Creative" },
  { code: "mining", label: "Mining & Resources" },
  { code: "food_beverage", label: "Food & Beverage" },
  { code: "ngo", label: "Non-Profit / NGO" },
  { code: "general", label: "Other" },
];

const sizeOptions = [
  { value: "1-5", label: "1-5 employees" },
  { value: "6-20", label: "6-20 employees" },
  { value: "21-50", label: "21-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "200+", label: "200+ employees" },
];

const revenueOptions = [
  { value: "pre_revenue", label: "Pre-revenue / Startup" },
  { value: "under_1m", label: "Under R1 million" },
  { value: "1m_5m", label: "R1m – R5 million" },
  { value: "5m_20m", label: "R5m – R20 million" },
  { value: "20m_plus", label: "R20 million+" },
];

const legalStructures = [
  { value: "sole_proprietor", label: "Sole Proprietor" },
  { value: "pty_ltd", label: "Pty Ltd / Private Company" },
  { value: "partnership", label: "Partnership" },
  { value: "cc", label: "Close Corporation (CC)" },
  { value: "npc", label: "Non-Profit Company" },
  { value: "other", label: "Other" },
];

const regionOptions = [
  { value: "gauteng", label: "Gauteng" },
  { value: "western_cape", label: "Western Cape" },
  { value: "kwazulu_natal", label: "KwaZulu-Natal" },
  { value: "eastern_cape", label: "Eastern Cape" },
  { value: "free_state", label: "Free State" },
  { value: "limpopo", label: "Limpopo" },
  { value: "mpumalanga", label: "Mpumalanga" },
  { value: "north_west", label: "North West" },
  { value: "northern_cape", label: "Northern Cape" },
  { value: "national", label: "National (all provinces)" },
  { value: "international", label: "International" },
];

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { tier, features } = useTierAccess();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [industryCode, setIndustryCode] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");

  // Company fields
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [revenueBand, setRevenueBand] = useState("");
  const [legalStructure, setLegalStructure] = useState("");
  const [yearsOperating, setYearsOperating] = useState("");
  const [operatingRegions, setOperatingRegions] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setIsLoading(true);
      const [profileRes, companyRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle().then(async (p) => {
          if (p.data?.company_id) {
            return supabase.from("companies").select("*").eq("id", p.data.company_id).maybeSingle();
          }
          return { data: null };
        }),
      ]);

      if (profileRes.data) {
        setName(profileRes.data.name || "");
        setIndustryCode(profileRes.data.industry_code || "general");
        setJurisdiction(profileRes.data.jurisdiction || "national");
        setCompanyId(profileRes.data.company_id);
      }

      if (companyRes.data) {
        setCompanyName(companyRes.data.name || "");
        setCompanySize(companyRes.data.size || "1-5");
        setRevenueBand(companyRes.data.revenue_band || "");
        setLegalStructure(companyRes.data.legal_structure || "");
        setYearsOperating(companyRes.data.years_operating?.toString() || "");
        setOperatingRegions(companyRes.data.operating_regions || []);
      }
      setIsLoading(false);
    };
    load();
  }, [user]);

  const toggleRegion = (value: string) => {
    setOperatingRegions((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // Update profile
      await supabase.from("profiles").update({
        name,
        industry_code: industryCode,
        jurisdiction,
      }).eq("id", user.id);

      // Update company
      if (companyId) {
        await supabase.from("companies").update({
          name: companyName || "My Company",
          industry: industryCode,
          size: companySize,
          revenue_band: revenueBand,
          legal_structure: legalStructure,
          years_operating: parseInt(yearsOperating) || 0,
          operating_regions: operatingRegions,
        }).eq("id", companyId);
      }

      toast({ title: "Settings saved", description: "Your profile and business details have been updated." });
    } catch (err) {
      console.error("Settings save error:", err);
      toast({ title: "Error saving", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="font-display text-xl font-bold text-primary flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SCRF Hub
          </Link>
          <Badge variant="outline">Settings</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your profile, business details, and subscription</p>

        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={industryCode} onValueChange={setIndustryCode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind.code} value={ind.code}>{ind.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary Region</Label>
                  <Select value={jurisdiction} onValueChange={setJurisdiction}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {regionOptions.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Details
              </CardTitle>
              <CardDescription>
                Update your business information. This affects benchmarks and tool recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Team Size</Label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sizeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Revenue Band</Label>
                  <Select value={revenueBand} onValueChange={setRevenueBand}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {revenueOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Legal Structure</Label>
                  <Select value={legalStructure} onValueChange={setLegalStructure}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {legalStructures.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Years Operating</Label>
                  <Input
                    type="number"
                    value={yearsOperating}
                    onChange={(e) => setYearsOperating(e.target.value)}
                    placeholder="e.g. 5"
                    min={0}
                    max={100}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Operating Regions</Label>
                <div className="flex flex-wrap gap-2 border rounded-lg p-3">
                  {regionOptions.map((r) => (
                    <Badge
                      key={r.value}
                      variant={operatingRegions.includes(r.value) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleRegion(r.value)}
                    >
                      {r.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Multi-business limitation note */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Each SCRF Hub account supports one business profile. Changing your industry or business details
                  will update your benchmarks and recommendations, but <strong>will not affect</strong> your
                  existing assessment history or scores. Multi-business support is planned for a future release.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Billing & Subscription */}
          <BillingPortal />

          <Separator />

          {/* Save + Danger Zone */}
          <div className="flex items-center justify-between">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save Changes</>
              )}
            </Button>
            <Button variant="ghost" className="text-muted-foreground" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
