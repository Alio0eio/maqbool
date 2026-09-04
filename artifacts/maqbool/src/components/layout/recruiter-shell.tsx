import React from "react";
import { Link } from "wouter";
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
import { RECRUITER_NOTIFICATIONS, MOCK_JOBS, MOCK_CANDIDATES } from "@/lib/mock-data";
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

  const q = query.trim().toLowerCase();
  const jobResults = q ? MOCK_JOBS.filter((j) => j.title.toLowerCase().includes(q)).slice(0, 4) : [];
  const candidateResults = q ? MOCK_CANDIDATES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 4) : [];
  const hasResults = jobResults.length > 0 || candidateResults.length > 0;

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
        className="w-full h-9 pl-9 pr-14 rounded-full border-0 bg-foreground/[0.045] text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:bg-white transition-colors"
      />
      <Kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]">⌘K</Kbd>
      {open && q && (
        <div className="absolute top-11 left-0 w-80 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-30">
          {hasResults ? (
            <>
              {jobResults.length > 0 && (
                <div className="py-1.5">
                  <p className="px-3 pt-1 pb-1 text-[11px] font-medium text-muted-foreground">Jobs</p>
                  {jobResults.map((job) => (
                    <Link
                      key={job.id}
                      href={`/recruiter/jobs/${job.id}/applicants`}
                      className="block px-3 py-1.5 text-sm hover:bg-foreground/[0.045] transition-colors"
                      onClick={() => setQuery("")}
                    >
                      {job.title}
                    </Link>
                  ))}
                </div>
              )}
              {candidateResults.length > 0 && (
                <div className="py-1.5 border-t border-border/70">
                  <p className="px-3 pt-1 pb-1 text-[11px] font-medium text-muted-foreground">Candidates</p>
                  {candidateResults.map((c) => (
                    <Link
                      key={c.id}
                      href={`/recruiter/candidates/${c.id}`}
                      className="block px-3 py-1.5 text-sm hover:bg-foreground/[0.045] transition-colors"
                      onClick={() => setQuery("")}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">No results for "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
}

export function RecruiterShell({ children }: { children: React.ReactNode }) {
  const unreadNotifications = RECRUITER_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <AppShell
      navGroups={NAV_GROUPS}
      roleLabel="Stratos Financial"
      profileHref="/recruiter/settings/company"
      notificationsHref="/recruiter/notifications"
      unreadNotifications={unreadNotifications}
      headerLeft={<RecruiterSearch />}
    >
      {children}
    </AppShell>
  );
}
