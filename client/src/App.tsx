import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import { ProtectedAdminRoute } from "./lib/protected-admin-route";
import ProjectForm from "@/pages/project-form";
import ProjectDetail from "@/pages/project-detail";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import AdminProjectDetail from "@/pages/admin/project-detail";
import AdminProjectEdit from "@/pages/admin/project-edit";
import AdminUsers from "@/pages/admin/admin-users";
import AdminAnalytics from "@/pages/admin/admin-analytics";
import AdminSettings from "@/pages/admin/admin-settings";

// Wrapper for components that might return null to satisfy Route's component type requirement
const SafeProjectDetail = () => {
  const component = ProjectDetail();
  return component || <div>Loading...</div>;
};

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/projects/new" component={ProjectForm} />
      <ProtectedRoute path="/projects/:id" component={SafeProjectDetail} />
      <ProtectedAdminRoute path="/admin" component={AdminDashboard} />
      <ProtectedAdminRoute path="/admin/projects/:id" component={AdminProjectDetail} />
      <ProtectedAdminRoute path="/admin/projects/:id/edit" component={AdminProjectEdit} />
      <ProtectedAdminRoute path="/admin/users" component={AdminUsers} />
      <ProtectedAdminRoute path="/admin/analytics" component={AdminAnalytics} />
      <ProtectedAdminRoute path="/admin/settings" component={AdminSettings} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
