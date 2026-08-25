import { useState } from 'react';
import { Bell, CheckCheck, Briefcase, Video, DollarSign, MessageSquare, Info } from 'lucide-react';
import { RECRUITER_NOTIFICATIONS } from '@/lib/mock-data';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@workspace/design-system/button';
import { cn } from '@workspace/design-system/utils';

const TYPE_ICON: Record<string, React.ElementType> = { application_update: Briefcase, interview_invite: Video, offer_received: DollarSign, message: MessageSquare, system: Info };
const TYPE_COLOR: Record<string, string> = { application_update: 'bg-blue-50 text-blue-600', interview_invite: 'bg-purple-50 text-purple-600', offer_received: 'bg-emerald-50 text-emerald-600', message: 'bg-amber-50 text-amber-600', system: 'bg-gray-50 text-gray-600' };

export default function RecruiterNotifications() {
  const [notifications, setNotifications] = useState(RECRUITER_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const filtered = notifications.filter(n => filter === 'all' || !n.read);

  function markAllRead() { setNotifications(n => n.map(x => ({ ...x, read: true }))); }
  function markRead(id: number) { setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x)); }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Notifications"
        eyebrow={unreadCount > 0 ? `${unreadCount} UNREAD` : "ALL CAUGHT UP"}
        actions={
          <Button
            data-testid="btn-mark-all-read"
            variant="outline"
            className="gap-2"
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            <CheckCheck size={15} /> Mark all read
          </Button>
        }
      />

      <div className="flex gap-1">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} data-testid={`filter-${f}`} onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',
              filter === f ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
            )}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(n => {
          const Icon = TYPE_ICON[n.type] ?? Bell;
          const color = TYPE_COLOR[n.type] ?? 'bg-gray-50 text-gray-600';
          return (
            <ViewfinderCard
              key={n.id}
              data-testid={`notification-${n.id}`}
              className={cn('shadow-sm p-4 cursor-pointer', !n.read ? 'border-primary/20' : 'border-border')}
              onClick={() => markRead(n.id)}
            >
              <div className="flex items-start gap-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn('text-sm font-display font-medium', !n.read ? 'text-foreground' : 'text-muted-foreground')}>{n.title}</span>
                    {!n.read && <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  <span className="text-xs text-muted-foreground mt-1 block font-mono">
                    {new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </ViewfinderCard>
          );
        })}
        {filtered.length === 0 && (
          <EmptyState
            icon={Bell}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            description={filter === 'unread' ? "You're all caught up — nothing new to review." : 'Notifications will appear here as activity happens.'}
          />
        )}
      </div>
    </div>
  );
}
