import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@workspace/design-system/command";
import { useAuth } from "@/lib/auth";
import { MOCK_JOBS, MOCK_CANDIDATES } from "@/lib/mock-data";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  KanbanSquare,
  Calendar,
  Award,
  MessageSquare,
  BarChart3,
  Search as SearchIcon,
  Bookmark,
  UserCircle,
} from "lucide-react";

const RECRUITER_PAGES = [
  { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/recruiter/jobs", icon: Briefcase },
  { label: "Candidates", href: "/recruiter/candidates", icon: Users },
  { label: "Pipeline", href: "/recruiter/pipeline", icon: KanbanSquare },
  { label: "Interviews", href: "/recruiter/interviews", icon: Calendar },
  { label: "Offers", href: "/recruiter/offers", icon: Award },
  { label: "Messages", href: "/recruiter/messages", icon: MessageSquare },
  { label: "Reports", href: "/recruiter/reports", icon: BarChart3 },
];

const CANDIDATE_PAGES = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "Find Jobs", href: "/candidate/jobs", icon: SearchIcon },
  { label: "Saved Jobs", href: "/candidate/saved", icon: Bookmark },
  { label: "Interviews", href: "/candidate/interviews", icon: Calendar },
  { label: "Messages", href: "/candidate/messages", icon: MessageSquare },
  { label: "Profile", href: "/candidate/profile", icon: UserCircle },
];

/** Global ⌘K / Ctrl+K palette. Mount once per shell (role-aware). */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { role } = useAuth();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!role) return null;

  const pages = role === "recruiter" ? RECRUITER_PAGES : CANDIDATE_PAGES;
  const go = (href: string) => {
    setOpen(false);
    setLocation(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to a page, job, or candidate…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages.map((p) => (
            <CommandItem key={p.href} onSelect={() => go(p.href)}>
              <p.icon className="mr-2 h-4 w-4" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {role === "recruiter" && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Jobs">
              {MOCK_JOBS.slice(0, 6).map((job) => (
                <CommandItem key={job.id} onSelect={() => go(`/recruiter/jobs/${job.id}/applicants`)}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  {job.title}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Candidates">
              {MOCK_CANDIDATES.slice(0, 6).map((c) => (
                <CommandItem key={c.id} onSelect={() => go(`/recruiter/candidates/${c.id}`)}>
                  <Users className="mr-2 h-4 w-4" />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
