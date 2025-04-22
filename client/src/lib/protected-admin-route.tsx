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
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Debugging untuk melihat status user
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("User not authenticated, redirecting to login");
    } else if (!isLoading && user && user.role !== "admin") {
      console.log("User authenticated but not admin:", user);
    } else if (!isLoading && user && user.role === "admin") {
      console.log("Admin user authenticated:", user);
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    // Tampilkan pesan dan arahkan ke halaman login
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <AlertTriangle className="h-12 w-12 text-warning" />
          <h1 className="text-xl font-bold">Login Required</h1>
          <p className="text-muted-foreground text-center max-w-md">
            You need to log in to access the admin dashboard.
          </p>
          <a 
            href="/auth" 
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </a>
        </div>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (user.role !== "admin") {
    // Tampilkan pesan error akses dan arahkan ke dashboard pengguna
    toast({
      title: "Access Denied",
      description: "You don't have permission to access the admin area",
      variant: "destructive",
    });
    
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
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
        <Redirect to="/" />
      </Route>
    );
  }

  try {
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
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
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