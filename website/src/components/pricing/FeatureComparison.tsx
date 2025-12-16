import { Check, Minus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Feature {
  name: string;
  starter: boolean | string;
  family: boolean | string;
  familyOffice: boolean | string;
}

const features: Feature[] = [
  {
    name: 'Family members',
    starter: '5',
    family: 'Unlimited',
    familyOffice: 'Unlimited',
  },
  {
    name: 'Storage',
    starter: '10GB',
    family: '50GB',
    familyOffice: 'Custom',
  },
  {
    name: 'AI queries/month',
    starter: '~150',
    family: '~400',
    familyOffice: 'Unlimited',
  },
  {
    name: 'Document upload',
    starter: true,
    family: true,
    familyOffice: true,
  },
  {
    name: 'Natural language search',
    starter: true,
    family: true,
    familyOffice: true,
  },
  {
    name: 'AI-powered extraction',
    starter: true,
    family: true,
    familyOffice: true,
  },
  {
    name: 'Basic categories',
    starter: true,
    family: true,
    familyOffice: true,
  },
  {
    name: 'Custom categories & tags',
    starter: false,
    family: true,
    familyOffice: true,
  },
  {
    name: 'Document sharing',
    starter: false,
    family: true,
    familyOffice: true,
  },
  {
    name: 'Expiry date alerts',
    starter: false,
    family: true,
    familyOffice: true,
  },
  {
    name: 'Voice note transcription',
    starter: false,
    family: true,
    familyOffice: true,
  },
  {
    name: 'API access',
    starter: false,
    family: true,
    familyOffice: true,
  },
  {
    name: 'Email support',
    starter: true,
    family: true,
    familyOffice: true,
  },
  {
    name: 'Priority support',
    starter: false,
    family: true,
    familyOffice: true,
  },
  {
    name: 'Dedicated account manager',
    starter: false,
    family: false,
    familyOffice: true,
  },
  {
    name: 'Custom integrations',
    starter: false,
    family: false,
    familyOffice: true,
  },
  {
    name: 'Dedicated infrastructure',
    starter: false,
    family: false,
    familyOffice: true,
  },
  {
    name: 'SLA guarantee',
    starter: false,
    family: false,
    familyOffice: true,
  },
  {
    name: 'Audit logging',
    starter: false,
    family: false,
    familyOffice: true,
  },
  {
    name: 'PIPEDA compliance support',
    starter: false,
    family: false,
    familyOffice: true,
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="font-medium">{value}</span>;
  }
  if (value) {
    return <Check className="mx-auto h-5 w-5 text-primary" />;
  }
  return <Minus className="mx-auto h-5 w-5 text-muted-foreground/40" />;
}

export function FeatureComparison() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
        Compare Plans
      </h2>
      <div className="mx-auto max-w-4xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Feature</TableHead>
              <TableHead className="text-center">Starter</TableHead>
              <TableHead className="text-center">Family</TableHead>
              <TableHead className="text-center">Family Office</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feature) => (
              <TableRow key={feature.name}>
                <TableCell className="font-medium">{feature.name}</TableCell>
                <TableCell className="text-center">
                  <FeatureCell value={feature.starter} />
                </TableCell>
                <TableCell className="text-center">
                  <FeatureCell value={feature.family} />
                </TableCell>
                <TableCell className="text-center">
                  <FeatureCell value={feature.familyOffice} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
