import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Send, Calendar, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { Card, CardContent } from '@workspace/design-system/card';
import { Button } from '@workspace/design-system/button';
import { Input } from '@workspace/design-system/input';
import { Label } from '@workspace/design-system/label';
import { Textarea } from '@workspace/design-system/textarea';
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
    <div className="max-w-2xl mx-auto pb-12 space-y-6">
      <PageHeader
        sticky
        title="Send Interview Invitations"
        eyebrow={`${selectedCandidates.length} recipient${selectedCandidates.length === 1 ? '' : 's'} selected`}
        actions={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/recruiter/interviews')}
            aria-label="Back to interviews"
          >
            <ArrowLeft size={18} />
          </Button>
        }
      />

      {/* Recipients */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">Recipients ({selectedCandidates.length})</h2>
          <div className="space-y-1">
            {selectedCandidates.map(c => (
              <div key={c.id} data-testid={`recipient-${c.id}`} className="flex items-center gap-3 py-2.5 border-b border-border/60 last:border-0">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={c.avatarUrl || ""} alt={c.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                    {c.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-foreground truncate">{c.name}</div>
                  <div className="text-[12px] text-muted-foreground truncate">{c.email}</div>
                </div>
                <span className="text-[12px] text-success font-medium shrink-0">{c.availability}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(handleSend)} className="space-y-6">
        {/* Interview details */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">Interview Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="input-deadline">Deadline *</Label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="input-deadline"
                    type="date"
                    className={cn('pl-9', errors.deadline && 'border-destructive')}
                    {...register('deadline', {
                      required: 'A deadline is required.',
                      validate: (v) => v >= TODAY || 'Deadline must be today or later.',
                    })}
                  />
                </div>
                {errors.deadline && <p className="text-[12px] text-destructive mt-1">{errors.deadline.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="input-questions">Questions</Label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input id="input-questions" value="5 questions · ~12 min" readOnly className="pl-9 text-muted-foreground font-mono" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">Personal Message</h2>
            <Textarea
              data-testid="input-note"
              rows={8}
              className={cn('resize-none', errors.note && 'border-destructive')}
              {...register('note', {
                required: 'A message is required.',
                minLength: { value: 20, message: 'Please write a bit more — at least 20 characters.' },
              })}
            />
            {errors.note && <p className="text-[12px] text-destructive mt-1">{errors.note.message}</p>}
            <p className="text-[12px] text-muted-foreground mt-2">{'{candidate_name}'} will be replaced with each recipient's name.</p>
          </CardContent>
        </Card>

        <Button type="submit" data-testid="btn-send-invitations" disabled={sending || sent} size="lg"
          className={cn('w-full gap-2', sent && 'bg-success text-success-foreground hover:bg-success')}>
          <Send size={16} />
          {sent ? 'Invitations Sent!' : sending ? 'Sending…' : `Send ${selectedCandidates.length} Invitations`}
        </Button>
      </form>
    </div>
  );
}
