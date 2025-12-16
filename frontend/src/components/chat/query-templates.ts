import {
  Shield,
  Heart,
  DollarSign,
  Scale,
  Users,
  Calendar,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export interface QueryTemplate {
  id: string;
  query: string;
  description?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  templates: QueryTemplate[];
}

export const QUERY_TEMPLATES: TemplateCategory[] = [
  {
    id: 'insurance',
    name: 'Insurance',
    icon: Shield,
    templates: [
      { id: 'ins-1', query: 'What insurance policies do I have?', description: 'List all active policies' },
      { id: 'ins-2', query: 'When does my auto insurance expire?', description: 'Check renewal date' },
      { id: 'ins-3', query: 'What is my health insurance deductible?', description: 'Coverage details' },
      { id: 'ins-4', query: 'Show me my homeowners insurance coverage', description: 'Property coverage' },
      { id: 'ins-5', query: 'What is my life insurance policy worth?', description: 'Benefit amounts' },
    ],
  },
  {
    id: 'medical',
    name: 'Medical',
    icon: Heart,
    templates: [
      { id: 'med-1', query: 'List all my medical records', description: 'Health documents' },
      { id: 'med-2', query: 'When was my last doctor visit?', description: 'Recent appointments' },
      { id: 'med-3', query: 'What medications am I taking?', description: 'Current prescriptions' },
      { id: 'med-4', query: 'Show me my vaccination records', description: 'Immunization history' },
      { id: 'med-5', query: 'What are my known allergies?', description: 'Allergy information' },
    ],
  },
  {
    id: 'financial',
    name: 'Financial',
    icon: DollarSign,
    templates: [
      { id: 'fin-1', query: 'Show me my financial documents', description: 'All finance records' },
      { id: 'fin-2', query: 'What bank accounts do I have?', description: 'Account listing' },
      { id: 'fin-3', query: 'Find my recent tax documents', description: 'Tax returns and forms' },
      { id: 'fin-4', query: 'What investment accounts do I have?', description: 'Investment portfolio' },
      { id: 'fin-5', query: 'Show me my mortgage documents', description: 'Home loan details' },
    ],
  },
  {
    id: 'legal',
    name: 'Legal',
    icon: Scale,
    templates: [
      { id: 'leg-1', query: 'Where is my will stored?', description: 'Estate documents' },
      { id: 'leg-2', query: 'Who are my beneficiaries?', description: 'Designated recipients' },
      { id: 'leg-3', query: 'When do my legal documents expire?', description: 'Renewal dates' },
      { id: 'leg-4', query: 'Show me my power of attorney documents', description: 'POA records' },
      { id: 'leg-5', query: 'Find my property deeds', description: 'Real estate ownership' },
    ],
  },
  {
    id: 'family',
    name: 'Family',
    icon: Users,
    templates: [
      { id: 'fam-1', query: 'Show me family photos', description: 'Photo collection' },
      { id: 'fam-2', query: 'What recipes do we have saved?', description: 'Recipe collection' },
      { id: 'fam-3', query: 'Find birthday information for family members', description: 'Important dates' },
      { id: 'fam-4', query: 'Show me our family medical history', description: 'Health background' },
      { id: 'fam-5', query: 'Find contact information for family', description: 'Contact details' },
    ],
  },
  {
    id: 'dates',
    name: 'Important Dates',
    icon: Calendar,
    templates: [
      { id: 'dat-1', query: 'What documents are expiring soon?', description: 'Upcoming renewals' },
      { id: 'dat-2', query: 'Show me documents from this year', description: 'Recent records' },
      { id: 'dat-3', query: 'When are my subscriptions renewing?', description: 'Subscription dates' },
      { id: 'dat-4', query: 'Find documents from last month', description: 'Recent additions' },
      { id: 'dat-5', query: 'What warranties are still active?', description: 'Warranty coverage' },
    ],
  },
  {
    id: 'general',
    name: 'General',
    icon: FileText,
    templates: [
      { id: 'gen-1', query: 'Show me my most recent documents', description: 'Latest additions' },
      { id: 'gen-2', query: 'What types of documents do I have?', description: 'Document overview' },
      { id: 'gen-3', query: 'Find documents tagged with important', description: 'Priority items' },
      { id: 'gen-4', query: 'Show me all PDFs', description: 'PDF documents' },
      { id: 'gen-5', query: 'Search for receipts', description: 'Purchase records' },
    ],
  },
];

// Featured templates shown on the welcome screen (one from each major category)
export const FEATURED_TEMPLATES: QueryTemplate[] = [
  QUERY_TEMPLATES[0].templates[0], // Insurance - policies
  QUERY_TEMPLATES[1].templates[0], // Medical - records
  QUERY_TEMPLATES[2].templates[2], // Financial - tax docs
  QUERY_TEMPLATES[5].templates[0], // Dates - expiring soon
];

// Get all templates flattened
export function getAllTemplates(): QueryTemplate[] {
  return QUERY_TEMPLATES.flatMap(cat => cat.templates);
}

// Search templates by query
export function searchTemplates(query: string): QueryTemplate[] {
  const lowerQuery = query.toLowerCase();
  return getAllTemplates().filter(
    t => t.query.toLowerCase().includes(lowerQuery) ||
         (t.description && t.description.toLowerCase().includes(lowerQuery))
  );
}
