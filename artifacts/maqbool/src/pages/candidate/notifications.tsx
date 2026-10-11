import { useState } from "react";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { NotificationFeed } from "@/components/shared/notification-feed";

export default function CandidateNotifications() {
  const { user } = useAuth();
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const notifications = MOCK_NOTIFICATIONS
    .filter((n) => n.userId === user?.id)
    .map((n) => (readIds.has(n.id) ? { ...n, read: true } : n));

  return (
    <NotificationFeed
      items={notifications}
      description="Recent updates on interviews, applications, and messages."
      onRead={(id) => setReadIds((prev) => new Set(prev).add(id))}
      onReadAll={() => setReadIds(new Set(notifications.map((n) => n.id)))}
    />
  );
}
