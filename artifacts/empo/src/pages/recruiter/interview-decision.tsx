import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { MatchScoreBadge, AITag } from '@/components/shared/badges';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { VideoScrubber } from '@/components/shared/video-scrubber';
import { Button } from '@workspace/design-system/button';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { MOCK_INTERVIEWS, INTERVIEW_QUESTIONS } from '@/lib/mock-data';
import { cn } from '@workspace/design-system/utils';

export default function InterviewDecision() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [decision, setDecision] = useState<'hire' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const interview = MOCK_INTERVIEWS.find(i => i.id === Number(params.id)) ?? MOCK_INTERVIEWS[0];
  const candidate = interview.application?.candidate;
  const job = interview.application?.job;

  // Same real-duration derivation used on the feedback report, so the
  // recording reviewed here matches the one already scored.
  const reviewedQuestions = INTERVIEW_QUESTIONS.slice(0, 3);
  const totalDurationSeconds = reviewedQuestions.reduce((sum, q) => sum + q.timeLimit, 0);
  const markers = reviewedQuestions.slice(1).map((_, i) => {
    const cumulative = reviewedQuestions.slice(0, i + 1).reduce((sum, q) => sum + q.timeLimit, 0);
    return { position: cumulative / totalDurationSeconds, label: `Question ${i + 2}` };
  });

  function handleSubmit() {
    if (decision === 'hire') setLocation(`/recruiter/decision/${interview.id}`);
    else setLocation('/recruiter/interviews');
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Interview Decision"
        eyebrow={`${candidate?.name ?? 'Candidate'} · ${job?.title ?? 'Role'}`}
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg text-muted-foreground"
            onClick={() => setLocation(`/recruiter/interviews/${interview.id}/feedback`)}
            aria-label="Back to feedback"
          >
            <ArrowLeft size={18} />
          </Button>
        }
      />

      {/* Candidate summary */}
      <ViewfinderCard className="shadow-sm p-5">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={candidate?.avatarUrl || ""} alt={candidate?.name ?? ''} />
            <AvatarFallback className="bg-primary text-white font-bold text-xl font-display">
              {candidate?.name ? candidate.name.substring(0, 2).toUpperCase() : 'AR'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-display font-bold text-foreground">{candidate?.name}</h2>
            <p className="text-sm text-muted-foreground">{candidate?.headline}</p>
            <p className="text-sm text-muted-foreground">{job?.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <MatchScoreBadge score={interview.application?.aiScore ?? 87} size="lg" />
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end"><AITag /></div>
              <div className="text-xs text-muted-foreground">Overall Score</div>
            </div>
          </div>
        </div>
      </ViewfinderCard>

      {/* Recording */}
      <ViewfinderCard className="shadow-sm p-5">
        <h3 className="font-display font-semibold text-sm text-foreground mb-1">Recorded Responses</h3>
        <p className="text-xs text-muted-foreground font-mono mb-4">
          {reviewedQuestions.length} QUESTIONS · {Math.floor(totalDurationSeconds / 60)}:{(totalDurationSeconds % 60).toString().padStart(2, '0')} TOTAL
        </p>
        <VideoScrubber durationSeconds={totalDurationSeconds} markers={markers} />
      </ViewfinderCard>

      {/* Decision */}
      <ViewfinderCard className="shadow-sm p-5">
        <h3 className="font-display font-semibold text-sm text-foreground mb-4">Your Decision</h3>
        <div className="grid grid-cols-2 gap-4">
          <button data-testid="btn-hire"
            onClick={() => setDecision('hire')}
            className={cn(
              'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
              decision === 'hire' ? 'border-success bg-success/10' : 'border-border hover:border-success/40'
            )}>
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', decision === 'hire' ? 'bg-success' : 'bg-muted')}>
              <ThumbsUp size={22} className={decision === 'hire' ? 'text-success-foreground' : 'text-muted-foreground'} />
            </div>
            <span className={cn('font-display font-semibold', decision === 'hire' ? 'text-success' : 'text-foreground')}>Move Forward</span>
            <span className="text-xs text-muted-foreground text-center">Advance to offer stage</span>
          </button>
          <button data-testid="btn-reject"
            onClick={() => setDecision('reject')}
            className={cn(
              'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
              decision === 'reject' ? 'border-destructive bg-destructive/10' : 'border-border hover:border-destructive/40'
            )}>
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', decision === 'reject' ? 'bg-destructive' : 'bg-muted')}>
              <ThumbsDown size={22} className={decision === 'reject' ? 'text-white' : 'text-muted-foreground'} />
            </div>
            <span className={cn('font-display font-semibold', decision === 'reject' ? 'text-destructive' : 'text-foreground')}>Decline</span>
            <span className="text-xs text-muted-foreground text-center">Send rejection with care</span>
          </button>
        </div>

        {decision && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {decision === 'hire' ? 'Notes for the offer team (optional)' : 'Reason (shown to candidate)'}
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder={decision === 'hire' ? 'Any context for the hiring manager…' : 'e.g. We decided to move forward with candidates whose experience more closely aligns with our current needs.'}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none bg-background" />
          </div>
        )}
      </ViewfinderCard>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setLocation(`/recruiter/interviews/${interview.id}/feedback`)}>
          Back to Feedback
        </Button>
        <Button data-testid="btn-confirm-decision" className="flex-1 gap-2" disabled={!decision} onClick={handleSubmit}>
          <Send size={15} /> Confirm Decision
        </Button>
      </div>
    </div>
  );
}
