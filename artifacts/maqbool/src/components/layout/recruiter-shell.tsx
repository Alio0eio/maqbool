import React from "react";
import { Kbd } from "@workspace/design-system/kbd";
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
  Search,
} from "lucide-react";
import { useRecruiterContext } from "@/lib/recruiter-api";
import { AppShell, type AppNavGroup } from "./app-shell";

const NAV_GROUPS: AppNavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
      {
        label: "Jobs",
        href: "/recruiter/jobs",
        icon: Briefcase,
        match: (location) => location.startsWith("/recruiter/jobs"),
      },
      {
        label: "Candidates",
        href: "/recruiter/candidates",
        icon: Users,
        match: (location) => location.startsWith("/recruiter/candidates"),
      },
      { label: "Pipeline", href: "/recruiter/pipeline", icon: KanbanSquare },
      {
        label: "Interviews",
        href: "/recruiter/interviews",
        icon: Calendar,
        match: (location) => location.startsWith("/recruiter/interviews"),
      },
      { label: "Offers", href: "/recruiter/offers", icon: Award },
      { label: "Messages", href: "/recruiter/messages", icon: MessageSquare },
      { label: "Reports", href: "/recruiter/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Company", href: "/recruiter/settings/company", icon: Building2 },
      { label: "Enterprise", href: "/recruiter/settings/enterprise", icon: Settings },
      { label: "Billing", href: "/recruiter/settings/billing", icon: CreditCard },
    ],
  },
];

function RecruiterSearch() {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative w-full max-w-sm hidden md:block">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search jobs, candidates, or interviews…"
        className="w-full h-10 pl-10 pr-14 rounded-full border border-border/70 bg-white/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] text-sm placeholder:text-muted-foreground focus:outline-none focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10 focus:bg-white transition-[box-shadow,border-color,background-color] hover:bg-white"
      />
      <Kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px]">⌘K</Kbd>
      {open && query.trim() && (
        <div className="absolute top-11 left-0 w-80 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-30">
          <p className="px-3 py-2.5 text-sm text-muted-foreground">Live search is not available yet.</p>
        </div>
      )}
    </div>
  );
}

export function RecruiterShell({ children }: { children: React.ReactNode }) {
  const context = useRecruiterContext();
  const unreadNotifications = 0;

  if (context.isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading workspace…</div>;
  }
  if (context.isError) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-destructive">Unable to load recruiter workspace.</div>;
  }
  if (!context.data?.activeCompany) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">No company workspace</h1>
          <p className="text-sm text-muted-foreground">
            This recruiter account has no active company membership. Ask a workspace administrator to send you an invitation.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AppShell
      navGroups={NAV_GROUPS}
      roleLabel={context.data.activeCompany.name}
      profileHref="/recruiter/settings/company"
      notificationsHref="/recruiter/notifications"
      unreadNotifications={unreadNotifications}
      headerLeft={<RecruiterSearch />}
    >
      {children}
    </AppShell>
  );
}
