import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import CitizensPage from "@/pages/citizens";
import CitizenDetailPage from "@/pages/citizen-detail";
import InstitutionsPage from "@/pages/institutions";
import DocumentsPage from "@/pages/documents";
import VerificationPage from "@/pages/verification";
import AuditPage from "@/pages/audit";
import NotificationsPage from "@/pages/notifications";
import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/citizens" component={CitizensPage} />
        <Route path="/citizens/:id" component={CitizenDetailPage} />
        <Route path="/institutions" component={InstitutionsPage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route path="/verification" component={VerificationPage} />
        <Route path="/audit" component={AuditPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
