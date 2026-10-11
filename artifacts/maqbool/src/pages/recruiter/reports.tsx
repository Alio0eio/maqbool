import React from "react";
import { MOCK_STATS, MOCK_JOBS, MOCK_CANDIDATES } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/design-system/card";
import { Button } from "@workspace/design-system/button";
import { PageHeader } from "@/components/shared/page-header";
import { FunnelBars } from "@/components/shared/funnel-bars";
import { RingGauge } from "@/components/shared/ring-gauge";
import { StatCard } from "@/components/shared/stat-card";
import { ChartBar, TrendingUp, Users, Briefcase } from "lucide-react";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Reports"
        eyebrow={`${totalPipeline} candidates in pipeline · ${MOCK_STATS.timeToHireAvg}d avg time to hire`}
        description="Review hiring performance, conversion trends, and pipeline health."
        actions={<Button>Export report</Button>}
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
          href="/recruiter/candidates"
        />
        <StatCard
          label="Open Offers"
          value={MOCK_STATS.openOffers}
          icon={ChartBar}
          helperText="Awaiting candidate response"
          href="/recruiter/offers"
        />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-[15px]">Hiring funnel</CardTitle>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">Share is relative to the largest stage; % is conversion from the stage before.</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-5">
            <FunnelBars stages={Object.entries(MOCK_STATS.pipelineByStage) as [string, number][]} showConversion />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="py-4">
            <CardTitle className="text-[15px]">Conversion snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 pb-6">
            <RingGauge
              value={Math.min(100, Math.round((MOCK_STATS.timeToHireAvg / 30) * 100))}
              display={MOCK_STATS.timeToHireAvg}
              suffix="d"
              label="Time to hire"
              caption="average · 30-day target"
              tone="text-primary"
            />
            <RingGauge value={82} label="Interview completion" caption="of invited candidates" tone="text-success" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
