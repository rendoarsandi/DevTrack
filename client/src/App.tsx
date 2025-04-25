import React, { Suspense, useEffect, useState } from "react";
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
import Messages from "@/pages/messages";
import Payments from "@/pages/payments";
import Settings from "@/pages/settings";
import InvoicesPage from "@/pages/invoices";
import InvoiceDetailPage from "@/pages/invoice-detail";
import InvoiceFormPage from "@/pages/invoice-form";
import InvoicePaymentPage from "@/pages/invoice-payment";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import AdminProjectDetail from "@/pages/admin/project-detail";
import AdminProjectEdit from "@/pages/admin/project-edit";
import AdminUsers from "@/pages/admin/admin-users";
import AdminAnalytics from "@/pages/admin/admin-analytics";
import AdminSettings from "@/pages/admin/admin-settings";
import { SuccessNotification } from "@/components/notification/SuccessNotification";
import { VerificationStatusToast } from "@/components/auth/VerificationStatusToast";
import { useToast } from "@/hooks/use-toast";
import LandingPage from "@/pages/landing-page";
import LandingPageNew from "@/pages/landing-page-new";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SplashScreen } from "@/components/splash/SplashScreen";

const SafeProjectDetail = () => {
  // No need to call ProjectDetail as a function, it's already a React component
  return <ProjectDetail />;
};

// Lazy-loaded public feedback page
const PublicFeedback = React.lazy(() => import("@/pages/public-feedback"));

// Wrapper for public feedback page with loading indicator
const RequirePublicFeedback = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg" /></div>}>
      <PublicFeedback />
    </Suspense>
  );
};

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LandingPageNew} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/feedback" component={RequirePublicFeedback} />
      <Route path="/feedback/:token" component={RequirePublicFeedback} />
      
      {/* Protected client routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/projects/new" component={ProjectForm} />
      <ProtectedRoute path="/projects/:id" component={SafeProjectDetail} />
      <ProtectedRoute path="/messages" component={Messages} />
      <ProtectedRoute path="/payments" component={Payments} />
      <ProtectedRoute path="/settings" component={Settings} />
      
      {/* Invoice routes */}
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/invoices/:id" component={InvoiceDetailPage} />
      <ProtectedRoute path="/invoices/:id/pay" component={InvoicePaymentPage} />
      <ProtectedAdminRoute path="/invoices/new" component={InvoiceFormPage} />
      <ProtectedAdminRoute path="/invoices/:id/edit" component={InvoiceFormPage} />
      
      {/* Admin routes */}
      <ProtectedAdminRoute path="/admin" component={AdminDashboard} />
      <ProtectedAdminRoute path="/admin/projects/:id" component={AdminProjectDetail} />
      <ProtectedAdminRoute path="/admin/projects/:id/edit" component={AdminProjectEdit} />
      <ProtectedAdminRoute path="/admin/users" component={AdminUsers} />
      <ProtectedAdminRoute path="/admin/analytics" component={AdminAnalytics} />
      <ProtectedAdminRoute path="/admin/settings" component={AdminSettings} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { toast } = useToast();
  
  // Email verification success notification when URL parameter exists
  useEffect(() => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    
    console.log("App loaded, checking URL params:", { verified });
    
    // Display notification when component loads if URL contains verified=success parameter
    if (verified === 'success') {
      console.log("Displaying email verification success toast");
      
      // Remove parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('verified');
      window.history.replaceState({}, document.title, url.toString());
      
      // Display toast notification
      toast({
        title: "Email Successfully Verified! ✓",
        description: "Your email has been successfully verified. You can now use all FourByte features.",
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 10000,
      });
    }
  }, [toast]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <SuccessNotification />
          <VerificationStatusToast />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
