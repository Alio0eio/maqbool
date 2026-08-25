import { useLocation, useParams } from 'wouter';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { AITag, MatchScoreBadge } from '@/components/shared/badges';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { VideoScrubber } from '@/components/shared/video-scrubber';
import { Button } from '@workspace/design-system/button';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { CardContent, CardHeader, CardTitle } from '@workspace/design-system/card';
import { MOCK_INTERVIEWS, INTERVIEW_QUESTIONS } from '@/lib/mock-data';
import { cn } from '@workspace/design-system/utils';
import NotFound from '@/pages/not-found';

const CRITERIA_SCORES = [
  { criterion: 'Communication', score: 92 },
  { criterion: 'Problem Solving', score: 88 },
  { criterion: 'Technical Depth', score: 85 },
  { criterion: 'Culture Fit', score: 90 },
  { criterion: 'Leadership', score: 78 },
];

function scoreClasses(score: number) {
  if (score >= 85) return { text: 'text-success', bg: 'bg-success' };
  if (score >= 70) return { text: 'text-amber-600', bg: 'bg-amber-500' };
  return { text: 'text-destructive', bg: 'bg-destructive' };
}

export default function InterviewFeedback() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const interview = MOCK_INTERVIEWS.find(i => i.id === Number(params.id));

  if (!interview || interview.status !== 'completed') return <NotFound />;

  const candidate = interview.application?.candidate;
  const job = interview.application?.job;

  // The questions reviewed in this session, and an honest overall duration +
  // per-question boundaries derived from their real time limits (not decoration).
  const reviewedQuestions = INTERVIEW_QUESTIONS.slice(0, 3);
  const totalDurationSeconds = reviewedQuestions.reduce((sum, q) => sum + q.timeLimit, 0);
  const markers = reviewedQuestions.slice(1).map((_, i) => {
    const cumulative = reviewedQuestions.slice(0, i + 1).reduce((sum, q) => sum + q.timeLimit, 0);
    return { position: cumulative / totalDurationSeconds, label: `Question ${i + 2}` };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview Answer Review"
        eyebrow={`${candidate?.name ?? 'Candidate'} · ${job?.title ?? 'Role'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg text-muted-foreground"
              onClick={() => setLocation('/recruiter/interviews')}
              aria-label="Back to interviews"
            >
              <ArrowLeft size={18} />
            </Button>
            <Button data-testid="btn-make-decision" onClick={() => setLocation(`/recruiter/interviews/${interview.id}/decision`)}>
              Make Decision
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scores */}
        <div className="space-y-4">
          <ViewfinderCard className="shadow-sm p-5">
            <div className="flex items-center gap-1 mb-4"><AITag /><span className="font-semibold text-sm">AI Overall Score</span></div>
            <div className="flex items-center justify-center py-4">
              <MatchScoreBadge score={interview.application?.aiScore ?? 87} size="lg" />
            </div>
            <div className="text-center mt-2">
              <span className="text-sm font-semibold text-success">Recommended: Hire</span>
            </div>
          </ViewfinderCard>

          <ViewfinderCard className="shadow-sm p-5">
            <h3 className="font-display font-semibold text-sm text-foreground mb-4">Criteria Breakdown</h3>
            <div className="space-y-3">
              {CRITERIA_SCORES.map(({ criterion, score }) => {
                const { text, bg } = scoreClasses(score);
                return (
                  <div key={criterion}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{criterion}</span>
                      <span className={cn('font-mono font-semibold', text)}>{score}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', bg)} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ViewfinderCard>

          <ViewfinderCard className="shadow-sm p-5">
            <h3 className="font-display font-semibold text-sm text-foreground mb-3">Actions</h3>
            <div className="space-y-2">
              <Button
                data-testid="btn-view-summary"
                variant="outline"
                className="w-full"
                onClick={() => setLocation(`/recruiter/interviews/${interview.id}/summary`)}
              >
                View AI Summary
              </Button>
              <Button
                data-testid="btn-decision"
                className="w-full"
                onClick={() => setLocation(`/recruiter/interviews/${interview.id}/decision`)}
              >
                Proceed to Decision
              </Button>
            </div>
          </ViewfinderCard>
        </div>

        {/* Right: Recording + detailed feedback */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recorded interview playback */}
          <ViewfinderCard className="shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border bg-surface-subtle/50 py-4">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={candidate?.avatarUrl || ''} alt={candidate?.name ?? ''} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {candidate?.name ? candidate.name.substring(0, 2).toUpperCase() : '—'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base font-display">Recorded Responses</CardTitle>
                <p className="text-xs text-muted-foreground font-mono">
                  {reviewedQuestions.length} QUESTIONS · {Math.floor(totalDurationSeconds / 60)}:{(totalDurationSeconds % 60).toString().padStart(2, '0')} TOTAL
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <VideoScrubber durationSeconds={totalDurationSeconds} markers={markers} />
            </CardContent>
          </ViewfinderCard>

          {/* AI Summary */}
          <ViewfinderCard className="shadow-sm p-5">
            <div className="flex items-center gap-1 mb-3"><AITag /><span className="font-semibold text-sm">AI-Generated Summary</span></div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Alex demonstrated exceptional communication skills throughout the interview, articulating complex design decisions with clarity and confidence. Their portfolio walkthrough revealed deep expertise in systems thinking and accessibility. The candidate showed strong cultural alignment with Stratos's values of user-centrism and data-driven decision making.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle size={14} className="text-success" />
                  <span className="text-xs font-semibold text-foreground">Strengths</span>
                </div>
                {['Fintech design experience', 'Accessibility expertise', 'Strong systems thinking', 'Excellent portfolio depth'].map(s => (
                  <div key={s} className="flex items-start gap-1.5 mb-1">
                    <span className="text-success mt-0.5">·</span>
                    <span className="text-xs text-muted-foreground">{s}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">Considerations</span>
                </div>
                {['Limited direct B2B enterprise exposure', 'May need onboarding to internal tools'].map(c => (
                  <div key={c} className="flex items-start gap-1.5 mb-1">
                    <span className="text-amber-500 mt-0.5">·</span>
                    <span className="text-xs text-muted-foreground">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </ViewfinderCard>

          {/* Q&A responses */}
          <ViewfinderCard className="shadow-sm p-5">
            <h3 className="font-display font-semibold text-sm text-foreground mb-4">Response Analysis by Question</h3>
            <div className="space-y-5">
              {reviewedQuestions.map((q, i) => (
                <div key={q.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                  </div>
                  <div className="ml-7 space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {i === 0 ? 'The candidate provided a detailed walkthrough of a fintech dashboard redesign, explaining their research process, ideation, and final implementation. They quantified impact with specific metrics.' :
                       i === 1 ? 'Demonstrated clear understanding of design system governance and token architecture. Referenced their work at Plaid as a concrete example with measurable outcomes.' :
                       'Described a situation where they advocated for reduced cognitive load in a trading interface, backed it with usability data, and successfully influenced the product roadmap.'}
                    </p>
                    <div className="flex items-center gap-2">
                      <AITag>AI Score</AITag>
                      <span className="text-xs font-mono font-semibold text-success">{90 - i * 4}%</span>
                      <span className="text-xs text-muted-foreground font-mono">· {Math.floor(q.timeLimit / 60)}:{(q.timeLimit % 60).toString().padStart(2, '0')} limit</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ViewfinderCard>
        </div>
      </div>
    </div>
  );
}
