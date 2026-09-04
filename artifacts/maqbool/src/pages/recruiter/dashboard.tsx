import React from "react";
import {
  MOCK_STATS,
  MOCK_JOBS,
  MOCK_ACTIVITY,
  MOCK_CANDIDATES,
} from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/design-system/card";
import { Button } from "@workspace/design-system/button";
import { JobCard } from "@/components/shared/job-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";
import {
  Briefcase,
  Users,
  Clock,
  Calendar,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";

/** Turns a list of ISO dates into a real cumulative trend (0-1 normalized),
 *  bucketed over the last 7 days — an honest sparkline, not decoration. */
function cumulativeTrend(dates: string[], buckets = 8): number[] {
  const now = Date.now();
  const bucketMs = (7 * 24 * 60 * 60 * 1000) / buckets;
  const counts = Array(buckets).fill(0);
  dates.forEach((d) => {
    const age = now - new Date(d).getTime();
    const idx = Math.min(buckets - 1, Math.max(0, buckets - 1 - Math.floor(age / bucketMs)));
    counts[idx]++;
  });
  let running = 0;
  const cumulative = counts.map((c) => (running += c));
  const max = Math.max(1, ...cumulative);
  return cumulative.map((v) => v / max);
}

export default function RecruiterDashboard() {
  const stats = MOCK_STATS;
  const recentJobs = MOCK_JOBS.slice(0, 2);

  const publishedJobDates = MOCK_JOBS.filter((j) => j.postedAt).map((j) => j.postedAt!);
  const jobsTrend = cumulativeTrend(publishedJobDates);
  const candidatesTrend = cumulativeTrend(MOCK_CANDIDATES.map((c) => c.createdAt!));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Overview"
        eyebrow={`${stats.activeJobs} active jobs · ${stats.pendingReviews} awaiting review`}
        description="Here's what's happening with your hiring pipeline today."
        actions={
          <Link href="/recruiter/jobs/new/basic">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem>
          <StatCard label="Active Jobs" value={stats.activeJobs} icon={Briefcase} trend={jobsTrend} />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Total Candidates" value={stats.totalCandidates} icon={Users} trend={candidatesTrend} />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Pending Reviews"
            value={stats.pendingReviews}
            icon={Clock}
            helperText="Needs attention"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Interviews"
            value={stats.scheduledInterviews}
            icon={Calendar}
            helperText="Scheduled this week"
          />
        </StaggerItem>
      </StaggerGroup>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Jobs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">Top Active Jobs</h2>
              <Link href="/recruiter/jobs">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
            <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentJobs.map(job => (
                <StaggerItem key={job.id}>
                  <JobCard job={job} variant="recruiter" />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>

          {/* Pipeline Overview */}
          <section>
            <Card className="overflow-hidden">
              <CardHeader className="py-4">
                <CardTitle className="text-[15px]">Pipeline Health</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex divide-x divide-border/60 border-t border-border/60">
                  {Object.entries(stats.pipelineByStage).map(([stage]) => (
                    <Link
                      key={stage}
                      href={`/recruiter/pipeline?stage=${encodeURIComponent(stage)}`}
                      className="flex-1 p-6 text-center hover:bg-foreground/[0.02] transition-colors cursor-pointer outline-none"
                    >
                      <div className="text-[26px] font-semibold text-foreground tracking-[-0.02em] mb-1">
                        {stats.pipelineByStage[stage as keyof typeof stats.pipelineByStage]}
                      </div>
                      <div className="text-[11px] font-medium text-muted-foreground capitalize">{stage}</div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Recent Activity */}
          <Card className="h-full">
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-[15px]">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60 border-t border-border/60">
                {MOCK_ACTIVITY.map((activity, i) => (
                  <div key={activity.id} className="p-4 flex gap-4">
                    <div className="relative mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary relative z-10" />
                      {i !== MOCK_ACTIVITY.length - 1 && (
                        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-px h-14 bg-border/70" />
                      )}
                    </div>
                    <div>
                      <p className="text-[13.5px] text-foreground leading-snug">{activity.description}</p>
                      <p className="text-[12px] text-muted-foreground mt-1">
                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border/60 text-center">
                <Link href="/recruiter/activity">
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground">View Timeline</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
