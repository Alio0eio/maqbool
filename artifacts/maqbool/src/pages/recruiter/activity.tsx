import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Award, Briefcase, Users, Video } from 'lucide-react';
import { FilterTabs } from '@/components/shared/filter-tabs';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@workspace/design-system/button';
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
const CATEGORY_ICON: Record<string, React.ElementType> = {
  Applications: Users,
  Interviews: Video,
  Offers: Award,
  Jobs: Briefcase,
};

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

      <FilterTabs<string>
        aria-label="Filter activity"
        value={filter}
        onChange={setFilter}
        options={FILTERS.map((f) => ({ value: f, label: f }))}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No activity in this category"
          description="Switch filters or check back after your team takes more actions."
        />
      ) : (
        <ol className="relative space-y-3 before:absolute before:left-[19px] before:top-3 before:bottom-3 before:w-px before:bg-border">
          {filtered.map((activity, i) => {
            const category = CATEGORY[activity.type] ?? 'Activity';
            const Icon = CATEGORY_ICON[category] ?? Briefcase;
            return (
              <motion.li
                key={activity.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, type: 'spring', bounce: 0, duration: 0.4 }}
                className="relative flex gap-4"
              >
                <span className="relative z-10 w-10 h-10 rounded-full bg-white border border-border/70 shadow-[0_1px_2px_rgba(16,24,40,0.06)] flex items-center justify-center text-primary shrink-0">
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0 rounded-2xl border border-border/60 bg-white/70 px-4 py-3 hover:bg-white hover:shadow-md transition-all">
                  <p className="text-[13.5px] text-foreground leading-snug">{activity.description}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {category} · {new Date(activity.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
