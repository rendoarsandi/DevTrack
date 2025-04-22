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

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/projects/new" component={ProjectForm} />
      <ProtectedRoute path="/projects/:id" component={ProjectDetail} />
      <ProtectedAdminRoute path="/admin" component={AdminDashboard} />
      <ProtectedAdminRoute path="/admin/projects/:id" component={AdminProjectDetail} />
      <ProtectedAdminRoute path="/admin/projects/:id/edit" component={AdminProjectEdit} />
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
