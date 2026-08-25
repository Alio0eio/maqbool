import React, { useState } from "react";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";
import { EmptyState } from "@/components/shared/empty-state";
import { CardContent } from "@workspace/design-system/card";
import { Button } from "@workspace/design-system/button";
import { Badge } from "@workspace/design-system/badge";
import { Bell, ArrowRight, AlertCircle, Mail, Gift, MessageCircle, CheckCheck } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@workspace/design-system/utils";

const ICON_BY_TYPE: Record<string, React.ElementType> = {
  interview_invite: AlertCircle,
  application_update: Mail,
  offer_received: Gift,
  message: MessageCircle,
  system: Bell,
};

export default function CandidateNotifications() {
  const { user } = useAuth();
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const notifications = MOCK_NOTIFICATIONS
    .filter((notification) => notification.userId === user?.id)
    .map((n) => (readIds.has(n.id) ? { ...n, read: true } : n));
  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }

  function markRead(id: number) {
    setReadIds((prev) => new Set(prev).add(id));
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <PageHeader
        title="Notifications"
        eyebrow={unreadCount > 0 ? `${unreadCount} UNREAD` : "ALL CAUGHT UP"}
        description="Recent updates on interviews, applications, and messages."
        actions={
          <Button
            data-testid="btn-mark-all-read"
            variant="outline"
            className="shadow-sm gap-2"
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        }
      />

      <div className="grid gap-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const Icon = ICON_BY_TYPE[notification.type] || Bell;
            return (
              <ViewfinderCard
                key={notification.id}
                data-testid={`notification-${notification.id}`}
                className={cn("shadow-sm cursor-pointer", !notification.read && "border-primary/30")}
                onClick={() => markRead(notification.id)}
              >
                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-display font-semibold text-foreground">{notification.title}</h2>
                        {!notification.read && <Badge variant="destructive">Unread</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-mono text-xs">{new Date(notification.createdAt).toLocaleString()}</span>
                    {notification.actionUrl ? (
                      <Link href={notification.actionUrl} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          View <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </CardContent>
              </ViewfinderCard>
            );
          })
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Notifications will appear here as activity happens."
          />
        )}
      </div>
    </div>
  );
}
