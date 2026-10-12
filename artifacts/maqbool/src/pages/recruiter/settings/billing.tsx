import { useState } from 'react';
import { Check, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { RingGauge } from '@/components/shared/ring-gauge';
import { ConfirmAction } from '@/components/shared/confirm-action';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/design-system/card';
import { Button } from '@workspace/design-system/button';
import { toast } from '@workspace/design-system/hooks/use-toast';
import { cn } from '@workspace/design-system/utils';

const PLANS = [
  { key: 'starter', label: 'Starter', price: 99, jobs: 5, candidates: 50, features: ['5 active jobs', '50 candidates/month', 'Basic analytics', 'Email support'] },
  { key: 'professional', label: 'Professional', price: 299, jobs: 25, candidates: 250, features: ['25 active jobs', '250 candidates/month', 'AI ranking & scoring', 'Async video interviews', 'Advanced analytics', 'Priority support'], popular: true },
  { key: 'enterprise', label: 'Enterprise', price: null as number | null, jobs: null as number | null, candidates: null as number | null, features: ['Unlimited jobs', 'Unlimited candidates', 'Custom AI training', 'SSO & SAML', 'Dedicated CSM', 'SLA guarantee'] },
] as const;

const RENEWAL_DATE = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);

export default function Billing() {
  const [currentPlan, setCurrentPlan] = useState<(typeof PLANS)[number]['key']>('professional');
  const [cancelled, setCancelled] = useState(false);
  const plan = PLANS.find((p) => p.key === currentPlan)!;

  function selectPlan(key: (typeof PLANS)[number]['key']) {
    if (key === 'enterprise') {
      toast({ title: 'Request sent', description: 'A sales rep will reach out about the Enterprise plan.' });
      return;
    }
    if (key === currentPlan) return;
    const target = PLANS.find((p) => p.key === key)!;
    const isUpgrade = (target.price ?? Infinity) > (plan.price ?? 0);
    setCurrentPlan(key);
    toast({
      title: isUpgrade ? 'Plan upgraded' : 'Plan downgraded',
      description: `You're now on the ${target.label} plan.`,
    });
  }

  function cancelSubscription() {
    setCancelled(true);
    toast({
      title: 'Subscription cancelled',
      description: `Your plan stays active until ${RENEWAL_DATE.toLocaleDateString()}, then your account moves to the free tier.`,
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Billing & Plan"
        eyebrow={`${plan.label} plan · renews ${RENEWAL_DATE.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
        description="Manage your subscription and payment details."
      />

      {/* Current plan */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid sm:grid-cols-[1.2fr_1fr_1fr] gap-6 items-center p-6 bg-gradient-to-br from-primary/[0.05] to-transparent">
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-muted-foreground mb-1">Current plan</div>
              <div className="text-[24px] font-semibold text-foreground tracking-[-0.02em]">{plan.label}</div>
              <div className="text-[13px] text-muted-foreground mt-1">
                {plan.price !== null ? `$${plan.price}/month` : 'Custom pricing'} · Renews {RENEWAL_DATE.toLocaleDateString()}
              </div>
            </div>
            <RingGauge
              size={104}
              value={plan.jobs ? Math.min(100, Math.round((4 / plan.jobs) * 100)) : 20}
              label="Jobs used"
              caption={`4 of ${plan.jobs ?? '∞'}`}
              tone="text-primary"
            />
            <RingGauge
              size={104}
              value={plan.candidates ? Math.min(100, Math.round((179 / plan.candidates) * 100)) : 20}
              label="Candidates used"
              caption={`179 of ${plan.candidates ?? '∞'}`}
              tone="text-secondary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <Card
            key={p.key}
            data-testid={`plan-${p.key}`}
            className={cn(
              'relative border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
              'popular' in p && p.popular && 'bg-gradient-to-b from-primary to-[hsl(222_85%_28%)] text-primary-foreground border-primary shadow-[0_24px_50px_-20px_hsl(var(--primary)/0.7)]',
              !('popular' in p && p.popular) && (p.key === currentPlan ? 'border-primary' : 'border-border/70'),
            )}
          >
            <CardContent className="p-6">
              {'popular' in p && p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-0.5 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="text-[17px] font-semibold tracking-[-0.01em] mb-1">{p.label}</div>
              {p.price !== null ? (
                <div className="mb-4">
                  <span className="text-[34px] font-semibold tracking-[-0.03em]">${p.price}</span>
                  <span className="opacity-70 text-[13px]">/month</span>
                </div>
              ) : (
                <div className="text-[30px] font-semibold tracking-[-0.03em] mb-4">Custom</div>
              )}
              <div className="space-y-2 mb-5">
                {p.features.map((f) => (
                  <div key={f} className={cn("flex items-center gap-2 text-[13px]", 'popular' in p && p.popular ? "text-primary-foreground/85" : "text-muted-foreground")}>
                    <Check size={14} className={cn("shrink-0", 'popular' in p && p.popular ? "text-emerald-300" : "text-success")} />
                    {f}
                  </div>
                ))}
              </div>
              <Button
                data-testid={`btn-select-${p.key}`}
                variant={'popular' in p && p.popular && p.key !== currentPlan ? 'secondary' : p.key === currentPlan ? 'default' : 'outline'}
                disabled={p.key === currentPlan}
                className={cn("w-full", 'popular' in p && p.popular && "bg-white text-primary hover:bg-white/90")}
                onClick={() => selectPlan(p.key)}
              >
                {p.key === currentPlan ? 'Current Plan' : p.key === 'enterprise' ? 'Contact Sales' : (p.price ?? 0) > (plan.price ?? 0) ? 'Upgrade' : 'Downgrade'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">Payment Method</CardTitle>
          <CardDescription>Used to charge your monthly subscription.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={20} className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium text-foreground">Visa ending in 4242</div>
              <div className="text-[12px] text-muted-foreground">Expires 08/2028</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto shrink-0"
              onClick={() => toast({ title: 'Update payment method', description: "This would open a secure payment form in the full product." })}
            >
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-[15px] text-destructive">Danger Zone</CardTitle>
          <CardDescription>Cancelling keeps your plan active until the current period ends, then moves your account to the free tier.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 text-[13px] text-muted-foreground">
              {cancelled
                ? `Subscription cancelled — access continues until ${RENEWAL_DATE.toLocaleDateString()}.`
                : 'This cannot be undone from this screen once the current period ends.'}
            </div>
            <ConfirmAction
              title="Cancel your subscription?"
              description={`Your plan stays active until ${RENEWAL_DATE.toLocaleDateString()}, then your account moves to the free tier.`}
              confirmLabel="Cancel subscription"
              onConfirm={cancelSubscription}
            >
              <Button variant="destructive" disabled={cancelled} className="shrink-0">
                {cancelled ? 'Cancelled' : 'Cancel Subscription'}
              </Button>
            </ConfirmAction>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
