import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users, ClipboardList, BarChart, LogOut, 
  Settings, ChevronDown, Menu 
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { NotificationDropdown } from "@/components/notification/NotificationDropdown";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

// Sidebar navigation item
const NavItem = ({ href, icon, children, active, onClick }: NavItemProps) => {
  const [, navigate] = useLocation();
  
  return (
    <li>
      <Button
        variant={active ? "secondary" : "ghost"}
        className={`w-full justify-start mb-1 ${
          active ? "bg-primary/10 hover:bg-primary/20" : ""
        }`}
        onClick={() => {
          navigate(href);
          if (onClick) onClick();
        }}
      >
        {icon}
        <span className="ml-2">{children}</span>
      </Button>
    </li>
  );
};

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  // Get initials from user's full name
  const getInitials = () => {
    if (!user?.fullName) return "AD";
    
    return user.fullName
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  
  const navigationItems = [
    {
      label: "Projects",
      href: "/admin",
      icon: <ClipboardList className="h-4 w-4" />,
      active: location === "/admin",
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: <Users className="h-4 w-4" />,
      active: location === "/admin/users",
    },
    {
      label: "Analytics",
      href: "/admin/analytics",
      icon: <BarChart className="h-4 w-4" />,
      active: location === "/admin/analytics",
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-4 w-4" />,
      active: location === "/admin/settings",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-10">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto border-r bg-card">
          <div className="flex items-center justify-between flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-lg">PM</span>
              </div>
              <h1 className="ml-2 text-xl font-semibold">Admin Panel</h1>
            </div>
            <NotificationDropdown />
          </div>
          
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              <ul className="space-y-1">
                {navigationItems.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    active={item.active}
                  >
                    {item.label}
                  </NavItem>
                ))}
              </ul>
              
              <div className="mt-4 px-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Appearance</span>
                  <ThemeToggle />
                </div>
              </div>
            </nav>
          </div>
          
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                      <p className="font-medium">{user?.fullName || "Admin"}</p>
                      <p className="text-muted-foreground text-xs">{user?.email}</p>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-lg">PM</span>
            </div>
            <h1 className="ml-2 text-xl font-semibold">Admin Panel</h1>
          </div>
          
          <div className="flex items-center space-x-1">
            <NotificationDropdown />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-semibold text-lg">PM</span>
                      </div>
                      <h1 className="ml-2 text-xl font-semibold">Admin Panel</h1>
                    </div>
                  </div>
                  
                  <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                      {navigationItems.map((item) => (
                        <NavItem
                          key={item.href}
                          href={item.href}
                          icon={item.icon}
                          active={item.active}
                          onClick={closeMenu}
                        >
                          {item.label}
                        </NavItem>
                      ))}
                    </ul>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium">Appearance</span>
                        <ThemeToggle />
                      </div>
                    </div>
                  </nav>
                  
                  <div className="p-4 border-t mt-auto">
                    <div className="flex items-center mb-3">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-sm">
                        <p className="font-medium">{user?.fullName || "Admin"}</p>
                        <p className="text-muted-foreground text-xs">{user?.email}</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      className="w-full" 
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden md:ml-64">
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar pt-16 md:pt-0">
          <div className="py-6 px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}