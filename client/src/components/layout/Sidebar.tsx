import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

const NavItem = ({ href, icon, children, active }: NavItemProps) => {
  return (
    <Link href={href}>
      <button
        className={cn(
          "flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-md",
          active
            ? "bg-primary text-white"
            : "text-foreground hover:bg-muted"
        )}
      >
        <div className="w-5 h-5 mr-2">{icon}</div>
        {children}
      </button>
    </Link>
  );
};

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  // Get user initials for avatar
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="hidden md:flex md:w-64 flex-col fixed inset-y-0 border-r border-border bg-card">
      <div className="flex items-center h-16 px-4 border-b border-border">
        <span className="font-heading font-bold text-xl text-primary">DevTrack</span>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pt-5 pb-4">
        <nav className="flex-1 px-2 space-y-1">
          {/* User Profile */}
          <div className="flex items-center p-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
              <span className="font-medium">{initials}</span>
            </div>
            <div className="ml-3">
              <p className="font-medium text-sm">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <NavItem 
            href="/" 
            icon={<LayoutDashboard size={18} />} 
            active={location === "/"}
          >
            Dashboard
          </NavItem>
          <NavItem 
            href="/projects" 
            icon={<ClipboardList size={18} />} 
            active={location.startsWith("/projects")}
          >
            Projects
          </NavItem>
          <NavItem 
            href="/messages" 
            icon={<MessageSquare size={18} />} 
            active={location.startsWith("/messages")}
          >
            Messages
          </NavItem>
          <NavItem 
            href="/payments" 
            icon={<CreditCard size={18} />} 
            active={location.startsWith("/payments")}
          >
            Payments
          </NavItem>
          <NavItem 
            href="/settings" 
            icon={<Settings size={18} />} 
            active={location.startsWith("/settings")}
          >
            Settings
          </NavItem>

          <div className="pt-6 mt-6 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-accent hover:bg-muted w-full text-left"
            >
              <LogOut size={18} className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
