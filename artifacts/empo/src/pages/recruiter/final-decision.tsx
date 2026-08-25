import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Gift, Mail, CheckCircle } from 'lucide-react';
import { MatchScoreBadge, AITag } from '@/components/shared/badges';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { Button } from '@workspace/design-system/button';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { toast } from '@workspace/design-system/hooks/use-toast';
import { MOCK_CANDIDATES, MOCK_APPLICATIONS } from '@/lib/mock-data';
import { cn } from '@workspace/design-system/utils';

export default function FinalDecision() {
  const [, setLocation] = useLocation();
  const [action, setAction] = useState<'offer' | 'reject' | null>(null);
  const [done, setDone] = useState(false);
  const candidate = MOCK_CANDIDATES[0];
  const application = MOCK_APPLICATIONS.find(a => a.candidateId === candidate.id);
  const aiScore = application?.aiScore ?? 96;
  // skillMatch isn't a real API field — derive it from aiScore the same way
  // the old mock-data legacy adapter used to.
  const skillMatch = Math.min(99, aiScore + 4);

  function handleConfirm() {
    setDone(true);
    toast({
      title: action === 'offer' ? 'Offer initiated' : 'Rejection sent',
      description: action === 'offer'
        ? `${candidate.name} will receive an offer letter shortly.`
        : `${candidate.name} has been notified with your message.`,
    });
    setTimeout(() => setLocation('/recruiter/offers'), 1500);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <PageHeader
        title="Final Hiring Decision"
        eyebrow={`${candidate.name} · ${application?.job?.title ?? 'Role'}`}
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg text-muted-foreground"
            onClick={() => setLocation('/recruiter/interviews')}
            aria-label="Back to interviews"
          >
            <ArrowLeft size={18} />
          </Button>
        }
      />

      <ViewfinderCard className="shadow-sm p-6">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
          <Avatar className="w-16 h-16">
            <AvatarImage src={candidate.avatarUrl || ""} alt={candidate.name} />
            <AvatarFallback className="bg-primary text-white font-bold text-xl font-display">
              {candidate.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">{candidate.name}</h2>
            <p className="text-sm text-muted-foreground">{candidate.headline}</p>
            <div className="flex items-center gap-2 mt-1">
              <AITag />
              <MatchScoreBadge score={aiScore} size="sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center mb-5">
          {[{ label: 'Skill Match', value: `${skillMatch}%` }, { label: 'Experience', value: `${candidate.yearsOfExp} years` }, { label: 'AI Rec.', value: 'Strong Hire' }].map(({ label, value }) => (
            <div key={label} className="p-3 bg-surface-subtle rounded-xl">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="text-sm font-display font-bold text-foreground">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button data-testid="btn-extend-offer"
            onClick={() => setAction('offer')}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
              action === 'offer' ? 'border-success bg-success/10' : 'border-border hover:border-success/40'
            )}>
            <Gift size={24} className={action === 'offer' ? 'text-success' : 'text-muted-foreground'} />
            <span className={cn('text-sm font-display font-semibold', action === 'offer' ? 'text-success' : 'text-foreground')}>Extend Offer</span>
            <span className="text-xs text-muted-foreground text-center">Create and send an offer letter</span>
          </button>
          <button data-testid="btn-reject"
            onClick={() => setAction('reject')}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
              action === 'reject' ? 'border-destructive bg-destructive/10' : 'border-border hover:border-destructive/40'
            )}>
            <Mail size={24} className={action === 'reject' ? 'text-destructive' : 'text-muted-foreground'} />
            <span className={cn('text-sm font-display font-semibold', action === 'reject' ? 'text-destructive' : 'text-foreground')}>Send Rejection</span>
            <span className="text-xs text-muted-foreground text-center">Notify with a personalized message</span>
          </button>
        </div>
      </ViewfinderCard>

      <Button
        data-testid="btn-confirm"
        disabled={!action || done}
        onClick={handleConfirm}
        className={cn('w-full gap-2', done && 'bg-success hover:bg-success')}
      >
        {done ? <><CheckCircle size={16} /> Decision Recorded!</> : 'Confirm Decision'}
      </Button>
    </div>
  );
}
