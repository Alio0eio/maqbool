import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { MatchScoreBadge, AITag } from '@/components/shared/badges';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { VideoScrubber } from '@/components/shared/video-scrubber';
import { Button } from '@workspace/design-system/button';
import { Textarea } from '@workspace/design-system/textarea';
import { Label } from '@workspace/design-system/label';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { CardContent } from '@workspace/design-system/card';
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
            onClick={() => setLocation(`/recruiter/interviews/${interview.id}/feedback`)}
            aria-label="Back to feedback"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
          </Button>
        }
      />

      {/* Candidate summary */}
      <ViewfinderCard>
        <CardContent className="p-5 flex items-center gap-4">
          <Avatar className="w-14 h-14 border border-border/70 shrink-0">
            <AvatarImage src={candidate?.avatarUrl || ""} alt={candidate?.name ?? ''} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xl">
              {candidate?.name ? candidate.name.substring(0, 2).toUpperCase() : 'AR'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground text-[15px] tracking-[-0.01em]">{candidate?.name}</h2>
            <p className="text-[13px] text-muted-foreground truncate">{candidate?.headline}</p>
            <p className="text-[13px] text-muted-foreground truncate">{job?.title}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <MatchScoreBadge score={interview.application?.aiScore ?? 87} size="lg" />
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end"><AITag /></div>
              <div className="text-[11.5px] text-muted-foreground">Overall Score</div>
            </div>
          </div>
        </CardContent>
      </ViewfinderCard>

      {/* Recording */}
      <ViewfinderCard viewfinder>
        <CardContent className="p-5">
          <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-1">Recorded Responses</h3>
          <p className="text-[12px] text-muted-foreground mb-4">
            {reviewedQuestions.length} questions · <span className="font-mono">{Math.floor(totalDurationSeconds / 60)}:{(totalDurationSeconds % 60).toString().padStart(2, '0')}</span> total
          </p>
          <VideoScrubber durationSeconds={totalDurationSeconds} markers={markers} />
        </CardContent>
      </ViewfinderCard>

      {/* Decision */}
      <ViewfinderCard>
        <CardContent className="p-5">
        <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-4">Your Decision</h3>
        <div className="grid grid-cols-2 gap-4">
          <button data-testid="btn-hire"
            onClick={() => setDecision('hire')}
            className={cn(
              'flex flex-col items-center gap-3 p-6 rounded-[10px] border-2 transition-colors',
              decision === 'hire' ? 'border-success bg-success/10' : 'border-border hover:border-success/40'
            )}>
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', decision === 'hire' ? 'bg-success' : 'bg-muted')}>
              <ThumbsUp className={cn('w-[22px] h-[22px]', decision === 'hire' ? 'text-success-foreground' : 'text-muted-foreground')} strokeWidth={2} />
            </div>
            <span className={cn('font-semibold text-[13.5px]', decision === 'hire' ? 'text-success' : 'text-foreground')}>Move Forward</span>
            <span className="text-[12px] text-muted-foreground text-center">Advance to offer stage</span>
          </button>
          <button data-testid="btn-reject"
            onClick={() => setDecision('reject')}
            className={cn(
              'flex flex-col items-center gap-3 p-6 rounded-[10px] border-2 transition-colors',
              decision === 'reject' ? 'border-destructive bg-destructive/10' : 'border-border hover:border-destructive/40'
            )}>
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', decision === 'reject' ? 'bg-destructive' : 'bg-muted')}>
              <ThumbsDown className={cn('w-[22px] h-[22px]', decision === 'reject' ? 'text-destructive-foreground' : 'text-muted-foreground')} strokeWidth={2} />
            </div>
            <span className={cn('font-semibold text-[13.5px]', decision === 'reject' ? 'text-destructive' : 'text-foreground')}>Decline</span>
            <span className="text-[12px] text-muted-foreground text-center">Send rejection with care</span>
          </button>
        </div>

        {decision && (
          <div className="mt-4 space-y-1.5">
            <Label>
              {decision === 'hire' ? 'Notes for the offer team (optional)' : 'Reason (shown to candidate)'}
            </Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder={decision === 'hire' ? 'Any context for the hiring manager…' : 'e.g. We decided to move forward with candidates whose experience more closely aligns with our current needs.'}
              className="resize-none" />
          </div>
        )}
        </CardContent>
      </ViewfinderCard>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setLocation(`/recruiter/interviews/${interview.id}/feedback`)}>
          Back to Feedback
        </Button>
        <Button data-testid="btn-confirm-decision" className="flex-1 gap-2" disabled={!decision} onClick={handleSubmit}>
          <Send className="w-[15px] h-[15px]" /> Confirm Decision
        </Button>
      </div>
    </div>
  );
}
