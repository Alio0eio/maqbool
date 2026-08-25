import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Search, CheckSquare, GitCompare } from 'lucide-react';
import { MatchScoreBadge, StatusBadge, AITag } from '@/components/shared/badges';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@workspace/design-system/button';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
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
    <div>
      {/* Header */}
      <PageHeader
        className="mb-6"
        title={job.title}
        eyebrow={`${applicants.length} APPLICANT${applicants.length === 1 ? "" : "S"} · RANKED BY AI MATCH SCORE`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              data-testid="btn-back"
              variant="ghost"
              size="icon"
              className="rounded-lg text-muted-foreground"
              onClick={() => setLocation('/recruiter/jobs')}
              aria-label="Back to jobs"
            >
              <ArrowLeft size={18} />
            </Button>
            {selected.length > 0 && (
              <>
                <span className="text-sm text-muted-foreground font-mono">{selected.length} selected</span>
                <Button
                  data-testid="btn-compare"
                  variant="outline"
                  onClick={() => setLocation(`/recruiter/jobs/${job.id}/applicants/compare`)}
                >
                  <GitCompare size={15} className="mr-2" /> Compare
                </Button>
                <Button
                  data-testid="btn-bulk-action"
                  onClick={() => setLocation(`/recruiter/jobs/${job.id}/applicants/bulk`)}
                >
                  <CheckSquare size={15} className="mr-2" /> Bulk Action
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Stage tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {stages.map(s => (
          <button
            key={s}
            data-testid={`filter-${s.toLowerCase()}`}
            onClick={() => setStageFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              stageFilter === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            data-testid="input-search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-border rounded-full bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 w-44"
          />
        </div>
      </div>

      {/* Candidate list */}
      <div className="space-y-3">
        {filtered.map((app, i) => {
          const c = app.candidate!;
          const isSelected = selected.includes(c.id);
          return (
            <div
              key={app.id}
              data-testid={`candidate-card-${c.id}`}
              className={`bg-white rounded-xl border shadow-sm transition-all ${
                isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Rank */}
                <div className="w-7 text-center">
                  <span className="text-xs font-mono font-bold text-muted-foreground">#{i + 1}</span>
                </div>

                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(c.id)}
                  className="w-4 h-4 rounded accent-primary"
                  data-testid={`checkbox-${c.id}`}
                />

                {/* Avatar */}
                <Avatar className="w-11 h-11 shrink-0">
                  <AvatarImage src={c.avatarUrl || ""} alt={c.name} />
                  <AvatarFallback className="bg-primary text-white font-bold text-sm">
                    {c.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-foreground text-sm">{c.name}</span>
                    <AITag />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.headline}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(c.skills ?? []).slice(0, 4).map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-muted text-xs rounded-full text-muted-foreground">{skill}</span>
                    ))}
                  </div>
                </div>

                {/* Scores */}
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center hidden md:block">
                    <div className="text-xs text-muted-foreground mb-1">Match</div>
                    <MatchScoreBadge score={app.aiScore ?? 0} size="md" />
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs text-muted-foreground mb-1">Stage</div>
                    <StatusBadge status={app.stage} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    data-testid={`btn-view-${c.id}`}
                    onClick={() => setLocation(`/recruiter/candidates/${c.id}`)}
                    className="px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-all"
                  >
                    Review
                  </button>
                  <button
                    data-testid={`btn-invite-${c.id}`}
                    onClick={() => setLocation(`/recruiter/interviews/${app.id}/invite`)}
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
                  >
                    Invite
                  </button>
                </div>
              </div>

              {/* AI Summary */}
              {app.aiSummary && (
                <div className="mx-4 mb-4 px-3 py-2 bg-[#e7eeff] rounded-lg flex items-start gap-2">
                  <AITag />
                  <p className="text-xs text-[#00236f]">{app.aiSummary}</p>
                </div>
              )}
            </div>
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
