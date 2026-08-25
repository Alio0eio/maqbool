import { useState } from 'react';
import { Check, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { Card, CardContent } from '@workspace/design-system/card';
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Billing & Plan"
        eyebrow={`${plan.label.toUpperCase()} PLAN · RENEWS ${RENEWAL_DATE.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
        description="Manage your subscription and payment details."
      />

      {/* Current plan */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Current Plan</div>
              <div className="text-xl font-display font-bold text-foreground">{plan.label}</div>
              <div className="text-sm text-muted-foreground mt-1 font-mono">
                {plan.price !== null ? `$${plan.price}/month` : 'Custom pricing'} · Renews {RENEWAL_DATE.toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Jobs Used</div>
                <div className="text-lg font-display font-bold text-foreground">
                  4 <span className="text-sm font-normal text-muted-foreground">/ {plan.jobs ?? '∞'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Candidates</div>
                <div className="text-lg font-display font-bold text-foreground">
                  179 <span className="text-sm font-normal text-muted-foreground">/ {plan.candidates ?? '∞'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Candidates used</span>
              <span className="font-medium font-mono">179 / {plan.candidates ?? '∞'}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: plan.candidates ? `${Math.min(100, (179 / plan.candidates) * 100)}%` : '20%' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <ViewfinderCard
            key={p.key}
            data-testid={`plan-${p.key}`}
            className={cn('border-2 relative', p.key === currentPlan ? 'border-primary' : 'border-border')}
          >
            <CardContent className="p-5">
              {'popular' in p && p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-0.5 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="font-display font-bold text-foreground text-lg mb-1">{p.label}</div>
              {p.price !== null ? (
                <div className="mb-4">
                  <span className="text-3xl font-display font-bold text-foreground">${p.price}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
              ) : (
                <div className="text-2xl font-display font-bold text-foreground mb-4">Custom</div>
              )}
              <div className="space-y-2 mb-5">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="text-success shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Button
                data-testid={`btn-select-${p.key}`}
                variant={p.key === currentPlan ? 'default' : 'outline'}
                disabled={p.key === currentPlan}
                className="w-full"
                onClick={() => selectPlan(p.key)}
              >
                {p.key === currentPlan ? 'Current Plan' : p.key === 'enterprise' ? 'Contact Sales' : (p.price ?? 0) > (plan.price ?? 0) ? 'Upgrade' : 'Downgrade'}
              </Button>
            </CardContent>
          </ViewfinderCard>
        ))}
      </div>

      {/* Payment method */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Payment Method</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
              <CreditCard size={20} className="text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium text-sm text-foreground">Visa ending in 4242</div>
              <div className="text-xs text-muted-foreground font-mono">Expires 08/2028</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => toast({ title: 'Update payment method', description: "This would open a secure payment form in the full product." })}
            >
              Update
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
