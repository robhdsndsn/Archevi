'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface Plan {
  name: string;
  description: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Starter',
    description: 'Perfect for small families getting started',
    monthlyPrice: 14.99,
    yearlyPrice: 124.99,
    features: [
      '5 family members',
      '10GB storage',
      '~150 AI queries/month',
      'Email support',
      'Basic document categories',
      'Search history',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/signup?plan=starter',
  },
  {
    name: 'Family',
    description: 'For growing families who need more',
    monthlyPrice: 24.99,
    yearlyPrice: 207.99,
    features: [
      'Unlimited family members',
      '50GB storage',
      '~400 AI queries/month',
      'Priority email support',
      'Advanced categories & tags',
      'Document sharing',
      'Expiry date alerts',
      'Voice note transcription',
      'API access',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/signup?plan=family',
    popular: true,
  },
  {
    name: 'Family Office',
    description: 'For estates and multi-family organizations',
    monthlyPrice: null,
    yearlyPrice: null,
    features: [
      'Everything in Family, plus:',
      'Dedicated infrastructure',
      'Unlimited AI queries',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated account manager',
      'On-premise option',
      'Audit logging',
      'PIPEDA compliance support',
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact',
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (plan: Plan) => {
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    if (price === null) return 'Custom';
    return `$${price.toFixed(2)}`;
  };

  const getPeriod = (plan: Plan) => {
    if (plan.monthlyPrice === null) return '';
    return isYearly ? '/year' : '/month';
  };

  const getSavings = (plan: Plan) => {
    if (!plan.monthlyPrice || !plan.yearlyPrice) return null;
    const yearlyCost = plan.monthlyPrice * 12;
    const savings = yearlyCost - plan.yearlyPrice;
    return savings.toFixed(0);
  };

  return (
    <div className="container mx-auto px-4">
      {/* Billing Toggle */}
      <div className="mb-12 flex items-center justify-center gap-4">
        <span
          className={`text-sm ${!isYearly ? 'font-medium' : 'text-muted-foreground'}`}
        >
          Monthly
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
          aria-label="Toggle yearly billing"
        />
        <span
          className={`text-sm ${isYearly ? 'font-medium' : 'text-muted-foreground'}`}
        >
          Yearly
        </span>
        {isYearly && (
          <Badge variant="secondary" className="ml-2">
            Save 2 months
          </Badge>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col ${
              plan.popular ? 'border-primary shadow-lg' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold">{formatPrice(plan)}</span>
                <span className="text-muted-foreground">{getPeriod(plan)}</span>
                {isYearly && getSavings(plan) && (
                  <p className="mt-1 text-sm text-green-600">
                    Save ${getSavings(plan)}/year
                  </p>
                )}
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                asChild
              >
                <Link href={plan.ctaLink}>{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Trust badges */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>14-day free trial &bull; No credit card required &bull; Cancel anytime</p>
        <p className="mt-2">
          All prices in CAD. Taxes may apply.
        </p>
      </div>
    </div>
  );
}
