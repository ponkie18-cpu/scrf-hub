import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import RequireRole from "@/components/auth/RequireRole";

// Eager-load the landing page (critical path)
import Index from "./pages/Index";

// Lazy-load all other routes for code splitting
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OperationalRisk = lazy(() => import("./pages/OperationalRisk"));
const FinancialRisk = lazy(() => import("./pages/FinancialRisk"));
const ComplianceLegalRisk = lazy(() => import("./pages/ComplianceLegalRisk"));
const StrategicCyberRisk = lazy(() => import("./pages/StrategicCyberRisk"));
const Feedback = lazy(() => import("./pages/Feedback"));
const AdvisorMarketplace = lazy(() => import("./pages/AdvisorMarketplace"));
const SecurityAuditReport = lazy(() => import("./pages/SecurityAuditReport"));
const PerformanceAuditReport = lazy(() => import("./pages/PerformanceAuditReport"));
const TechDebtAuditReport = lazy(() => import("./pages/TechDebtAuditReport"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const QATestReport = lazy(() => import("./pages/QATestReport"));
const Settings = lazy(() => import("./pages/Settings"));
const AIAgentTestReport = lazy(() => import("./pages/AIAgentTestReport"));
const ToolJourneyTestReport = lazy(() => import("./pages/ToolJourneyTestReport"));
const LoadTestReport = lazy(() => import("./pages/LoadTestReport"));
const UXEdgeCaseTestReport = lazy(() => import("./pages/UXEdgeCaseTestReport"));
const BillingTestReport = lazy(() => import("./pages/BillingTestReport"));
const ContentValidation = lazy(() => import("./pages/ContentValidation"));
const ExpertReviewerRegister = lazy(() => import("./pages/ExpertReviewerRegister"));
const ExpertReviewerDashboard = lazy(() => import("./pages/ExpertReviewerDashboard"));
const AdminAIAccuracy = lazy(() => import("./pages/AdminAIAccuracy"));
const AdminAIEvaluation = lazy(() => import("./pages/AdminAIEvaluation"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CancellationPolicy = lazy(() => import("./pages/CancellationPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LazyFloatingAgentPanel = lazy(() => import("./components/agent/FloatingAgentPanel"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s stale-while-revalidate
      gcTime: 5 * 60_000,       // 5min garbage collection
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/** Wrapper avoids ref-forwarding warning from React.lazy inside Suspense */
function FloatingAgentPanel() {
  return (
    <Suspense fallback={null}>
      <LazyFloatingAgentPanel />
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/operational-risk" element={<OperationalRisk />} />
              <Route path="/financial-risk" element={<FinancialRisk />} />
              <Route path="/compliance-risk" element={<ComplianceLegalRisk />} />
              <Route path="/strategic-cyber-risk" element={<StrategicCyberRisk />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/advisors" element={<AdvisorMarketplace />} />
              <Route path="/security-audit" element={<SecurityAuditReport />} />
              <Route path="/performance-audit" element={<PerformanceAuditReport />} />
              <Route path="/tech-debt-audit" element={<TechDebtAuditReport />} />
              <Route path="/qa-test-report" element={<QATestReport />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/ai-agent-test-report" element={<AIAgentTestReport />} />
              <Route path="/tool-journey-test-report" element={<ToolJourneyTestReport />} />
              <Route path="/load-test-report" element={<LoadTestReport />} />
              <Route path="/ux-test-report" element={<UXEdgeCaseTestReport />} />
              <Route path="/billing-test-report" element={<BillingTestReport />} />
              {/* Admin routes — require "admin" role */}
              <Route path="/admin/content-validation" element={<RequireRole role="admin"><ContentValidation /></RequireRole>} />
              <Route path="/admin/ai-accuracy" element={<RequireRole role="admin"><AdminAIAccuracy /></RequireRole>} />
              <Route path="/admin/ai-evaluation" element={<RequireRole role="admin"><AdminAIEvaluation /></RequireRole>} />
              {/* Expert reviewer routes */}
              <Route path="/expert-review/register" element={<ExpertReviewerRegister />} />
              <Route path="/expert-review/dashboard" element={<ExpertReviewerDashboard />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cancellation-policy" element={<CancellationPolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingAgentPanel />
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
