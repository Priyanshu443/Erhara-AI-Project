import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "My Tasks", href: "/my-tasks", icon: CheckSquare },
  ];

  const handleSignOut = () => {
    signOut(() => setLocation("/"));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-muted/20">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
            TF
          </div>
          <span className="font-bold text-lg tracking-tight">TaskFlow</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'flex' : 'hidden'} 
        md:flex flex-col w-full md:w-64 border-r bg-card fixed md:sticky top-[65px] md:top-0 h-[calc(100dvh-65px)] md:h-[100dvh] z-40
      `}>
        <div className="hidden md:flex h-16 items-center px-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              TF
            </div>
            <span className="font-bold text-xl tracking-tight">TaskFlow</span>
          </div>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
            Workspace
          </div>
          {navigation.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                  flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer
                  ${isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                `}>
                  <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t">
          <Link href="/settings">
            <div 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
              flex items-center gap-3 px-3 py-2 rounded-md mb-2 cursor-pointer
              ${location === "/settings" 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"}
            `}>
              <Settings className="h-5 w-5" />
              Settings
            </div>
          </Link>
          
          <div className="flex items-center gap-3 px-3 py-2 mt-4">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>{getInitials(user?.fullName || user?.firstName || "U")}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{user?.fullName || user?.firstName}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}