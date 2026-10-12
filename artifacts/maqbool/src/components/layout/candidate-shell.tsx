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
import { Link } from "wouter";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
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
  const { user } = useAuth();
  const unreadNotifications = MOCK_NOTIFICATIONS.filter((n) => n.userId === user?.id && !n.read).length;

  return (
    <AppShell
      navGroups={NAV_GROUPS}
      roleLabel="Candidate"
      profileHref="/candidate/profile"
      notificationsHref="/candidate/notifications"
      unreadNotifications={unreadNotifications}
      sidebarExtra={
        <Button asChild className="w-full justify-start gap-2" variant="secondary" size="sm">
          <Link href="/candidate/profile">
            <Upload className="w-4 h-4" />
            Update résumé
          </Link>
        </Button>
      }
    >
      {children}
    </AppShell>
  );
}
