import { useState } from "react";
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
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, icon, children, active, onClick }: NavItemProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md",
          active
            ? "bg-primary text-white"
            : "text-foreground hover:bg-muted"
        )}
        onClick={onClick}
      >
        <div className="w-5 h-5 mr-2">{icon}</div>
        {children}
      </a>
    </Link>
  );
};

export function MobileMenu() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    setOpen(false);
  };

  if (!user) return null;

  // Get user initials for avatar
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const closeMenu = () => setOpen(false);

  return (
    <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-white border-b border-border">
      <div className="flex items-center justify-between h-16 px-4">
        <span className="font-heading font-bold text-xl text-primary">DevTrack</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                <span className="font-heading font-bold text-xl text-primary">DevTrack</span>
                <Button variant="ghost" size="icon" onClick={closeMenu}>
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pt-5 pb-4">
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
                    onClick={closeMenu}
                  >
                    Dashboard
                  </NavItem>
                  <NavItem 
                    href="/projects" 
                    icon={<ClipboardList size={18} />} 
                    active={location.startsWith("/projects")}
                    onClick={closeMenu}
                  >
                    Projects
                  </NavItem>
                  <NavItem 
                    href="/messages" 
                    icon={<MessageSquare size={18} />} 
                    active={location.startsWith("/messages")}
                    onClick={closeMenu}
                  >
                    Messages
                  </NavItem>
                  <NavItem 
                    href="/payments" 
                    icon={<CreditCard size={18} />} 
                    active={location.startsWith("/payments")}
                    onClick={closeMenu}
                  >
                    Payments
                  </NavItem>
                  <NavItem 
                    href="/settings" 
                    icon={<Settings size={18} />} 
                    active={location.startsWith("/settings")}
                    onClick={closeMenu}
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
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
