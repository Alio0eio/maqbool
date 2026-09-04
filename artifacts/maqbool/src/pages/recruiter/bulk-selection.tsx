import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, CheckSquare, Mail, Send } from 'lucide-react';
import { MatchScoreBadge, StatusBadge } from '@/components/shared/badges';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { Badge } from '@workspace/design-system/badge';
import { Button } from '@workspace/design-system/button';
import { Card } from '@workspace/design-system/card';
import { Checkbox } from '@workspace/design-system/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/design-system/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/design-system/table';
import { PageHeader } from '@/components/shared/page-header';
import { cn } from '@workspace/design-system/utils';
import { MOCK_JOBS, MOCK_CANDIDATES, MOCK_APPLICATIONS, type ApplicationStage } from '@/lib/mock-data';

// Forward progression through the pipeline — used so "Advance stage" moves
// each selected candidate one real step forward instead of doing nothing.
const STAGE_ORDER: ApplicationStage[] = ['applied', 'screening', 'interview', 'decision', 'offer', 'hired'];

const ACTIONS = [
  { value: 'advance', label: 'Advance stage' },
  { value: 'reject', label: 'Reject' },
  { value: 'invite', label: 'Send interview invite' },
  { value: 'message', label: 'Send message' },
] as const;
type BulkAction = (typeof ACTIONS)[number]['value'];

export default function BulkSelection() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const job = MOCK_JOBS.find(j => j.id === Number(params.id)) ?? MOCK_JOBS[0];

  const initialApps = MOCK_APPLICATIONS
    .filter(a => a.jobId === job.id)
    .map(a => ({ ...a, candidate: MOCK_CANDIDATES.find(c => c.id === a.candidateId) }))
    .filter((a): a is typeof a & { candidate: NonNullable<typeof a.candidate> } => Boolean(a.candidate));

  const [apps, setApps] = useState(initialApps);
  const [selected, setSelected] = useState<number[]>(initialApps.map(a => a.candidateId));
  const [action, setAction] = useState<BulkAction | ''>('');
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const toggle = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === apps.length ? [] : apps.map(a => a.candidateId));

  function apply() {
    if (!action || selected.length === 0) return;

    if (action === 'advance') {
      setApps(prev => prev.map(a => {
        if (!selected.includes(a.candidateId)) return a;
        const idx = STAGE_ORDER.indexOf(a.stage as ApplicationStage);
        const nextStage = idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : a.stage;
        return { ...a, stage: nextStage };
      }));
      setConfirmation(`Advanced ${selected.length} candidate${selected.length === 1 ? '' : 's'} to the next stage.`);
    } else if (action === 'reject') {
      setApps(prev => prev.map(a => selected.includes(a.candidateId) ? { ...a, stage: 'rejected' as ApplicationStage, status: 'rejected' } : a));
      setConfirmation(`Rejected ${selected.length} candidate${selected.length === 1 ? '' : 's'}.`);
    } else if (action === 'invite') {
      setConfirmation(`Queued interview invitations for ${selected.length} candidate${selected.length === 1 ? '' : 's'}.`);
    } else if (action === 'message') {
      setConfirmation(`Queued a message to ${selected.length} candidate${selected.length === 1 ? '' : 's'}.`);
    }

    setTimeout(() => setLocation(`/recruiter/jobs/${job.id}/applicants`), 1200);
  }

  return (
    <div className="pb-12 space-y-6">
      <PageHeader
        title="Bulk Candidate Actions"
        eyebrow={`${job.title} · ${selected.length} of ${apps.length} selected`}
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

      {confirmation && (
        <div className="p-3 rounded-[10px] bg-success/10 border border-success/30 text-[13px] text-success font-medium animate-in fade-in">
          {confirmation}
        </div>
      )}

      {/* Action bar */}
      <Card className="p-4 flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="sm" onClick={toggleAll} className="gap-2">
          <CheckSquare className={cn('w-4 h-4', selected.length === apps.length && 'text-primary')} />
          {selected.length === apps.length ? 'Deselect All' : 'Select All'}
        </Button>
        <div className="h-4 w-px bg-border" />
        <span className="text-[13.5px] font-semibold text-foreground">{selected.length} candidates selected</span>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <Select value={action} onValueChange={(v) => setAction(v as BulkAction)}>
            <SelectTrigger className="w-56" data-testid="select-action">
              <SelectValue placeholder="Choose action…" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button data-testid="btn-apply-action" onClick={apply} disabled={!action || selected.length === 0}>
            {action === 'invite' ? <Send className="w-[15px] h-[15px]" /> : <Mail className="w-[15px] h-[15px]" />} Apply to Selected
          </Button>
        </div>
      </Card>

      {/* Candidate list */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 w-10">
                <Checkbox checked={selected.length === apps.length} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="px-4">Candidate</TableHead>
              <TableHead className="px-4 hidden md:table-cell">Skills</TableHead>
              <TableHead className="px-4">AI Score</TableHead>
              <TableHead className="px-4">Stage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map(app => {
              const c = app.candidate;
              const isSelected = selected.includes(c.id);
              return (
                <TableRow
                  key={app.id}
                  data-testid={`row-${c.id}`}
                  data-state={isSelected ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={() => toggle(c.id)}
                >
                  <TableCell className="px-4" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggle(c.id)} />
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-9 h-9 border border-border/70 shrink-0">
                        <AvatarImage src={c.avatarUrl || ""} alt={c.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                          {c.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground text-[13.5px] truncate">{c.name}</div>
                        <div className="text-[12px] text-muted-foreground truncate">{c.location}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {(c.skills ?? []).slice(0, 3).map(s => <Badge key={s} variant="subtle">{s}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="px-4"><MatchScoreBadge score={app.aiScore ?? 0} size="sm" /></TableCell>
                  <TableCell className="px-4"><StatusBadge status={app.stage} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
