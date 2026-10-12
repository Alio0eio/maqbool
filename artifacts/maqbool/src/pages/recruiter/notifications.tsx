import { useState } from "react";
import { RECRUITER_NOTIFICATIONS } from "@/lib/mock-data";
import { NotificationFeed } from "@/components/shared/notification-feed";

export default function RecruiterNotifications() {
  const [notifications, setNotifications] = useState(RECRUITER_NOTIFICATIONS);

  return (
    <NotificationFeed
      items={notifications}
      description="Applications, interviews, offers and messages across your jobs."
      onRead={(id) => setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)))}
      onReadAll={() => setNotifications((n) => n.map((x) => ({ ...x, read: true })))}
    />
  );
}
