import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, CheckSquare, Mail, Send } from 'lucide-react';
import { MatchScoreBadge, StatusBadge } from '@/components/shared/badges';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
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
    <div className="pb-12">
      <PageHeader
        title="Bulk Candidate Actions"
        eyebrow={`${job.title.toUpperCase()} · ${selected.length} OF ${apps.length} SELECTED`}
        className="mb-6"
        actions={
          <button onClick={() => setLocation(`/recruiter/jobs/${job.id}/applicants`)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all">
            <ArrowLeft size={18} />
          </button>
        }
      />

      {confirmation && (
        <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/30 text-sm text-success font-medium animate-in fade-in">
          {confirmation}
        </div>
      )}

      {/* Action bar */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-4 flex items-center gap-4 flex-wrap">
        <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all">
          <CheckSquare size={16} className={selected.length === apps.length ? 'text-primary' : ''} />
          {selected.length === apps.length ? 'Deselect All' : 'Select All'}
        </button>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm font-semibold text-foreground font-mono">{selected.length} candidates selected</span>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <select value={action} onChange={e => setAction(e.target.value as BulkAction | '')}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Choose action…</option>
            {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <button data-testid="btn-apply-action" onClick={apply} disabled={!action || selected.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-all">
            {action === 'invite' ? <Send size={15} /> : <Mail size={15} />} Apply to Selected
          </button>
        </div>
      </div>

      {/* Candidate list */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase border-b border-border">
              <th className="px-4 py-3"><input type="checkbox" checked={selected.length === apps.length} onChange={toggleAll} className="w-4 h-4 accent-primary rounded" /></th>
              <th className="text-left px-4 py-3 font-semibold">Candidate</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Skills</th>
              <th className="text-left px-4 py-3 font-semibold">AI Score</th>
              <th className="text-left px-4 py-3 font-semibold">Stage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {apps.map(app => {
              const c = app.candidate;
              const isSelected = selected.includes(c.id);
              return (
                <tr key={app.id} data-testid={`row-${c.id}`}
                  className={cn('hover:bg-muted/30 cursor-pointer transition-all', isSelected && 'bg-[#e7eeff]/50')}
                  onClick={() => toggle(c.id)}>
                  <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggle(c.id); }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggle(c.id)} className="w-4 h-4 accent-primary rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarImage src={c.avatarUrl || ""} alt={c.name} />
                        <AvatarFallback className="bg-primary text-white font-bold text-sm">
                          {c.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(c.skills ?? []).slice(0, 3).map(s => <span key={s} className="px-2 py-0.5 bg-muted text-xs rounded-full">{s}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3"><MatchScoreBadge score={app.aiScore ?? 0} size="sm" /></td>
                  <td className="px-4 py-3"><StatusBadge status={app.stage} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
