import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Download, AlertTriangle, Users, Phone, Server, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UpgradeGate } from "@/components/tier/UpgradeGate";

interface BCPSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  fields: {
    id: string;
    label: string;
    type: "text" | "textarea" | "list";
    placeholder: string;
    value: string | string[];
  }[];
}

const BCPBuilder = () => {
  const { toast } = useToast();
  const [sections, setSections] = useState<BCPSection[]>([
    {
      id: "overview",
      title: "Business Overview",
      icon: <FileText className="h-5 w-5" />,
      fields: [
        { id: "businessName", label: "Business Name", type: "text", placeholder: "Your company name", value: "" },
        { id: "primaryContact", label: "BCP Owner / Primary Contact", type: "text", placeholder: "Name and role", value: "" },
        { id: "planDate", label: "Plan Date", type: "text", placeholder: "DD/MM/YYYY", value: "" },
        { id: "scope", label: "Plan Scope", type: "textarea", placeholder: "What does this plan cover? e.g., All UK operations, main office only, etc.", value: "" },
      ],
    },
    {
      id: "critical",
      title: "Critical Business Functions",
      icon: <AlertTriangle className="h-5 w-5" />,
      fields: [
        { id: "function1", label: "Critical Function 1", type: "text", placeholder: "e.g., Customer order processing", value: "" },
        { id: "function2", label: "Critical Function 2", type: "text", placeholder: "e.g., Payment processing", value: "" },
        { id: "function3", label: "Critical Function 3", type: "text", placeholder: "e.g., Inventory management", value: "" },
        { id: "maxDowntime", label: "Maximum Tolerable Downtime", type: "text", placeholder: "e.g., 4 hours, 1 day", value: "" },
        { id: "dependencies", label: "Key Dependencies", type: "textarea", placeholder: "Systems, suppliers, or people these functions depend on", value: "" },
      ],
    },
    {
      id: "contacts",
      title: "Emergency Contacts",
      icon: <Phone className="h-5 w-5" />,
      fields: [
        { id: "internalLead", label: "Internal Crisis Lead", type: "text", placeholder: "Name, phone, email", value: "" },
        { id: "itSupport", label: "IT Support Contact", type: "text", placeholder: "Name/company, phone", value: "" },
        { id: "insurance", label: "Insurance Provider", type: "text", placeholder: "Company, policy number, phone", value: "" },
        { id: "keySupplier", label: "Key Supplier Emergency Contact", type: "text", placeholder: "Company, contact, phone", value: "" },
        { id: "utilities", label: "Utilities/Landlord", type: "text", placeholder: "Contact details", value: "" },
      ],
    },
    {
      id: "team",
      title: "Crisis Response Team",
      icon: <Users className="h-5 w-5" />,
      fields: [
        { id: "crisisLead", label: "Crisis Lead", type: "text", placeholder: "Name and responsibilities", value: "" },
        { id: "commsLead", label: "Communications Lead", type: "text", placeholder: "Who handles internal/external comms", value: "" },
        { id: "opsLead", label: "Operations Lead", type: "text", placeholder: "Who manages operational recovery", value: "" },
        { id: "alternates", label: "Backup/Alternate Contacts", type: "textarea", placeholder: "Who steps in if primary contacts are unavailable", value: "" },
      ],
    },
    {
      id: "recovery",
      title: "Recovery Procedures",
      icon: <Server className="h-5 w-5" />,
      fields: [
        { id: "itRecovery", label: "IT Systems Recovery", type: "textarea", placeholder: "Steps to restore critical IT systems, backup locations, etc.", value: "" },
        { id: "altLocation", label: "Alternative Work Location", type: "text", placeholder: "Where can staff work if main site unavailable?", value: "" },
        { id: "dataBackup", label: "Data Backup Details", type: "textarea", placeholder: "Where are backups stored? How often? How to restore?", value: "" },
        { id: "manualWorkaround", label: "Manual Workarounds", type: "textarea", placeholder: "How can critical functions continue without technology?", value: "" },
      ],
    },
  ]);

  const updateField = (sectionId: string, fieldId: string, value: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map((field) =>
                field.id === fieldId ? { ...field, value } : field
              ),
            }
          : section
      )
    );
  };

  const calculateProgress = () => {
    const allFields = sections.flatMap((s) => s.fields);
    const completedFields = allFields.filter((f) => 
      typeof f.value === "string" ? f.value.trim() !== "" : f.value.length > 0
    );
    return Math.round((completedFields.length / allFields.length) * 100);
  };

  const getSectionProgress = (section: BCPSection) => {
    const completed = section.fields.filter((f) =>
      typeof f.value === "string" ? f.value.trim() !== "" : f.value.length > 0
    );
    return { completed: completed.length, total: section.fields.length };
  };

  const exportPlan = () => {
    let markdown = `# Business Continuity Plan\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleDateString()}\n\n---\n\n`;

    sections.forEach((section) => {
      markdown += `## ${section.title}\n\n`;
      section.fields.forEach((field) => {
        const value = typeof field.value === "string" ? field.value : field.value.join(", ");
        markdown += `**${field.label}:** ${value || "_Not completed_"}\n\n`;
      });
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business-continuity-plan-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "BCP exported successfully!" });
  };

  const progress = calculateProgress();

  return (
    <UpgradeGate toolId="bcp-builder" toolName="Business Continuity Plan Builder" toolDescription="Create a comprehensive business continuity plan with guided sections and export capability.">
      <div className="space-y-6">
        {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Business Continuity Plan</CardTitle>
              <CardDescription>Complete each section to build your plan</CardDescription>
            </div>
            <Button onClick={exportPlan} disabled={progress < 20}>
              <Download className="h-4 w-4 mr-2" />
              Export Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <Accordion type="single" collapsible className="space-y-4">
        {sections.map((section) => {
          const { completed, total } = getSectionProgress(section);
          const isComplete = completed === total;

          return (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${isComplete ? "bg-green-100" : "bg-muted"}`}>
                    {section.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{section.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {completed}/{total} fields completed
                    </p>
                  </div>
                  {isComplete ? (
                    <Badge className="bg-green-100 text-green-700">Complete</Badge>
                  ) : (
                    <Badge variant="outline">{Math.round((completed / total) * 100)}%</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-4">
                  {section.fields.map((field) => (
                    <div key={field.id}>
                      <div className="flex items-center gap-2 mb-1">
                        {typeof field.value === "string" && field.value.trim() !== "" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Label>{field.label}</Label>
                      </div>
                      {field.type === "textarea" ? (
                        <Textarea
                          placeholder={field.placeholder}
                          value={field.value as string}
                          onChange={(e) => updateField(section.id, field.id, e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <Input
                          placeholder={field.placeholder}
                          value={field.value as string}
                          onChange={(e) => updateField(section.id, field.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Tips */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Tips for a robust BCP:</p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Review and update this plan every 6 months</li>
                <li>Test recovery procedures at least annually</li>
                <li>Ensure all key staff know where to find this plan</li>
                <li>Keep a printed copy in a safe location</li>
              </ul>
            </div>
          </div>
        </CardContent>
        </Card>
      </div>
    </UpgradeGate>
  );
};

export default BCPBuilder;