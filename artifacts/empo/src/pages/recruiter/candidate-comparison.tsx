import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Check, X } from 'lucide-react';
import { MatchScoreBadge, AITag } from '@/components/shared/badges';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { Button } from '@workspace/design-system/button';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { toast } from '@workspace/design-system/hooks/use-toast';
import { MOCK_CANDIDATES, MOCK_JOBS, MOCK_APPLICATIONS, type Candidate } from '@/lib/mock-data';

const CRITERIA = [
  { label: 'Skill Match', key: 'skillMatch' as const },
  { label: 'Experience Match', key: 'experienceMatch' as const },
  { label: 'AI Overall Score', key: 'aiScore' as const },
];

const TRAITS = [
  { label: 'Fintech experience', values: [true, true, false, false, false] },
  { label: 'Design systems', values: [true, true, true, false, false] },
  { label: 'Accessibility expertise', values: [true, false, false, false, false] },
  { label: 'User research', values: [true, false, false, false, true] },
  { label: 'Remote work preference', values: [false, true, false, true, false] },
];

// AI application data (aiScore/aiSummary) lives on Application, not Candidate.
// skillMatch/experienceMatch aren't real API fields — derive them from aiScore
// the same way the old mock-data legacy adapter used to.
function withScores(candidate: Candidate) {
  const app = MOCK_APPLICATIONS.find(a => a.candidateId === candidate.id);
  const aiScore = app?.aiScore ?? 72;
  return {
    ...candidate,
    aiScore,
    skillMatch: Math.min(99, aiScore + 4),
    experienceMatch: Math.max(45, aiScore - 6),
  };
}

export default function CandidateComparison() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const job = MOCK_JOBS.find(j => j.id === Number(params.id)) ?? MOCK_JOBS[0];
  // Compare top 3 candidates
  const candidates = MOCK_CANDIDATES
    .map(withScores)
    .filter(c => MOCK_APPLICATIONS.some(a => a.candidateId === c.id))
    .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0))
    .slice(0, 3);

  const [invited, setInvited] = useState<Set<number>>(new Set());

  function handleInvite(c: (typeof candidates)[number]) {
    setInvited(prev => new Set(prev).add(c.id));
    toast({ title: 'Interview invite sent', description: `${c.name} has been invited to interview for ${job.title}.` });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Comparison"
        eyebrow={`${job.title} · Comparing ${candidates.length} candidates`}
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg text-muted-foreground"
            onClick={() => setLocation(`/recruiter/jobs/${job.id}/applicants`)}
            aria-label="Back to applicants"
          >
            <ArrowLeft size={18} />
          </Button>
        }
      />

      <ViewfinderCard className="shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: `200px repeat(${candidates.length}, 1fr)` }}>
          <div className="p-4" />
          {candidates.map(c => (
            <div key={c.id} className="p-4 text-center border-l border-border">
              <Avatar className="w-14 h-14 mx-auto mb-2">
                <AvatarImage src={c.avatarUrl || ""} alt={c.name} />
                <AvatarFallback className="bg-primary text-white font-bold text-xl font-display">
                  {c.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="font-display font-semibold text-sm text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-mono">{c.yearsOfExp}Y EXPERIENCE</div>
              <div className="flex justify-center mt-2"><MatchScoreBadge score={c.aiScore ?? 0} size="md" /></div>
            </div>
          ))}
        </div>

        {/* AI Scores */}
        <div className="border-b border-border">
          <div style={{ gridTemplateColumns: `200px repeat(${candidates.length}, 1fr)` }} className="grid">
            <div className="px-4 py-3 flex items-center gap-1.5">
              <AITag>AI Scores</AITag>
            </div>
            {candidates.map(c => (
              <div key={c.id} className="px-4 py-3 border-l border-border space-y-2">
                {CRITERIA.map(cr => (
                  <div key={cr.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-muted-foreground">{cr.label}</span>
                      <span className="font-mono font-semibold">{c[cr.key] ?? '-'}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${c[cr.key] ?? 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Trait comparison */}
        <div className="border-b border-border">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Traits</span>
          </div>
          {TRAITS.map((trait, ti) => (
            <div key={trait.label} style={{ gridTemplateColumns: `200px repeat(${candidates.length}, 1fr)` }}
              className={`grid ${ti % 2 === 0 ? 'bg-surface-subtle/50' : ''}`}>
              <div className="px-4 py-3 text-sm text-muted-foreground flex items-center">{trait.label}</div>
              {candidates.map((c, ci) => (
                <div key={c.id} className="px-4 py-3 border-l border-border flex items-center justify-center">
                  {trait.values[ci]
                    ? <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center"><Check size={13} className="text-success" /></div>
                    : <div className="w-6 h-6 bg-destructive/10 rounded-full flex items-center justify-center"><X size={13} className="text-destructive/70" /></div>}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Availability & Salary */}
        {[
          { label: 'Availability', values: (c: (typeof candidates)[number]) => c.availability },
          { label: 'Salary Expectation', values: (c: (typeof candidates)[number]) => `$${((c.salaryExpectation ?? 0) / 1000).toFixed(0)}k` },
        ].map(row => (
          <div key={row.label} style={{ gridTemplateColumns: `200px repeat(${candidates.length}, 1fr)` }} className="grid border-t border-border">
            <div className="px-4 py-3 text-sm text-muted-foreground flex items-center">{row.label}</div>
            {candidates.map(c => (
              <div key={c.id} className="px-4 py-3 border-l border-border text-center text-sm font-mono font-medium text-foreground">{row.values(c)}</div>
            ))}
          </div>
        ))}

        {/* Action row */}
        <div style={{ gridTemplateColumns: `200px repeat(${candidates.length}, 1fr)` }} className="grid border-t border-border bg-surface-subtle/50">
          <div className="px-4 py-4" />
          {candidates.map(c => (
            <div key={c.id} className="px-4 py-4 border-l border-border flex flex-col gap-2">
              <Button
                data-testid={`btn-view-${c.id}`}
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setLocation(`/recruiter/candidates/${c.id}`)}
              >
                View Profile
              </Button>
              <Button
                data-testid={`btn-invite-${c.id}`}
                size="sm"
                className="w-full text-xs"
                disabled={invited.has(c.id)}
                onClick={() => handleInvite(c)}
              >
                {invited.has(c.id) ? 'Invited' : 'Invite'}
              </Button>
            </div>
          ))}
        </div>
      </ViewfinderCard>
    </div>
  );
}
