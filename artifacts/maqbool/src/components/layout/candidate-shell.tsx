import React from "react";
import { Button } from "@workspace/design-system/button";
import {
  LayoutDashboard,
  Search,
  Bookmark,
  Calendar,
  MessageSquare,
  UserCircle,
  Upload,
} from "lucide-react";
import { AppShell, type AppNavGroup } from "./app-shell";

const NAV_GROUPS: AppNavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
      {
        label: "Find Jobs",
        href: "/candidate/jobs",
        icon: Search,
        match: (location) => location.startsWith("/candidate/jobs") || location.startsWith("/candidate/apply"),
      },
      { label: "Saved Jobs", href: "/candidate/saved", icon: Bookmark },
      {
        label: "Interviews",
        href: "/candidate/interviews",
        icon: Calendar,
        match: (location) => location.startsWith("/candidate/interviews"),
      },
      { label: "Messages", href: "/candidate/messages", icon: MessageSquare },
      { label: "Profile", href: "/candidate/profile", icon: UserCircle },
    ],
  },
];

export function CandidateShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      navGroups={NAV_GROUPS}
      roleLabel="Candidate"
      profileHref="/candidate/profile"
      notificationsHref="/candidate/notifications"
      sidebarExtra={
        <Button className="w-full justify-start gap-2" variant="secondary" size="sm">
          <Upload className="w-4 h-4" />
          Upload résumé
        </Button>
      }
    >
      {children}
    </AppShell>
  );
}
