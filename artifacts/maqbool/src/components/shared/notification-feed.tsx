import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Bell, Briefcase, CheckCheck, DollarSign, Info, Mail, MessageSquare, Video } from "lucide-react";
import { Button } from "@workspace/design-system/button";
import { cn } from "@workspace/design-system/utils";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";
import { FilterTabs } from "./filter-tabs";

export interface FeedNotification {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  createdAt: string;
  read: boolean;
  actionUrl?: string | null;
}

const TYPE_META: Record<string, { icon: React.ElementType; tone: string }> = {
  application_update: { icon: Briefcase, tone: "bg-info/10 text-info" },
  interview_invite: { icon: Video, tone: "bg-primary/[0.09] text-primary" },
  offer_received: { icon: DollarSign, tone: "bg-success/10 text-success" },
  message: { icon: MessageSquare, tone: "bg-warning/10 text-warning" },
  system: { icon: Info, tone: "bg-muted text-muted-foreground" },
};

function dayLabel(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return "Earlier";
}

interface FeedProps {
  items: FeedNotification[];
  description?: string;
  onRead: (id: number) => void;
  onReadAll: () => void;
}

/** Notification list shared by both roles: filter, day-grouped, unread-first
 *  styling, and a one-tap action link where the notification has one. */
export function NotificationFeed({ items, description, onRead, onReadAll }: FeedProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const unread = items.filter((n) => !n.read).length;
  const shown = [...items]
    .filter((n) => filter === "all" || !n.read)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const groups = ["Today", "Yesterday", "Earlier"]
    .map((label) => ({ label, rows: shown.filter((n) => dayLabel(n.createdAt) === label) }))
    .filter((g) => g.rows.length > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Notifications"
        eyebrow={unread > 0 ? `${unread} unread` : "All caught up"}
        description={description}
        actions={
          <Button data-testid="btn-mark-all-read" variant="outline" className="gap-2" disabled={unread === 0} onClick={onReadAll}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        }
      />

      <FilterTabs<"all" | "unread">
        aria-label="Filter notifications"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", count: items.length },
          { value: "unread", label: "Unread", count: unread },
        ]}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          description={filter === "unread" ? "You're all caught up — nothing new to review." : "Notifications will appear here as activity happens."}
        />
      ) : (
        groups.map((g) => (
          <section key={g.label} aria-label={g.label}>
            <h2 className="text-[12.5px] font-semibold text-muted-foreground mb-2.5 px-1">{g.label}</h2>
            <ul className="space-y-2">
              {g.rows.map((n, i) => {
                const meta = TYPE_META[n.type] ?? { icon: n.type === "interview_invite" ? AlertCircle : Mail, tone: "bg-muted text-muted-foreground" };
                const Icon = meta.icon;
                return (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, type: "spring", bounce: 0, duration: 0.35 }}
                  >
                    <div
                      data-testid={`notification-${n.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onRead(n.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRead(n.id);
                        }
                      }}
                      className={cn(
                        "group relative flex items-start gap-4 rounded-2xl border p-4 cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                        n.read
                          ? "border-border/60 bg-white/60 hover:bg-white"
                          : "border-primary/20 bg-white shadow-[0_6px_20px_-10px_hsl(var(--primary)/0.35)]",
                      )}
                    >
                      {!n.read && <span aria-hidden className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-primary" />}
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", meta.tone)}>
                        <Icon className="w-[18px] h-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className={cn("text-[14px] tracking-[-0.01em]", n.read ? "font-medium text-foreground/80" : "font-semibold text-foreground")}>
                            {n.title}
                            {!n.read && <span className="sr-only"> (unread)</span>}
                          </p>
                          <time dateTime={n.createdAt} className="shrink-0 text-[11.5px] text-muted-foreground tabular-nums">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </time>
                        </div>
                        <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                        {n.actionUrl && (
                          <Link
                            href={n.actionUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline"
                          >
                            View <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
