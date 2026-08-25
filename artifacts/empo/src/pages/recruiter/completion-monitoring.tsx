import { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@workspace/design-system/card';
import { Button } from '@workspace/design-system/button';
import { toast } from '@workspace/design-system/hooks/use-toast';

const INITIAL_COMPLETION_DATA = [
  { jobTitle: 'Senior Product Designer', total: 5, completed: 4, pending: 1, deadline: '2026-07-25' },
  { jobTitle: 'Frontend Engineer', total: 6, completed: 2, pending: 4, deadline: '2026-07-28' },
  { jobTitle: 'Data Scientist', total: 4, completed: 0, pending: 4, deadline: '2026-08-01' },
];

export default function CompletionMonitoring() {
  const [rows, setRows] = useState(INITIAL_COMPLETION_DATA);

  function handleRemind(jobTitle: string) {
    toast({ title: 'Reminder sent', description: `Pending candidates for ${jobTitle} were nudged to finish their interview.` });
  }

  function handleExtend(jobTitle: string) {
    setRows(prev => prev.map(r => {
      if (r.jobTitle !== jobTitle) return r;
      const extended = new Date(r.deadline);
      extended.setDate(extended.getDate() + 3);
      return { ...r, deadline: extended.toISOString().slice(0, 10) };
    }));
    toast({ title: 'Deadline extended', description: `${jobTitle} candidates now have 3 extra days to complete their interview.` });
  }

  // Derived from the real per-job rows below, not hardcoded — so the
  // summary tiles can never drift out of sync with the table.
  const totalInvited = rows.reduce((sum, r) => sum + r.total, 0);
  const totalCompleted = rows.reduce((sum, r) => sum + r.completed, 0);
  const totalPending = rows.reduce((sum, r) => sum + r.pending, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview Completion Monitor"
        eyebrow={`${rows.length} ACTIVE ROLES · ${totalPending} PENDING`}
        description="Track async interview completion rates across all active roles"
      />

      {/* Summary — no per-invite dates in the mock data to derive an honest
          trend from, so these use helperText rather than a fabricated sparkline. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Invited" value={totalInvited} icon={Clock} helperText="Across all active roles" />
        <StatCard label="Completed" value={totalCompleted} icon={CheckCircle} helperText={`${Math.round((totalCompleted / totalInvited) * 100)}% completion rate`} />
        <StatCard label="Pending" value={totalPending} icon={AlertCircle} helperText="Awaiting candidate response" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Clock} title="No async interviews in flight" description="Once you invite candidates to an async interview, completion progress will show up here." />
      ) : (
        <div className="space-y-4">
          {rows.map(item => {
            const rate = Math.round((item.completed / item.total) * 100);
            const isUrgent = new Date(item.deadline) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
            return (
              <Card key={item.jobTitle} className="border-border shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{item.jobTitle}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock size={12} />
                      <span className="font-mono">
                        Deadline: {new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {isUrgent && <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-full font-medium">Urgent</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-display font-bold text-foreground font-mono">{rate}%</div>
                    <div className="text-xs text-muted-foreground font-mono">{item.completed}/{item.total} completed</div>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${rate}%`, backgroundColor: rate >= 70 ? 'hsl(var(--success))' : rate >= 40 ? '#f59e0b' : '#ef4444' }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`btn-remind-${item.jobTitle}`}
                    className="text-xs"
                    disabled={item.pending === 0}
                    onClick={() => handleRemind(item.jobTitle)}
                  >
                    <RefreshCw size={12} /> Send Reminder
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`btn-extend-${item.jobTitle}`}
                    className="text-xs"
                    onClick={() => handleExtend(item.jobTitle)}
                  >
                    <Clock size={12} /> Extend Deadline
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
