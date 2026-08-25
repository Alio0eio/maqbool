import React from "react";
import { MOCK_STATS, MOCK_JOBS, MOCK_CANDIDATES } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/design-system/card";
import { Button } from "@workspace/design-system/button";
import { Badge } from "@workspace/design-system/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ChartBar, TrendingUp, Users, Briefcase } from "lucide-react";
import { Link } from "wouter";

/** Turns a list of ISO dates into a real cumulative trend (0-1 normalized),
 *  bucketed over the last 7 days — an honest sparkline, not decoration.
 *  Mirrors the helper in recruiter/dashboard.tsx. */
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

export default function RecruiterReports() {
  const publishedJobDates = MOCK_JOBS.filter((j) => j.postedAt).map((j) => j.postedAt!);
  const jobsTrend = cumulativeTrend(publishedJobDates);
  const candidatesTrend = cumulativeTrend(MOCK_CANDIDATES.map((c) => c.createdAt!));

  const totalPipeline = Object.values(MOCK_STATS.pipelineByStage).reduce((sum, n) => sum + n, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Reports"
        eyebrow={`${totalPipeline} CANDIDATES IN PIPELINE · ${MOCK_STATS.timeToHireAvg}D AVG TIME TO HIRE`}
        description="Review hiring performance, conversion trends, and pipeline health."
        actions={<Button className="shadow-sm">Export report</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Active Jobs" value={MOCK_STATS.activeJobs} icon={Briefcase} trend={jobsTrend} />
        <StatCard
          label="Candidates in Pipeline"
          value={MOCK_STATS.totalCandidates}
          icon={Users}
          trend={candidatesTrend}
        />
        <StatCard
          label="Pending Reviews"
          value={MOCK_STATS.pendingReviews}
          icon={TrendingUp}
          helperText="Needs attention"
        />
        <StatCard
          label="Open Offers"
          value={MOCK_STATS.openOffers}
          icon={ChartBar}
          helperText="Awaiting candidate response"
        />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="p-6">
            <CardTitle className="font-display">Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {Object.entries(MOCK_STATS.pipelineByStage).map(([stage, count]) => (
                <Link
                  key={stage}
                  href={`/recruiter/pipeline?stage=${encodeURIComponent(stage)}`}
                  className="flex items-center justify-between gap-4 px-6 py-3 hover-elevate transition-colors outline-none"
                >
                  <div className="text-sm text-muted-foreground">{stage}</div>
                  <div className="font-display font-semibold text-foreground font-mono">{count}</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm col-span-1 lg:col-span-2">
          <CardHeader className="p-6">
            <CardTitle className="font-display">Conversion Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="rounded-2xl bg-surface-subtle p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Time to hire average</p>
                <Badge variant="success" className="font-mono">{MOCK_STATS.timeToHireAvg} days</Badge>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, MOCK_STATS.timeToHireAvg * 3)}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-surface-subtle p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Interview completion rate</p>
                <Badge variant="default" className="font-mono">82%</Badge>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div className="h-full bg-success" style={{ width: "82%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
