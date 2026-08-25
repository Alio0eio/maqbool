import React from "react";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { cn } from "@workspace/design-system/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { Button } from "@workspace/design-system/button";
import { ScrollArea } from "@workspace/design-system/scroll-area";
import {
  LayoutDashboard,
  Search,
  FileText,
  Bookmark,
  Calendar,
  MessageSquare,
  UserCircle,
  Bell,
  LogOut,
  ChevronDown,
  Upload,
  Settings
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { CommandPalette } from "@/components/shared/command-palette";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/design-system/dropdown-menu";

const CANDIDATE_NAV = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "Find Jobs", href: "/candidate/jobs", icon: Search },
  { label: "My Applications", href: "/candidate/dashboard", icon: FileText }, // Merged with dashboard conceptually
  { label: "Saved Jobs", href: "/candidate/saved", icon: Bookmark },
  { label: "Interviews", href: "/candidate/interviews", icon: Calendar },
  { label: "Messages", href: "/candidate/messages", icon: MessageSquare },
  { label: "Profile", href: "/candidate/profile", icon: UserCircle },
];

export function CandidateShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    setLocation("/");
  };

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-surface-bg overflow-hidden font-sans text-foreground">
      <CommandPalette />
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col h-full flex-shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
          <Link href="/candidate/dashboard" className="flex items-center gap-2 group outline-none">
            <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform shadow-sm">
              E
            </div>
            <span className="font-bold text-xl tracking-tight text-primary">EMPO</span>
          </Link>
        </div>
        
        <div className="p-4 border-b border-border flex-shrink-0">
          <Button className="w-full justify-start gap-2 shadow-sm" variant="default">
            <Upload className="w-4 h-4" />
            Upload Resume
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {CANDIDATE_NAV.map((item) => {
              // Exact match or prefix match
              const isActive = location === item.href || (item.href !== "/candidate/dashboard" && location.startsWith(`${item.href}/`));
              
              return (
                <Link key={item.label} href={item.href} className="outline-none block">
                  <span className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
                  )}>
                    <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "opacity-80")} />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-border flex-shrink-0 bg-surface-bg/50">
          <div className="flex items-center gap-3 p-2 rounded-md hover:bg-white transition-colors cursor-pointer group shadow-sm border border-transparent hover:border-border">
            <Avatar className="w-9 h-9 border border-border">
              <AvatarImage src={user.avatarUrl!} />
              <AvatarFallback className="bg-primary text-white">AR</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">Candidate</p>
            </div>
            <LogOut className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive" onClick={handleLogout} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-10 shadow-sm">
          <div className="flex flex-1" />
          
          <div className="flex items-center gap-4">
            <Link href="/candidate/notifications">
              <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
                <Bell className="w-5 h-5" />
              </Button>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 pl-4 border-l border-border cursor-pointer hover:bg-muted p-1 rounded-md transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatarUrl!} />
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-sm">
                <p className="font-medium leading-none text-foreground">{user.name}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
            </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/candidate/profile" className="flex items-center gap-2 cursor-pointer">
                    <UserCircle className="w-4 h-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/candidate/profile" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <ScrollArea className="flex-1 relative">
          <div className="p-6 md:p-8 max-w-[1280px] mx-auto min-h-full">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
