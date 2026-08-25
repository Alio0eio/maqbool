import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Send, Calendar, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { Card, CardContent } from '@workspace/design-system/card';
import { PageHeader } from '@/components/shared/page-header';
import { cn } from '@workspace/design-system/utils';
import { MOCK_CANDIDATES } from '@/lib/mock-data';

const DEFAULT_NOTE = 'Hi {candidate_name},\n\nWe\'d love to learn more about you! Please complete this short async video interview at your convenience. You\'ll have 5 questions to answer — take your time, be yourself, and show us what makes you exceptional.\n\nBest,\nSarah Jenkins\nStratos Financial';

// A week out from "today" — a sane, always-in-the-future default rather than
// a hardcoded date that silently drifts into the past.
const DEFAULT_DEADLINE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const TODAY = new Date().toISOString().slice(0, 10);

interface InvitationFormValues {
  note: string;
  deadline: string;
}

export default function SendInvitations() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvitationFormValues>({
    defaultValues: { note: DEFAULT_NOTE, deadline: DEFAULT_DEADLINE },
  });

  // Selected candidates from the pipeline
  const selectedCandidates = MOCK_CANDIDATES.slice(0, 3);

  function handleSend() {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); setTimeout(() => setLocation('/recruiter/interviews'), 1500); }, 1200);
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <PageHeader
        sticky
        title="Send Interview Invitations"
        eyebrow={`${selectedCandidates.length} RECIPIENT${selectedCandidates.length === 1 ? '' : 'S'} SELECTED`}
        className="mb-6"
        actions={
          <button onClick={() => setLocation('/recruiter/interviews')} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all">
            <ArrowLeft size={18} />
          </button>
        }
      />

      {/* Recipients */}
      <Card className="shadow-sm mb-4">
        <CardContent className="p-5">
          <h2 className="font-display font-semibold text-foreground mb-3">Recipients ({selectedCandidates.length})</h2>
          <div className="space-y-2">
            {selectedCandidates.map(c => (
              <div key={c.id} data-testid={`recipient-${c.id}`} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={c.avatarUrl || ""} alt={c.name} />
                  <AvatarFallback className="bg-primary text-white font-bold text-xs">
                    {c.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </div>
                <span className="text-xs text-success font-medium font-mono">{c.availability}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(handleSend)}>
        {/* Interview details */}
        <Card className="shadow-sm mb-4">
          <CardContent className="p-5">
            <h2 className="font-display font-semibold text-foreground mb-3">Interview Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Deadline *</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    {...register('deadline', {
                      required: 'A deadline is required.',
                      validate: (v) => v >= TODAY || 'Deadline must be today or later.',
                    })}
                    className={cn(
                      'w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20',
                      errors.deadline ? 'border-destructive' : 'border-border'
                    )}
                  />
                </div>
                {errors.deadline && <p className="text-xs text-destructive mt-1">{errors.deadline.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Questions</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value="5 questions · ~12 min" readOnly className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-muted/30 text-muted-foreground font-mono" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-5">
            <h2 className="font-display font-semibold text-foreground mb-3">Personal Message</h2>
            <textarea
              data-testid="input-note"
              {...register('note', {
                required: 'A message is required.',
                minLength: { value: 20, message: 'Please write a bit more — at least 20 characters.' },
              })}
              rows={8}
              className={cn(
                'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono text-muted-foreground',
                errors.note ? 'border-destructive' : 'border-border'
              )}
            />
            {errors.note && <p className="text-xs text-destructive mt-1">{errors.note.message}</p>}
            <p className="text-xs text-muted-foreground mt-2">{'{candidate_name}'} will be replaced with each recipient's name.</p>
          </CardContent>
        </Card>

        <button type="submit" data-testid="btn-send-invitations" disabled={sending || sent}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all',
            sent ? 'bg-success text-success-foreground' :
            sending ? 'bg-primary/70 text-white cursor-wait' :
            'bg-primary text-white hover:bg-primary/90'
          )}>
          <Send size={16} />
          {sent ? 'Invitations Sent!' : sending ? 'Sending…' : `Send ${selectedCandidates.length} Invitations`}
        </button>
      </form>
    </div>
  );
}
