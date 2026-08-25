import React from "react";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { cn } from "@workspace/design-system/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { Button } from "@workspace/design-system/button";
import { ScrollArea } from "@workspace/design-system/scroll-area";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  KanbanSquare,
  Calendar,
  Award,
  MessageSquare,
  BarChart3,
  Settings,
  Building2,
  CreditCard,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  UserCircle
} from "lucide-react";
import { RECRUITER_NOTIFICATIONS, MOCK_JOBS, MOCK_CANDIDATES } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { CommandPalette } from "@/components/shared/command-palette";
import { Kbd } from "@workspace/design-system/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/design-system/dropdown-menu";

const RECRUITER_NAV = [
  { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/recruiter/jobs", icon: Briefcase },
  { label: "Candidates", href: "/recruiter/candidates", icon: Users },
  { label: "Pipeline", href: "/recruiter/pipeline", icon: KanbanSquare },
  { label: "Interviews", href: "/recruiter/interviews", icon: Calendar },
  { label: "Offers", href: "/recruiter/offers", icon: Award },
  { label: "Messages", href: "/recruiter/messages", icon: MessageSquare },
  { label: "Reports", href: "/recruiter/reports", icon: BarChart3 },
];

const SETTINGS_NAV = [
  { label: "Company", href: "/recruiter/settings/company", icon: Building2 },
  { label: "Enterprise", href: "/recruiter/settings/enterprise", icon: Settings },
  { label: "Billing", href: "/recruiter/settings/billing", icon: CreditCard },
];

export function RecruiterShell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const unreadNotifications = RECRUITER_NOTIFICATIONS.filter(n => !n.read).length;
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);

  const handleLogout = () => {
    signOut();
    setLocation("/");
  };

  const q = query.trim().toLowerCase();
  const jobResults = q ? MOCK_JOBS.filter(j => j.title.toLowerCase().includes(q)).slice(0, 4) : [];
  const candidateResults = q ? MOCK_CANDIDATES.filter(c => c.name.toLowerCase().includes(q)).slice(0, 4) : [];
  const hasResults = jobResults.length > 0 || candidateResults.length > 0;

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-surface-bg overflow-hidden font-sans">
      <CommandPalette />
      {/* Sidebar */}
      <aside className="group/recruiter-sidebar relative w-[68px] bg-transparent flex flex-col h-full flex-shrink-0 text-primary z-20 overflow-visible">
        <div className="absolute inset-y-0 left-0 flex w-[68px] flex-col overflow-hidden border-r border-border bg-white shadow-sm transition-[width] duration-200 ease-out group-hover/recruiter-sidebar:w-56 group-focus-within/recruiter-sidebar:w-56">
        <div className="h-16 flex items-center justify-center border-b border-border flex-shrink-0">
          <Link href="/recruiter/dashboard" aria-label="EMPO dashboard" className="flex items-center outline-none">
            <div className="w-8 h-8 rounded-md bg-primary text-white flex items-center justify-center font-bold text-xl shadow-sm transition-transform hover:scale-105">
              E
            </div>
          </Link>
        </div>
        
        <div className="flex-1 py-4 overflow-hidden">
          <nav className="px-2 space-y-1">
            {RECRUITER_NAV.map((item) => {
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className="outline-none block h-10">
                  <span className={cn(
                    "flex h-10 w-full items-center gap-3 overflow-hidden rounded-md px-3 text-sm font-medium transition-colors duration-200 outline-none",
                    isActive 
                      ? "bg-primary text-white shadow-sm" 
                      : "text-muted-foreground hover:bg-muted hover:text-primary"
                  )}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate opacity-0 transition-opacity duration-150 group-hover/recruiter-sidebar:opacity-100 group-focus-within/recruiter-sidebar:opacity-100">{item.label}</span>
                  </span>
                </Link>
              );
            })}

            <div className="my-4 mx-2 border-t border-border" />
            {SETTINGS_NAV.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className="outline-none block h-10">
                  <span className={cn(
                    "flex h-10 w-full items-center gap-3 overflow-hidden rounded-md px-3 text-sm font-medium transition-colors duration-200 outline-none",
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-primary"
                  )}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate opacity-0 transition-opacity duration-150 group-hover/recruiter-sidebar:opacity-100 group-focus-within/recruiter-sidebar:opacity-100">{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-2 border-t border-border flex-shrink-0">
          <div className="relative h-11">
            <div className="flex h-11 w-full items-center gap-3 overflow-hidden rounded-md p-1.5 transition-colors duration-200 group-hover/recruiter-sidebar:bg-muted group-focus-within/recruiter-sidebar:bg-muted cursor-pointer">
            <Avatar className="w-8 h-8 shrink-0 border border-border">
              <AvatarImage src={user.avatarUrl!} />
              <AvatarFallback className="bg-primary text-white">SJ</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 opacity-0 transition-opacity duration-150 group-hover/recruiter-sidebar:opacity-100 group-focus-within/recruiter-sidebar:opacity-100">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">Stratos Financial</p>
            </div>
            <LogOut aria-label="Sign out" className="w-4 h-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/recruiter-sidebar:opacity-100 group-focus-within/recruiter-sidebar:opacity-100" onClick={handleLogout} />
            </div>
          </div>
        </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative w-96 hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                placeholder="Search jobs, candidates, or interviews..."
                className="w-full h-9 pl-9 pr-14 rounded-md border border-input bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <Kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]">⌘K</Kbd>
              {searchOpen && q && (
                <div className="absolute top-11 left-0 w-full bg-card border border-border rounded-md shadow-lg overflow-hidden z-30">
                  {hasResults ? (
                    <>
                      {jobResults.length > 0 && (
                        <div className="py-1">
                          <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Jobs</p>
                          {jobResults.map(job => (
                            <Link
                              key={job.id}
                              href={`/recruiter/jobs/${job.id}/applicants`}
                              className="block px-3 py-1.5 text-sm hover-elevate"
                              onClick={() => setQuery("")}
                            >
                              {job.title}
                            </Link>
                          ))}
                        </div>
                      )}
                      {candidateResults.length > 0 && (
                        <div className="py-1 border-t border-border">
                          <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Candidates</p>
                          {candidateResults.map(c => (
                            <Link
                              key={c.id}
                              href={`/recruiter/candidates/${c.id}`}
                              className="block px-3 py-1.5 text-sm hover-elevate"
                              onClick={() => setQuery("")}
                            >
                              {c.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No results for "{query}"</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/recruiter/notifications" className="outline-none">
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white" />
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 pl-4 border-l border-border cursor-pointer hover:bg-muted p-1 rounded-md transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatarUrl!} />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-sm">
                <p className="font-medium leading-none text-foreground">{user.name}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
            </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/recruiter/settings/company" className="flex items-center gap-2 cursor-pointer">
                    <UserCircle className="w-4 h-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/recruiter/settings/company" className="flex items-center gap-2 cursor-pointer">
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
