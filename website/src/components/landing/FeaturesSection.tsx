import {
  Search,
  Brain,
  Bell,
  Mic,
  Users,
  Shield,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Search,
    title: 'Natural Language Search',
    description:
      'Ask questions in plain English. "What\'s our home insurance deductible?" No more hunting through folders.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Extraction',
    description:
      'Automatic categorization, tagging, and expiry date detection. Your documents organize themselves.',
  },
  {
    icon: Bell,
    title: 'Expiry Alerts',
    description:
      'Never miss a renewal date. Get notified before passports, insurance policies, and warranties expire.',
  },
  {
    icon: Mic,
    title: 'Voice Notes',
    description:
      'Record thoughts and memos on the go. Automatic transcription in 80+ languages.',
  },
  {
    icon: Users,
    title: 'Family Collaboration',
    description:
      'Share documents with family members. Role-based access controls keep sensitive info private.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description:
      'Your data stays yours. Encrypted storage, tenant isolation, and never used for AI training.',
  },
];

const advancedFeatures = [
  {
    icon: FileText,
    title: 'Document Versioning',
    description: 'Track changes over time with full version history and rollback.',
  },
  {
    icon: Clock,
    title: 'Family Timeline',
    description: 'Visual chronology of births, weddings, achievements, and milestones.',
  },
  {
    icon: Sparkles,
    title: 'Biography Generator',
    description: 'AI-powered narratives for family members based on their documents.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Everything you need to manage family documents
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed for real families. Simple enough for
            everyone, sophisticated enough for any document.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-2 transition-colors hover:border-primary/50">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Advanced Features */}
        <div className="mt-16">
          <h3 className="mb-8 text-center text-2xl font-bold">
            Plus advanced features for preserving family history
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {advancedFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 rounded-lg border p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
