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
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Correct implementation for project detail route
const SafeProjectDetail = () => {
  // No need to call ProjectDetail as a function, it's already a React component
  return <ProjectDetail />;
};

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
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
      
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { toast } = useToast();
  
  // Notifikasi verifikasi email sukses yang muncul saat parameter URL ada
  useEffect(() => {
    // Cek parameter URL
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    
    console.log("App loaded, checking URL params:", { verified });
    
    // Tampilkan notification ketika komponen dimuat jika URL mengandung parameter verified=success
    if (verified === 'success') {
      console.log("Displaying email verification success toast");
      
      // Hapus parameter dari URL
      const url = new URL(window.location.href);
      url.searchParams.delete('verified');
      window.history.replaceState({}, document.title, url.toString());
      
      // Tampilkan toast langsung
      toast({
        title: "Email Berhasil Diverifikasi! ✓",
        description: "Email Anda telah berhasil diverifikasi. Anda sekarang dapat menggunakan semua fitur FourByte.",
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
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
