import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import ValidationDashboard from "@/components/validation/ValidationDashboard";
import QuestionManagement from "@/components/validation/QuestionManagement";
import ReviewInterface from "@/components/validation/ReviewInterface";
import CorrectionsTracker from "@/components/validation/CorrectionsTracker";
import SystemPromptUpdate from "@/components/validation/SystemPromptUpdate";
import KnowledgeLibrary from "@/components/validation/KnowledgeLibrary";
import QuarterlyReport from "@/components/validation/QuarterlyReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, BarChart3, FileQuestion, ClipboardCheck, AlertTriangle, Settings, BookOpen, FileText } from "lucide-react";

export default function ContentValidation() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Expert Content Validation</h1>
              <p className="text-sm text-muted-foreground">Review AI agent responses for regulatory accuracy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" />Dashboard
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <FileQuestion className="h-3.5 w-3.5" />Questions
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <ClipboardCheck className="h-3.5 w-3.5" />Review
            </TabsTrigger>
            <TabsTrigger value="corrections" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <AlertTriangle className="h-3.5 w-3.5" />Corrections
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <BookOpen className="h-3.5 w-3.5" />Library
            </TabsTrigger>
            <TabsTrigger value="system-prompt" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Settings className="h-3.5 w-3.5" />System Prompt
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" />Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><ValidationDashboard /></TabsContent>
          <TabsContent value="questions"><QuestionManagement /></TabsContent>
          <TabsContent value="review"><ReviewInterface /></TabsContent>
          <TabsContent value="corrections"><CorrectionsTracker /></TabsContent>
          <TabsContent value="library"><KnowledgeLibrary /></TabsContent>
          <TabsContent value="system-prompt"><SystemPromptUpdate /></TabsContent>
          <TabsContent value="reports"><QuarterlyReport /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
