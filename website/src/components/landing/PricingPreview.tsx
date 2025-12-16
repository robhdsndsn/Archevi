import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Starter',
    price: '$14.99',
    period: '/month',
    description: 'Perfect for small families getting started.',
    features: [
      '5 family members',
      '10GB storage',
      '~150 AI queries/month',
      'Email support',
      'All core features',
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=starter',
    popular: false,
  },
  {
    name: 'Family',
    price: '$24.99',
    period: '/month',
    description: 'For families who need more power.',
    features: [
      'Unlimited family members',
      '50GB storage',
      '~400 AI queries/month',
      'Priority support',
      'Advanced features',
      'Document sharing',
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=family',
    popular: true,
  },
  {
    name: 'Family Office',
    price: 'Custom',
    period: '',
    description: 'For estates and family offices.',
    features: [
      'Dedicated infrastructure',
      'Unlimited everything',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    href: '/contact?type=enterprise',
    popular: false,
  },
];

export function PricingPreview() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you need more. All plans include a 14-day
            free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular
                  ? 'border-primary shadow-lg'
                  : 'border-2'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="mb-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View full pricing link */}
        <div className="mt-12 text-center">
          <Button variant="link" asChild>
            <Link href="/pricing">
              View full pricing details
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
