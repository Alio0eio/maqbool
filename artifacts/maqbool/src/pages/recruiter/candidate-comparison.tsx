import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Check, X } from 'lucide-react';
import { MatchScoreBadge, AITag } from '@/components/shared/badges';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@workspace/design-system/table';
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
            onClick={() => setLocation(`/recruiter/jobs/${job.id}/applicants`)}
            aria-label="Back to applicants"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
          </Button>
        }
      />

      <ViewfinderCard>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[180px]" />
              {candidates.map(c => (
                <TableHead key={c.id} className="text-center align-top py-5 px-3 min-w-[160px]">
                  <Avatar className="w-14 h-14 mx-auto mb-2 border border-border/70">
                    <AvatarImage src={c.avatarUrl || ""} alt={c.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xl">
                      {c.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-semibold text-[13.5px] text-foreground">{c.name}</div>
                  <div className="text-[11.5px] text-muted-foreground mt-0.5">{c.yearsOfExp} years experience</div>
                  <div className="flex justify-center mt-2"><MatchScoreBadge score={c.aiScore ?? 0} size="sm" /></div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={candidates.length + 1} className="bg-surface-subtle/60 py-2.5 px-4">
                <AITag>AI Scores</AITag>
              </TableCell>
            </TableRow>
            {CRITERIA.map(cr => (
              <TableRow key={cr.label}>
                <TableCell className="px-4 py-3 text-[13px] text-muted-foreground font-medium">{cr.label}</TableCell>
                {candidates.map(c => (
                  <TableCell key={c.id} className="px-3 py-3">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[12.5px] font-semibold text-foreground">{c[cr.key] ?? '-'}%</span>
                      <div className="h-1.5 w-full max-w-28 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${c[cr.key] ?? 0}%` }} />
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}

            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={candidates.length + 1} className="bg-surface-subtle/60 py-2.5 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Key Traits
              </TableCell>
            </TableRow>
            {TRAITS.map(trait => (
              <TableRow key={trait.label}>
                <TableCell className="px-4 py-3 text-[13px] text-muted-foreground">{trait.label}</TableCell>
                {trait.values.map((v, ci) => (
                  <TableCell key={ci} className="px-3 py-3 text-center">
                    {v
                      ? <div className="w-6 h-6 mx-auto bg-success/10 rounded-full flex items-center justify-center"><Check className="w-3.5 h-3.5 text-success" /></div>
                      : <div className="w-6 h-6 mx-auto bg-destructive/10 rounded-full flex items-center justify-center"><X className="w-3.5 h-3.5 text-destructive/70" /></div>}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {[
              { label: 'Availability', values: (c: (typeof candidates)[number]) => c.availability },
              { label: 'Salary Expectation', values: (c: (typeof candidates)[number]) => c.salaryExpectation ? `$${(c.salaryExpectation / 1000).toFixed(0)}k` : 'Not specified' },
            ].map(row => (
              <TableRow key={row.label}>
                <TableCell className="px-4 py-3 text-[13px] text-muted-foreground">{row.label}</TableCell>
                {candidates.map(c => (
                  <TableCell key={c.id} className="px-3 py-3 text-center text-[13px] font-medium text-foreground">{row.values(c)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell className="px-4" />
              {candidates.map(c => (
                <TableCell key={c.id} className="px-3 py-3">
                  <div className="flex flex-col gap-2">
                    <Button
                      data-testid={`btn-view-${c.id}`}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setLocation(`/recruiter/candidates/${c.id}`)}
                    >
                      View Profile
                    </Button>
                    <Button
                      data-testid={`btn-invite-${c.id}`}
                      size="sm"
                      className="w-full"
                      disabled={invited.has(c.id)}
                      onClick={() => handleInvite(c)}
                    >
                      {invited.has(c.id) ? 'Invited' : 'Invite'}
                    </Button>
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </ViewfinderCard>
    </div>
  );
}
