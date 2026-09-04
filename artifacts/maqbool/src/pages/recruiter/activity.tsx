import { useState } from 'react';
import { Link } from 'wouter';
import { Briefcase } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@workspace/design-system/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@workspace/design-system/button';
import { cn } from '@workspace/design-system/utils';
import { MOCK_ACTIVITY } from '@/lib/mock-data';

const CATEGORY: Record<string, string> = {
  application_stage_change: 'Applications',
  candidate_shortlisted: 'Applications',
  application_rejected: 'Applications',
  interview_completed: 'Interviews',
  interview_scheduled: 'Interviews',
  offer_accepted: 'Offers',
  job_published: 'Jobs',
};

const FILTERS = ['All', 'Applications', 'Interviews', 'Offers', 'Jobs'];

export default function TeamActivity() {
  const [filter, setFilter] = useState('All');

  const filtered = MOCK_ACTIVITY
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((a) => filter === 'All' || CATEGORY[a.type] === filter);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <PageHeader
        title="Team Activity Feed"
        eyebrow={`${MOCK_ACTIVITY.length} events · ${filtered.length} shown`}
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
              'px-3 py-1.5 rounded-full text-[12.5px] font-medium whitespace-nowrap transition-colors',
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
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {filtered.map((activity, i) => (
                <div key={activity.id} className="p-4 flex gap-4">
                  <div className="relative mt-1.5 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary relative z-10" />
                    {i !== filtered.length - 1 && (
                      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-px h-full bg-border/70" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] text-foreground leading-snug">{activity.description}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      <span className="text-[12px] text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[12px] text-muted-foreground">·</span>
                      <span className="text-[12px] font-medium text-muted-foreground">{CATEGORY[activity.type] ?? 'Activity'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
