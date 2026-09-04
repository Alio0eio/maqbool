import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Search, CheckSquare, GitCompare } from 'lucide-react';
import { MatchScoreBadge, StatusBadge, AITag } from '@/components/shared/badges';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@workspace/design-system/button';
import { Input } from '@workspace/design-system/input';
import { Badge } from '@workspace/design-system/badge';
import { Checkbox } from '@workspace/design-system/checkbox';
import { CardContent } from '@workspace/design-system/card';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { cn } from '@workspace/design-system/utils';
import { MOCK_JOBS, MOCK_CANDIDATES, MOCK_APPLICATIONS } from '@/lib/mock-data';

function getRankedApplicants(jobId: number) {
  const apps = MOCK_APPLICATIONS.filter(a => a.jobId === jobId);
  return apps.map(app => {
    const candidate = MOCK_CANDIDATES.find(c => c.id === app.candidateId);
    return { ...app, candidate };
  }).filter(a => a.candidate).sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
}

export default function JobApplicants() {
  const params = useParams<{ id: string }>();
  const jobId = Number(params.id);
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<number[]>([]);
  const [stageFilter, setStageFilter] = useState('All');
  const [search, setSearch] = useState('');

  const job = MOCK_JOBS.find(j => j.id === jobId) ?? MOCK_JOBS[0];
  const applicants = getRankedApplicants(job.id);
  const stages = ['All', 'Applied', 'Screening', 'Interview', 'Decision', 'Offer'];
  const stageFiltered = stageFilter === 'All' ? applicants : applicants.filter(a => a.stage === stageFilter.toLowerCase());
  const filtered = stageFiltered.filter(a => a.candidate!.name.toLowerCase().includes(search.toLowerCase()));

  function toggleSelect(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={job.title}
        eyebrow={`${applicants.length} applicant${applicants.length === 1 ? "" : "s"} · ranked by AI match score`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              data-testid="btn-back"
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/recruiter/jobs')}
              aria-label="Back to jobs"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </Button>
            {selected.length > 0 && (
              <>
                <span className="text-[13px] text-muted-foreground">{selected.length} selected</span>
                <Button
                  data-testid="btn-compare"
                  variant="outline"
                  onClick={() => setLocation(`/recruiter/jobs/${job.id}/applicants/compare`)}
                >
                  <GitCompare className="w-[15px] h-[15px]" /> Compare
                </Button>
                <Button
                  data-testid="btn-bulk-action"
                  onClick={() => setLocation(`/recruiter/jobs/${job.id}/applicants/bulk`)}
                >
                  <CheckSquare className="w-[15px] h-[15px]" /> Bulk Action
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Stage tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {stages.map(s => (
          <button
            key={s}
            data-testid={`filter-${s.toLowerCase()}`}
            onClick={() => setStageFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-[12.5px] font-medium whitespace-nowrap transition-colors',
              stageFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {s}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            data-testid="input-search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 pr-3 text-xs rounded-full w-44"
          />
        </div>
      </div>

      {/* Candidate list */}
      <div className="space-y-3">
        {filtered.map((app, i) => {
          const c = app.candidate!;
          const isSelected = selected.includes(c.id);
          return (
            <ViewfinderCard
              key={app.id}
              data-testid={`candidate-card-${c.id}`}
              className={cn(isSelected && 'ring-1 ring-primary/30 border-primary/40')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="w-6 text-center shrink-0">
                    <span className="text-[12.5px] font-semibold text-muted-foreground">#{i + 1}</span>
                  </div>

                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelect(c.id)}
                    data-testid={`checkbox-${c.id}`}
                    className="shrink-0"
                  />

                  {/* Avatar */}
                  <Avatar className="w-11 h-11 border border-border/70 shrink-0">
                    <AvatarImage src={c.avatarUrl || ""} alt={c.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                      {c.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-[14px]">{c.name}</span>
                      <AITag />
                    </div>
                    <div className="text-[12.5px] text-muted-foreground mt-0.5 truncate">{c.headline}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(c.skills ?? []).slice(0, 4).map(skill => (
                        <Badge key={skill} variant="subtle">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center hidden md:block">
                      <div className="text-[11px] text-muted-foreground mb-1">Match</div>
                      <MatchScoreBadge score={app.aiScore ?? 0} size="md" />
                    </div>
                    <div className="hidden lg:block">
                      <div className="text-[11px] text-muted-foreground mb-1">Stage</div>
                      <StatusBadge status={app.stage} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      data-testid={`btn-view-${c.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/recruiter/candidates/${c.id}`)}
                    >
                      Review
                    </Button>
                    <Button
                      data-testid={`btn-invite-${c.id}`}
                      size="sm"
                      onClick={() => setLocation(`/recruiter/interviews/${app.id}/invite`)}
                    >
                      Invite
                    </Button>
                  </div>
                </div>

                {/* AI Summary */}
                {app.aiSummary && (
                  <div className="mt-3 sm:ml-[132px] bg-info/[0.05] rounded-[10px] p-3 flex items-start gap-2">
                    <AITag />
                    <p className="text-[12.5px] text-foreground/90 leading-relaxed">{app.aiSummary}</p>
                  </div>
                )}
              </CardContent>
            </ViewfinderCard>
          );
        })}

        {filtered.length === 0 && (
          <EmptyState
            title="No applicants in this stage"
            description="Try a different stage filter or clear your search to see more candidates."
            action={
              (stageFilter !== 'All' || search) ? (
                <Button variant="outline" onClick={() => { setStageFilter('All'); setSearch(''); }}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
