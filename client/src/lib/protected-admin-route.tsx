import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function ProtectedAdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading, error } = useAuth();
  const { toast } = useToast();
  
  // Debugging untuk melihat status user
  useEffect(() => {
    const adminUsername = "admin"; // User admin khusus
    
    console.log("Protected Admin Route State:", {
      isLoading,
      user: user ? {
        id: user.id,
        username: user.username,
        role: user.role,
        isAdminUser: user.username === adminUsername || user.role === "admin"
      } : null,
      error: error?.message
    });
    
  }, [user, isLoading, error]);

  // Tampilkan loading state
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </Route>
    );
  }

  // Handle error fetching user
  if (error) {
    console.error("Error fetching auth state:", error);
    
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold">Authentication Error</h1>
          <p className="text-muted-foreground text-center max-w-md">
            There was an error verifying your credentials. Please try logging in again.
          </p>
          <a 
            href="/auth" 
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Login
          </a>
        </div>
      </Route>
    );
  }

  // Handle user tidak login
  if (!user) {
    // Tampilkan pesan dan arahkan ke halaman login
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
          <AlertTriangle className="h-12 w-12 text-warning" />
          <h1 className="text-xl font-bold">Login Required</h1>
          <p className="text-muted-foreground text-center max-w-md">
            You need to log in with an admin account to access the admin dashboard.
          </p>
          <a 
            href="/auth" 
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </Route>
    );
  }
  
  // Izinkan akses untuk user khusus 'admin' atau user dengan role 'admin'
  const isAuthorized = user.username === "admin" || user.role === "admin";
  
  if (!isAuthorized) {
    // Tampilkan pesan error akses dan arahkan ke dashboard pengguna
    toast({
      title: "Access Denied",
      description: "You don't have permission to access the admin area",
      variant: "destructive",
    });
    
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Your account doesn't have admin privileges. Contact the administrator if you believe this is an error.
          </p>
          <a 
            href="/" 
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </Route>
    );
  }

  // User admin terautentikasi, render komponen admin
  try {
    console.log("Rendering admin component for user:", user.username);
    
    return (
      <Route path={path}>
        <Component />
      </Route>
    );
  } catch (error) {
    console.error("Error rendering admin component:", error);
    
    toast({
      title: "Error",
      description: "There was an error loading the admin page",
      variant: "destructive",
    });
    
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground text-center max-w-md">
            There was an error loading the admin page. Please try again later.
          </p>
          <a 
            href="/" 
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </Route>
    );
  }
}