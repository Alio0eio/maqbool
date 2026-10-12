import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, CheckSquare, Mail, Send, UserX } from 'lucide-react';
import { ConfirmAction } from '@/components/shared/confirm-action';
import { MatchScoreBadge, StatusBadge } from '@/components/shared/badges';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { Badge } from '@workspace/design-system/badge';
import { Button } from '@workspace/design-system/button';
import { Card } from '@workspace/design-system/card';
import { Checkbox } from '@workspace/design-system/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/design-system/table';
import { PageHeader } from '@/components/shared/page-header';
import { cn } from '@workspace/design-system/utils';
import { MOCK_JOBS, MOCK_CANDIDATES, MOCK_APPLICATIONS, type ApplicationStage } from '@/lib/mock-data';

// Forward progression through the pipeline — used so "Advance stage" moves
// each selected candidate one real step forward instead of doing nothing.
const STAGE_ORDER: ApplicationStage[] = ['applied', 'screening', 'interview', 'decision', 'offer', 'hired'];

const ACTIONS = [
  { value: 'advance', label: 'Advance stage', hint: 'Move to the next stage', icon: ArrowRight },
  { value: 'invite', label: 'Interview invite', hint: 'Send async interview', icon: Send },
  { value: 'message', label: 'Send message', hint: 'Message all selected', icon: Mail },
  { value: 'reject', label: 'Reject', hint: 'Close these applications', icon: UserX },
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
      <Card className="p-5 space-y-5">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="sm" onClick={toggleAll} className="gap-2">
            <CheckSquare className={cn('w-4 h-4', selected.length === apps.length && 'text-primary')} />
            {selected.length === apps.length ? 'Deselect all' : 'Select all'}
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-[13.5px] font-semibold text-foreground tabular-nums">{selected.length} selected</span>
        </div>

        <div role="radiogroup" aria-label="Bulk action" data-testid="select-action" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ACTIONS.map(a => {
            const active = action === a.value;
            const danger = a.value === 'reject';
            return (
              <button
                key={a.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setAction(a.value)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  active
                    ? danger ? 'border-destructive bg-destructive/[0.06]' : 'border-primary bg-primary/[0.05] shadow-[0_8px_20px_-10px_hsl(var(--primary)/0.5)]'
                    : 'border-border/70 bg-white hover:border-foreground/20',
                )}
              >
                <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', active ? (danger ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground') : 'bg-muted text-muted-foreground')}>
                  <a.icon className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-foreground">{a.label}</span>
                  <span className="block text-[12px] text-muted-foreground truncate">{a.hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          {action === 'reject' ? (
            <ConfirmAction
              title={`Reject ${selected.length} candidate${selected.length === 1 ? '' : 's'}?`}
              description="Their applications will be closed and they'll be notified. This can't be undone from this screen."
              confirmLabel="Reject candidates"
              onConfirm={apply}
            >
              <Button data-testid="btn-apply-action" variant="destructive" disabled={selected.length === 0}>
                <UserX className="w-[15px] h-[15px]" /> Reject selected
              </Button>
            </ConfirmAction>
          ) : (
            <Button data-testid="btn-apply-action" onClick={apply} disabled={!action || selected.length === 0}>
              Apply to selected
            </Button>
          )}
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
                      <Avatar className="w-9 h-9 ring-2 ring-white shadow-[0_0_0_1px_hsl(var(--border))] shrink-0">
                        <AvatarImage src={c.avatarUrl || ""} alt={c.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold text-sm">
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
