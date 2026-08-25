import { useState } from 'react';
import { Link } from 'wouter';
import { Briefcase, Users, Calendar, Gift, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@workspace/design-system/button';
import { cn } from '@workspace/design-system/utils';
import { MOCK_ACTIVITY } from '@/lib/mock-data';

const CATEGORY: Record<string, { label: string; icon: any; color: string }> = {
  application_stage_change: { label: 'Applications', icon: Users, color: 'text-blue-600 bg-blue-50' },
  candidate_shortlisted: { label: 'Applications', icon: Users, color: 'text-blue-600 bg-blue-50' },
  application_rejected: { label: 'Applications', icon: XCircle, color: 'text-red-500 bg-red-50' },
  interview_completed: { label: 'Interviews', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
  interview_scheduled: { label: 'Interviews', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
  offer_accepted: { label: 'Offers', icon: Gift, color: 'text-emerald-600 bg-emerald-50' },
  job_published: { label: 'Jobs', icon: Briefcase, color: 'text-amber-600 bg-amber-50' },
};

const FILTERS = ['All', 'Applications', 'Interviews', 'Offers', 'Jobs'];

export default function TeamActivity() {
  const [filter, setFilter] = useState('All');

  const filtered = MOCK_ACTIVITY
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((a) => filter === 'All' || CATEGORY[a.type]?.label === filter);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Team Activity Feed"
        eyebrow={`${MOCK_ACTIVITY.length} EVENTS · ${filtered.length} SHOWN`}
        description="Everything happening across your hiring pipeline."
        actions={
          <Link href="/recruiter/dashboard">
            <Button variant="outline" size="sm">Back to dashboard</Button>
          </Link>
        }
      />

      <div className="flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            data-testid={`filter-${f.toLowerCase()}`}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No activity in this category"
          description="Switch filters or check back after your team takes more actions."
        />
      ) : (
        <ViewfinderCard className="border-border shadow-sm divide-y divide-border overflow-hidden">
          {filtered.map((activity) => {
            const meta = CATEGORY[activity.type] ?? { label: 'Activity', icon: Briefcase, color: 'text-gray-600 bg-gray-50' };
            const Icon = meta.icon;
            return (
              <div key={activity.id} className="p-4 flex items-start gap-4">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', meta.color)}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(activity.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </ViewfinderCard>
      )}
    </div>
  );
}
