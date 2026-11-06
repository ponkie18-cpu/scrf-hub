import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, AlertOctagon, MessageSquare, Download, User, Phone, Building, CheckCircle, Loader2 } from "lucide-react";
import { useAssessmentSave } from "@/hooks/useAssessmentSave";
import type { AssessmentRecommendation } from "@/services/assessmentService";
import { UpgradeGate } from "@/components/tier/UpgradeGate";

interface PlaybookData {
  businessName: string;
  incidentLead: string;
  incidentLeadPhone: string;
  itContact: string;
  itContactPhone: string;
  legalContact: string;
  legalContactPhone: string;
  prContact: string;
  prContactPhone: string;
  insuranceContact: string;
  insurancePolicy: string;
  publicStatement: string;
  internalMessage: string;
  customerNotification: string;
}

const IncidentPlaybookBuilder = () => {
  const [activeTab, setActiveTab] = useState("reputation");
  const [data, setData] = useState<PlaybookData>({
    businessName: "",
    incidentLead: "",
    incidentLeadPhone: "",
    itContact: "",
    itContactPhone: "",
    legalContact: "",
    legalContactPhone: "",
    prContact: "",
    prContactPhone: "",
    insuranceContact: "",
    insurancePolicy: "",
    publicStatement: "",
    internalMessage: "",
    customerNotification: "",
  });
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const { saveAssessment, isSaving } = useAssessmentSave();

  const updateField = (field: keyof PlaybookData, value: string) => {
    setData({ ...data, [field]: value });
  };

  const isComplete = () => {
    return data.businessName && data.incidentLead && data.incidentLeadPhone;
  };

  const calculateReadiness = (): number => {
    let score = 0;
    if (data.businessName) score += 5;
    if (data.incidentLead && data.incidentLeadPhone) score += 20;
    if (data.itContact && data.itContactPhone) score += 15;
    if (data.legalContact && data.legalContactPhone) score += 15;
    if (data.prContact && data.prContactPhone) score += 10;
    if (data.insuranceContact) score += 10;
    if (data.publicStatement) score += 10;
    if (data.internalMessage) score += 10;
    if (data.customerNotification) score += 5;
    return Math.min(score, 100);
  };

  const handleSaveToDashboard = async () => {
    const score = calculateReadiness();
    const insights: string[] = [];
    const recommendations: AssessmentRecommendation[] = [];

    if (!data.itContact) {
      insights.push("No IT contact defined - critical for cyber incidents");
      recommendations.push({
        title: "Establish IT emergency contact",
        priority: "high",
        description: "Define an IT contact for immediate response to cyber incidents"
      });
    }

    if (!data.legalContact) {
      insights.push("No legal counsel contact - required for data breach notification");
      recommendations.push({
        title: "Identify legal counsel for incidents",
        priority: "high",
        description: "Legal guidance is critical for compliance during data breaches"
      });
    }

    if (!data.publicStatement) {
      recommendations.push({
        title: "Draft public crisis statement template",
        priority: "medium",
        description: "Prepare templates now to avoid writing under pressure during a crisis"
      });
    }

    if (score >= 80) {
      insights.push("Comprehensive incident playbook established");
    }

    const result = await saveAssessment({
      domain: "strategic",
      toolId: "incident-playbook-builder",
      answers: { ...data },
      score,
      insights,
      recommendations
    });

    if (result.success) setSaved(true);
  };

  const generatePlaybook = () => {
    setShowPlaybook(true);
  };

  const downloadPlaybook = () => {
    const playbookText = `
INCIDENT RESPONSE PLAYBOOK
${data.businessName}
Generated: ${new Date().toLocaleDateString()}

═══════════════════════════════════════════════════════
SECTION 1: KEY CONTACTS
═══════════════════════════════════════════════════════

INCIDENT LEAD (Primary Decision Maker)
Name: ${data.incidentLead || "[Not specified]"}
Phone: ${data.incidentLeadPhone || "[Not specified]"}

IT/TECHNICAL SUPPORT
Name: ${data.itContact || "[Not specified]"}
Phone: ${data.itContactPhone || "[Not specified]"}

LEGAL COUNSEL
Name: ${data.legalContact || "[Not specified]"}
Phone: ${data.legalContactPhone || "[Not specified]"}

PR/COMMUNICATIONS
Name: ${data.prContact || "[Not specified]"}
Phone: ${data.prContactPhone || "[Not specified]"}

INSURANCE
Contact: ${data.insuranceContact || "[Not specified]"}
Policy #: ${data.insurancePolicy || "[Not specified]"}

═══════════════════════════════════════════════════════
SECTION 2: REPUTATION CRISIS RESPONSE
═══════════════════════════════════════════════════════

STEP 1: ASSESS (First 30 minutes)
□ What happened? Document the facts
□ Who is affected? (customers, partners, employees)
□ What's the source? (review site, social media, news)
□ Is it spreading?

STEP 2: CONTAIN (First 2 hours)
□ Do NOT delete or hide the issue
□ Alert the incident lead and relevant contacts
□ Pause any scheduled social posts
□ Prepare holding statement if needed

STEP 3: RESPOND (Within 24 hours)
□ Acknowledge the issue publicly
□ Show empathy, take responsibility where appropriate
□ Outline what you're doing to fix it
□ Provide a contact for affected parties

PUBLIC STATEMENT TEMPLATE:
${data.publicStatement || "We are aware of [issue] and are taking it seriously. We are [actions]. We apologize for any inconvenience and are committed to [resolution]. Contact us at [email/phone] if affected."}

INTERNAL MESSAGE TEMPLATE:
${data.internalMessage || "Team, we are handling [issue]. Please direct all inquiries to [incident lead]. Do not comment publicly. More updates to follow."}

═══════════════════════════════════════════════════════
SECTION 3: CYBER INCIDENT RESPONSE
═══════════════════════════════════════════════════════

STEP 1: CONTAIN (First 15 minutes)
□ Disconnect affected systems from network (if safe)
□ Do NOT turn off computers (preserve evidence)
□ Alert IT contact immediately
□ Change critical passwords from a clean device

STEP 2: ASSESS (First 2 hours)
□ What systems are affected?
□ What data may be compromised?
□ Is the attack ongoing?
□ Document everything with timestamps

STEP 3: NOTIFY (Within 24-72 hours as required)
□ Contact legal counsel about notification requirements
□ Notify insurance provider
□ Consider law enforcement for significant breaches
□ Prepare customer notifications if data was exposed

CUSTOMER NOTIFICATION TEMPLATE:
${data.customerNotification || "We recently discovered a security incident that may have affected your information. We are [actions taken]. As a precaution, we recommend [customer actions]. Contact us at [email/phone] with questions."}

STEP 4: RECOVER
□ Work with IT to restore from clean backups
□ Patch/update vulnerabilities
□ Conduct post-incident review
□ Update security practices

═══════════════════════════════════════════════════════
QUICK REFERENCE CARD
═══════════════════════════════════════════════════════

IF SOCIAL MEDIA CRISIS:
1. Don't delete → 2. Assess scope → 3. Alert team → 4. Respond with empathy

IF RANSOMWARE/MALWARE:
1. Disconnect from network → 2. Don't pay immediately → 3. Call IT → 4. Call insurance

IF DATA BREACH:
1. Contain → 2. Assess what's exposed → 3. Call legal → 4. Notify as required

REMEMBER: Stay calm. Document everything. One spokesperson only.
    `.trim();

    const blob = new Blob([playbookText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident-playbook-${data.businessName.replace(/\s+/g, "-").toLowerCase() || "business"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <UpgradeGate toolId="incident-playbook" toolName="Incident Response Playbook Builder" toolDescription="Create a customized one-page plan for reputation crises and cyber incidents.">
      <Card className="border-primary/20">
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Incident Response Playbook Builder
        </CardTitle>
        <CardDescription>
          Create a customised one-page plan for reputation crises and cyber incidents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showPlaybook ? (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="reputation">Reputation</TabsTrigger>
                <TabsTrigger value="cyber">Cyber</TabsTrigger>
              </TabsList>

              <TabsContent value="contacts" className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p>Define your key contacts. In a crisis, knowing who to call is half the battle.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Business Name</Label>
                    <Input
                      value={data.businessName}
                      onChange={(e) => updateField("businessName", e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div className="md:col-span-2 p-3 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4" /> Incident Lead (Required)
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <Input
                        value={data.incidentLead}
                        onChange={(e) => updateField("incidentLead", e.target.value)}
                        placeholder="Name"
                      />
                      <Input
                        value={data.incidentLeadPhone}
                        onChange={(e) => updateField("incidentLeadPhone", e.target.value)}
                        placeholder="Phone"
                      />
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building className="h-4 w-4" /> IT/Tech Support
                    </div>
                    <Input
                      value={data.itContact}
                      onChange={(e) => updateField("itContact", e.target.value)}
                      placeholder="Name/Company"
                    />
                    <Input
                      value={data.itContactPhone}
                      onChange={(e) => updateField("itContactPhone", e.target.value)}
                      placeholder="Phone"
                    />
                  </div>

                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4" /> Legal Counsel
                    </div>
                    <Input
                      value={data.legalContact}
                      onChange={(e) => updateField("legalContact", e.target.value)}
                      placeholder="Name/Firm"
                    />
                    <Input
                      value={data.legalContactPhone}
                      onChange={(e) => updateField("legalContactPhone", e.target.value)}
                      placeholder="Phone"
                    />
                  </div>

                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="h-4 w-4" /> PR/Communications
                    </div>
                    <Input
                      value={data.prContact}
                      onChange={(e) => updateField("prContact", e.target.value)}
                      placeholder="Name/Agency"
                    />
                    <Input
                      value={data.prContactPhone}
                      onChange={(e) => updateField("prContactPhone", e.target.value)}
                      placeholder="Phone"
                    />
                  </div>

                  <div className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" /> Insurance
                    </div>
                    <Input
                      value={data.insuranceContact}
                      onChange={(e) => updateField("insuranceContact", e.target.value)}
                      placeholder="Provider/Agent"
                    />
                    <Input
                      value={data.insurancePolicy}
                      onChange={(e) => updateField("insurancePolicy", e.target.value)}
                      placeholder="Policy Number"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reputation" className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                  <AlertOctagon className="h-4 w-4 inline mr-2 text-amber-600" />
                  Prepare templates now so you're not writing under pressure during a crisis.
                </div>

                <div>
                  <Label>Public Statement Template</Label>
                  <Textarea
                    value={data.publicStatement}
                    onChange={(e) => updateField("publicStatement", e.target.value)}
                    placeholder="We are aware of [issue] and are taking it seriously. We are [actions]. We apologize for any inconvenience..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    For social media or press responses
                  </p>
                </div>

                <div>
                  <Label>Internal Team Message Template</Label>
                  <Textarea
                    value={data.internalMessage}
                    onChange={(e) => updateField("internalMessage", e.target.value)}
                    placeholder="Team, we are handling [issue]. Please direct all inquiries to [incident lead]. Do not comment publicly..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    To align your team and prevent mixed messages
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="cyber" className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                  <AlertOctagon className="h-4 w-4 inline mr-2 text-red-600" />
                  Data breaches may require legal notification. Consult your lawyer about your obligations.
                </div>

                <div>
                  <Label>Customer Data Breach Notification Template</Label>
                  <Textarea
                    value={data.customerNotification}
                    onChange={(e) => updateField("customerNotification", e.target.value)}
                    placeholder="We recently discovered a security incident that may have affected your information. We are [actions taken]. As a precaution..."
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    For notifying affected customers if required by law
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Button
              onClick={generatePlaybook}
              disabled={!isComplete()}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" /> Generate My Playbook
            </Button>
            {!isComplete() && (
              <p className="text-xs text-center text-muted-foreground">
                Complete at least business name and incident lead to generate
              </p>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-lg mb-2">{data.businessName}</h4>
              <p className="text-sm text-muted-foreground">Incident Response Playbook</p>
            </div>

            {/* Quick Reference */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-red-600" /> Reputation Crisis
                </h5>
                <ol className="text-sm space-y-1">
                  <li>1. Don't delete the issue</li>
                  <li>2. Assess scope and facts</li>
                  <li>3. Alert {data.incidentLead}</li>
                  <li>4. Respond with empathy within 24h</li>
                </ol>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h5 className="font-medium mb-2 flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-amber-600" /> Cyber Incident
                </h5>
                <ol className="text-sm space-y-1">
                  <li>1. Disconnect from network</li>
                  <li>2. Don't turn off computers</li>
                  <li>3. Call {data.itContact || "IT support"}</li>
                  <li>4. Document everything</li>
                </ol>
              </div>
            </div>

            {/* Key Contacts Summary */}
            <div className="p-4 border rounded-lg">
              <h5 className="font-medium mb-3">Key Contacts</h5>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div><strong>Incident Lead:</strong> {data.incidentLead} - {data.incidentLeadPhone}</div>
                {data.itContact && <div><strong>IT:</strong> {data.itContact} - {data.itContactPhone}</div>}
                {data.legalContact && <div><strong>Legal:</strong> {data.legalContact} - {data.legalContactPhone}</div>}
                {data.prContact && <div><strong>PR:</strong> {data.prContact} - {data.prContactPhone}</div>}
                {data.insuranceContact && <div><strong>Insurance:</strong> {data.insuranceContact}</div>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={downloadPlaybook} className="flex-1">
                <Download className="h-4 w-4 mr-2" /> Download Playbook
              </Button>
              <Button onClick={() => setShowPlaybook(false)} variant="outline">
                Edit
              </Button>
            </div>

            {/* Save to Dashboard */}
            {!saved ? (
              <Button 
                onClick={handleSaveToDashboard} 
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" /> Save to Dashboard</>
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 rounded-md py-3">
                <CheckCircle className="h-4 w-4" /> Saved to Dashboard
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </UpgradeGate>
  );
};

export default IncidentPlaybookBuilder;
