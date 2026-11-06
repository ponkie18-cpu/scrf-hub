import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Database, Lock, FileCheck, AlertCircle, CheckCircle2, ArrowRight, Download, Loader2, UserPlus } from "lucide-react";
import { useAssessmentSave } from "@/hooks/useAssessmentSave";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { AdvisorShareModal } from "@/components/advisor/AdvisorShareModal";
import { PDFExportButton } from "@/components/advisor/PDFExportButton";
import type { PDFReportData } from "@/lib/pdfExport";

interface AuditItem {
  id: string;
  question: string;
  explanation: string;
  priority: "critical" | "important" | "recommended";
}

interface AuditSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: AuditItem[];
}

const auditSections: AuditSection[] = [
  {
    id: "data-collection",
    title: "Data Collection",
    icon: <Database className="h-4 w-4" />,
    items: [
      {
        id: "dc1",
        question: "We have documented what personal data we collect from customers/users",
        explanation: "Create an inventory of all personal data types: names, emails, addresses, payment info, etc.",
        priority: "critical"
      },
      {
        id: "dc2",
        question: "We only collect data that is necessary for our business purposes",
        explanation: "Data minimization principle - don't collect data 'just in case'.",
        priority: "important"
      },
      {
        id: "dc3",
        question: "We have a legal basis for collecting each type of personal data",
        explanation: "Common bases: consent, contract necessity, legal obligation, legitimate interest.",
        priority: "critical"
      },
      {
        id: "dc4",
        question: "We inform users what data we collect before or at the time of collection",
        explanation: "Typically done through privacy notices at point of collection.",
        priority: "critical"
      }
    ]
  },
  {
    id: "data-storage",
    title: "Data Storage & Security",
    icon: <Lock className="h-4 w-4" />,
    items: [
      {
        id: "ds1",
        question: "We know where all personal data is stored (physical and digital locations)",
        explanation: "Include: databases, cloud services, email systems, file shares, paper records.",
        priority: "critical"
      },
      {
        id: "ds2",
        question: "Access to personal data is restricted to authorized personnel only",
        explanation: "Implement role-based access controls and the principle of least privilege.",
        priority: "critical"
      },
      {
        id: "ds3",
        question: "Personal data is encrypted at rest and in transit",
        explanation: "Use HTTPS for transmission and encryption for stored sensitive data.",
        priority: "important"
      },
      {
        id: "ds4",
        question: "We have a data retention policy and delete data we no longer need",
        explanation: "Define how long you keep different data types and automate deletion where possible.",
        priority: "important"
      },
      {
        id: "ds5",
        question: "We regularly back up data and test our ability to restore it",
        explanation: "Backups should be encrypted and stored securely.",
        priority: "important"
      }
    ]
  },
  {
    id: "data-rights",
    title: "Data Subject Rights",
    icon: <FileCheck className="h-4 w-4" />,
    items: [
      {
        id: "dr1",
        question: "We have a process to respond to requests for access to personal data",
        explanation: "Users can request a copy of all data you hold about them.",
        priority: "important"
      },
      {
        id: "dr2",
        question: "We can correct or update personal data upon request",
        explanation: "Users have the right to have inaccurate data corrected.",
        priority: "important"
      },
      {
        id: "dr3",
        question: "We can delete personal data upon request (where legally permitted)",
        explanation: "The 'right to be forgotten' - with some exceptions.",
        priority: "important"
      },
      {
        id: "dr4",
        question: "We have a published privacy policy that is easy to understand",
        explanation: "Avoid legal jargon - explain data practices in plain language.",
        priority: "critical"
      }
    ]
  },
  {
    id: "ip-protection",
    title: "Intellectual Property",
    icon: <Shield className="h-4 w-4" />,
    items: [
      {
        id: "ip1",
        question: "Our business name and logo are registered as trademarks",
        explanation: "Trademark registration provides legal protection and exclusive use rights.",
        priority: "recommended"
      },
      {
        id: "ip2",
        question: "We have copyright notices on our original content and materials",
        explanation: "While copyright exists automatically, notices deter infringement.",
        priority: "recommended"
      },
      {
        id: "ip3",
        question: "Employee/contractor agreements include IP assignment clauses",
        explanation: "Ensures work created for your business belongs to your business.",
        priority: "important"
      },
      {
        id: "ip4",
        question: "We have NDAs in place with partners who access confidential information",
        explanation: "Non-disclosure agreements protect trade secrets and proprietary methods.",
        priority: "important"
      },
      {
        id: "ip5",
        question: "We keep records of when key IP assets were created (for ownership proof)",
        explanation: "Documentation helps prove ownership in case of disputes.",
        priority: "recommended"
      }
    ]
  }
];

const DataProtectionAudit = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("data-collection");
  const [showResults, setShowResults] = useState(false);
  const { saveAssessment, isSaving, savedToDb } = useAssessmentSave();

  // Save when results shown
  useEffect(() => {
    if (showResults && !savedToDb && !isSaving) {
      const unchecked = getUncheckedItems();
      const critical = unchecked.filter(u => u.item.priority === "critical");
      
      saveAssessment({
        domain: "compliance",
        toolId: "data-protection-audit",
        answers: checkedItems,
        score: Math.round(progressPercent),
        insights: [`${checkedCount}/${totalItems} items addressed`, `${critical.length} critical gaps`],
        recommendations: critical.slice(0, 3).map(c => ({
          title: c.item.question.substring(0, 60),
          priority: "high" as const,
        })),
      });
    }
  }, [showResults, savedToDb, isSaving]);

  const handleCheck = (itemId: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: checked }));
  };

  const totalItems = auditSections.reduce((acc, section) => acc + section.items.length, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = (checkedCount / totalItems) * 100;

  const getSectionProgress = (section: AuditSection) => {
    const sectionChecked = section.items.filter(item => checkedItems[item.id]).length;
    return {
      checked: sectionChecked,
      total: section.items.length,
      percent: (sectionChecked / section.items.length) * 100
    };
  };

  const getUncheckedItems = () => {
    const unchecked: { section: string; item: AuditItem }[] = [];
    auditSections.forEach(section => {
      section.items.forEach(item => {
        if (!checkedItems[item.id]) {
          unchecked.push({ section: section.title, item });
        }
      });
    });
    return unchecked;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-destructive";
      case "important": return "text-amber-500";
      default: return "text-muted-foreground";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "critical": return "Critical";
      case "important": return "Important";
      default: return "Recommended";
    }
  };

  if (showResults) {
    const uncheckedItems = getUncheckedItems();
    const criticalMissing = uncheckedItems.filter(u => u.item.priority === "critical");
    const importantMissing = uncheckedItems.filter(u => u.item.priority === "important");
    const recommendedMissing = uncheckedItems.filter(u => u.item.priority === "recommended");

    return (
      <UpgradeGate toolId="data-protection-audit" toolName="Data Protection Audit" toolDescription="Assess your data handling practices and intellectual property protection.">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Data Protection & IP Audit Results
            </CardTitle>
          <CardDescription>Your prioritised action list based on the self-audit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-muted/30 rounded-xl">
            <p className="text-sm text-muted-foreground mb-2">Compliance Score</p>
            <p className="text-4xl font-bold text-primary">{Math.round(progressPercent)}%</p>
            <p className="text-sm text-muted-foreground mt-2">{checkedCount} of {totalItems} items addressed</p>
          </div>

          {criticalMissing.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Critical - Address Immediately</span>
              </div>
              <div className="space-y-2">
                {criticalMissing.map(({ section, item }) => (
                  <div key={item.id} className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium">{item.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.explanation}</p>
                    <p className="text-xs text-destructive mt-1">Section: {section}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importantMissing.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Important - Plan to Address Soon</span>
              </div>
              <div className="space-y-2">
                {importantMissing.map(({ section, item }) => (
                  <div key={item.id} className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium">{item.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.explanation}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Section: {section}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendedMissing.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Recommended - Consider When Resources Allow</span>
              </div>
              <div className="space-y-2">
                {recommendedMissing.map(({ section, item }) => (
                  <div key={item.id} className="p-3 bg-muted/30 border border-border rounded-lg">
                    <p className="text-sm font-medium">{item.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.explanation}</p>
                    <p className="text-xs text-muted-foreground mt-1">Section: {section}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uncheckedItems.length === 0 && (
            <div className="text-center p-6">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium">Excellent!</p>
              <p className="text-sm text-muted-foreground">You've addressed all audit items. Consider scheduling an annual review.</p>
            </div>
          )}

          {/* Local Intelligence Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-muted-foreground/10 text-sm">
            <span className="text-muted-foreground">ℹ️</span>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Local Note: </span>
              Data protection and intellectual property laws vary significantly by jurisdiction. 
              This tool provides a framework for understanding; consult a qualified legal professional for advice specific to your situation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowResults(false)} variant="outline" className="flex-1">
              Back to Audit
            </Button>
            <PDFExportButton
              reportData={{
                reportTitle: 'Data Protection & IP Audit Report',
                reportType: 'Data Protection Audit',
                score: Math.round(progressPercent),
                completedAt: new Date().toLocaleDateString(),
                sections: [
                  {
                    title: 'Summary',
                    items: [
                      { label: 'Compliance Score', value: `${Math.round(progressPercent)}%`, highlight: progressPercent >= 70 ? 'success' : progressPercent >= 40 ? 'warning' : 'danger' },
                      { label: 'Items Addressed', value: `${checkedCount} of ${totalItems}` },
                      { label: 'Critical Gaps', value: `${criticalMissing.length} items`, highlight: criticalMissing.length > 0 ? 'danger' : 'success' },
                    ],
                  },
                  ...(criticalMissing.length > 0 ? [{
                    title: 'Critical - Address Immediately',
                    items: criticalMissing.map(({ section, item }) => ({ label: section, value: item.question, highlight: 'danger' as const })),
                  }] : []),
                  ...(importantMissing.length > 0 ? [{
                    title: 'Important - Plan to Address',
                    items: importantMissing.map(({ section, item }) => ({ label: section, value: item.question, highlight: 'warning' as const })),
                  }] : []),
                ],
              }}
              label="Export PDF Report"
            />
            <AdvisorShareModal
              reportType="data-protection-audit"
              reportName="Data Protection & IP Audit"
              summaryData={{
                score: Math.round(progressPercent),
                highlights: [
                  `${checkedCount}/${totalItems} compliance items addressed`,
                  `${criticalMissing.length} critical gaps identified`,
                  `${importantMissing.length} important items need attention`
                ],
                recommendations: criticalMissing.slice(0, 3).map(c => c.item.question),
                completedAt: new Date().toLocaleDateString(),
              }}
              trigger={
                <Button variant="secondary" className="w-full sm:w-auto gap-2">
                  <UserPlus className="h-4 w-4" />
                  Get Advisor Feedback
                </Button>
              }
            />
          </div>
          </CardContent>
        </Card>
      </UpgradeGate>
    );
  }

  return (
    <UpgradeGate toolId="data-protection-audit" toolName="Data Protection Audit" toolDescription="Assess your data handling practices and intellectual property protection.">
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Data Protection & IP Self-Audit
        </CardTitle>
        <CardDescription>Assess your data handling practices and intellectual property protection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{checkedCount} / {totalItems} items</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Section Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
            {auditSections.map(section => {
              const progress = getSectionProgress(section);
              return (
                <TabsTrigger key={section.id} value={section.id} className="text-xs md:text-sm">
                  <span className="hidden md:inline">{section.title}</span>
                  <span className="md:hidden">{section.title.split(" ")[0]}</span>
                  <span className="ml-1 text-muted-foreground">({progress.checked}/{progress.total})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {auditSections.map(section => (
            <TabsContent key={section.id} value={section.id} className="space-y-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {section.icon}
                <span>{section.title}</span>
              </div>
              
              <div className="space-y-3">
                {section.items.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-4 border rounded-lg transition-colors ${
                      checkedItems[item.id] ? "border-primary/30 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={item.id}
                        checked={checkedItems[item.id] || false}
                        onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <label htmlFor={item.id} className="text-sm font-medium cursor-pointer block">
                          {item.question}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">{item.explanation}</p>
                        <span className={`text-xs font-medium mt-2 inline-block ${getPriorityColor(item.priority)}`}>
                          {getPriorityLabel(item.priority)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Button onClick={() => setShowResults(true)} className="w-full">
          View Prioritised Action List
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default DataProtectionAudit;
