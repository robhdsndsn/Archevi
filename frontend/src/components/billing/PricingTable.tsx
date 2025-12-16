import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X, Sparkles, Crown, Building2, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLANS, type Plan, type TenantPlan, type BillingInterval } from '@/api/windmill/types';

interface PricingTableProps {
  currentPlan?: TenantPlan;
  onSelectPlan?: (planId: TenantPlan, interval: BillingInterval) => void;
  showCurrentBadge?: boolean;
  className?: string;
}

const PLAN_ICONS: Record<TenantPlan, React.ReactNode> = {
  trial: <Rocket className="h-5 w-5" />,
  starter: <Sparkles className="h-5 w-5" />,
  family: <Crown className="h-5 w-5" />,
  family_office: <Building2 className="h-5 w-5" />,
};

export function PricingTable({
  currentPlan,
  onSelectPlan,
  showCurrentBadge = true,
  className,
}: PricingTableProps) {
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  const getPrice = (plan: Plan) => {
    if (plan.pricing.monthly === 0) return 'Free';
    return interval === 'yearly' ? plan.pricing.yearly : plan.pricing.monthly;
  };

  const getButtonText = (plan: Plan) => {
    if (currentPlan === plan.id) return 'Current Plan';
    if (plan.id === 'trial') return 'Start Free Trial';
    if (currentPlan === 'trial' || !currentPlan) return 'Get Started';

    const currentIndex = PLANS.findIndex(p => p.id === currentPlan);
    const planIndex = PLANS.findIndex(p => p.id === plan.id);
    return planIndex > currentIndex ? 'Upgrade' : 'Downgrade';
  };

  const isCurrentPlan = (plan: Plan) => currentPlan === plan.id;

  // Filter out trial plan for display if user already has a plan
  const displayPlans = currentPlan && currentPlan !== 'trial'
    ? PLANS.filter(p => p.id !== 'trial')
    : PLANS;

  return (
    <div className={cn('space-y-8', className)}>
      {/* Billing interval toggle */}
      <div className="flex items-center justify-center gap-4">
        <Label
          htmlFor="billing-toggle"
          className={cn(
            'cursor-pointer transition-colors',
            interval === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={interval === 'yearly'}
          onCheckedChange={(checked) => setInterval(checked ? 'yearly' : 'monthly')}
        />
        <Label
          htmlFor="billing-toggle"
          className={cn(
            'cursor-pointer transition-colors flex items-center gap-2',
            interval === 'yearly' ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Yearly
          <Badge variant="secondary" className="text-xs">Save up to 22%</Badge>
        </Label>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayPlans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'relative flex flex-col transition-all',
              plan.highlight && 'border-primary shadow-lg scale-[1.02]',
              isCurrentPlan(plan) && 'ring-2 ring-primary'
            )}
          >
            {/* Badges */}
            <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2">
              {plan.badge && (
                <Badge className="bg-primary text-primary-foreground">
                  {plan.badge}
                </Badge>
              )}
              {showCurrentBadge && isCurrentPlan(plan) && (
                <Badge variant="outline" className="bg-background">
                  Current Plan
                </Badge>
              )}
            </div>

            <CardHeader className="text-center pt-8">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                {PLAN_ICONS[plan.id]}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-6">
              {/* Price */}
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">
                    {typeof getPrice(plan) === 'number' ? `$${getPrice(plan)}` : getPrice(plan)}
                  </span>
                  {plan.pricing.monthly > 0 && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
                {interval === 'yearly' && plan.pricing.savings && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    Save {plan.pricing.savings}% with annual billing
                  </p>
                )}
                {interval === 'yearly' && plan.pricing.yearlyTotal > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ${plan.pricing.yearlyTotal} billed annually
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <span className={cn(!feature.included && 'text-muted-foreground')}>
                      {feature.name}
                      {feature.limit && (
                        <span className="text-muted-foreground ml-1">
                          ({feature.limit})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Limits summary */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="font-medium">
                    {plan.limits.storageGb === 'unlimited' ? 'Unlimited' : `${plan.limits.storageGb} GB`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Budget</span>
                  <span className="font-medium">
                    {plan.limits.aiAllowanceUsd === 'unlimited' ? 'Unlimited' : `$${plan.limits.aiAllowanceUsd}/mo`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-medium">
                    {plan.limits.members === 'unlimited' ? 'Unlimited' : plan.limits.members}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={plan.highlight ? 'default' : 'outline'}
                disabled={isCurrentPlan(plan)}
                onClick={() => onSelectPlan?.(plan.id, interval)}
              >
                {getButtonText(plan)}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Enterprise callout */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Need a custom solution?{' '}
          <Button variant="link" className="h-auto p-0 text-sm">
            Contact us for Enterprise pricing
          </Button>
        </p>
      </div>
    </div>
  );
}
