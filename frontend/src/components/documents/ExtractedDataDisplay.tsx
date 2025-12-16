import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  DollarSign,
  User,
  Building,
  FileText,
  Phone,
  MapPin,
  Clock,
  Percent,
  Hash,
  Sparkles,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  ExtractedData,
  ExtractedDataV2,
  ExtractedItem,
  KeyItem,
  DocumentCategory
} from '@/api/windmill/types';

interface ExtractedDataDisplayProps {
  data: ExtractedData | null | undefined;
  category: DocumentCategory;
  className?: string;
  documentId?: number;
  tenantId?: string;
  onExtract?: (data: ExtractedData) => void;
}

// Icon mapping for v2 types
const TYPE_ICONS: Record<string, typeof Calendar> = {
  date: Calendar,
  amount: DollarSign,
  person: User,
  organization: Building,
  reference: Hash,
  contact: Phone,
  location: MapPin,
  duration: Clock,
  percentage: Percent,
  text: FileText,
};

// Importance colors
const IMPORTANCE_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

// Check if data is v2 format (has 'items' array)
function isV2Format(data: ExtractedData): data is ExtractedDataV2 {
  return 'items' in data && Array.isArray((data as ExtractedDataV2).items);
}

// Render a single extracted item (v2 format)
function ItemBadge({ item }: { item: ExtractedItem }) {
  const Icon = TYPE_ICONS[item.type] || FileText;
  const colorClass = IMPORTANCE_COLORS[item.importance] || IMPORTANCE_COLORS.medium;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs ${colorClass}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span className="font-medium">{item.label}:</span>
      <span>{item.value}</span>
    </div>
  );
}

// Render key items (dates, amounts, people, etc.)
function KeyItemsList({ items, icon: Icon, title }: { items: KeyItem[]; icon: typeof Calendar; title: string }) {
  if (!items || items.length === 0) return null;

  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-3 pb-3">
        <div className="flex items-start gap-2">
          <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              {title}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs font-normal">
                  <span className="font-medium mr-1">{item.label}:</span>
                  {item.value}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// V2 format display
function V2Display({ data }: { data: ExtractedDataV2 }) {
  const [showAllItems, setShowAllItems] = useState(false);

  const items = data.items || [];
  const summary = data.summary;
  const documentType = data.document_type;
  const keyDates = data.key_dates || [];
  const keyAmounts = data.key_amounts || [];
  const keyPeople = data.key_people || [];
  const keyOrganizations = data.key_organizations || [];
  const keyReferences = data.key_references || [];
  const highImportance = data.high_importance || [];

  // Show first 6 items by default, expand to show all
  const visibleItems = showAllItems ? items : items.slice(0, 6);
  const hasMoreItems = items.length > 6;

  return (
    <div className="space-y-4">
      {/* Document Type & Summary */}
      {(documentType || summary) && (
        <div className="space-y-1">
          {documentType && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{documentType}</span>
            </div>
          )}
          {summary && (
            <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
          )}
        </div>
      )}

      {/* High Importance Items */}
      {highImportance.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-red-600 dark:text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wide mb-1.5">
                  High Importance
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {highImportance.map((item, idx) => {
                    const Icon = TYPE_ICONS[item.type] || FileText;
                    return (
                      <Badge key={idx} variant="outline" className="text-xs border-red-300 dark:border-red-700 bg-white dark:bg-red-950/50">
                        <Icon className="h-3 w-3 mr-1" />
                        <span className="font-medium mr-1">{item.label}:</span>
                        {item.value}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Categories */}
      <div className="space-y-2">
        <KeyItemsList items={keyDates} icon={Calendar} title="Key Dates" />
        <KeyItemsList items={keyAmounts} icon={DollarSign} title="Key Amounts" />
        <KeyItemsList items={keyPeople} icon={User} title="Key People" />
        <KeyItemsList items={keyOrganizations} icon={Building} title="Organizations" />
        <KeyItemsList items={keyReferences} icon={Hash} title="References" />
      </div>

      {/* All Items */}
      {items.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                All Extracted Items ({items.length})
              </div>
              {hasMoreItems && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllItems(!showAllItems)}
                  className="h-6 text-xs"
                >
                  {showAllItems ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show All ({items.length})
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visibleItems.map((item, idx) => (
                <ItemBadge key={idx} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Legacy v1 format display (keep for backwards compatibility)
function V1Display({ data }: { data: ExtractedData }) {
  // Field display configuration for v1 format
  const FIELD_CONFIG: Record<string, { label: string; icon: typeof Calendar; format?: (v: unknown) => string }> = {
    policy_number: { label: 'Policy Number', icon: Hash },
    provider: { label: 'Provider', icon: Building },
    coverage_type: { label: 'Coverage Type', icon: FileText },
    coverage_amount: { label: 'Coverage Amount', icon: DollarSign, format: (v) => `$${Number(v).toLocaleString()}` },
    deductible: { label: 'Deductible', icon: DollarSign, format: (v) => `$${Number(v).toLocaleString()}` },
    premium: { label: 'Premium', icon: DollarSign, format: (v) => `$${Number(v).toLocaleString()}` },
    expiry_date: { label: 'Expiry Date', icon: Calendar },
    effective_date: { label: 'Effective Date', icon: Calendar },
    insured_name: { label: 'Insured', icon: User },
    patient_name: { label: 'Patient', icon: User },
    provider_name: { label: 'Provider', icon: Building },
    visit_date: { label: 'Visit Date', icon: Calendar },
    diagnosis: { label: 'Diagnosis', icon: FileText },
    medications: { label: 'Medications', icon: FileText },
    institution: { label: 'Institution', icon: Building },
    account_number: { label: 'Account Number', icon: Hash },
    balance: { label: 'Balance', icon: DollarSign, format: (v) => `$${Number(v).toLocaleString()}` },
    vendor: { label: 'Vendor', icon: Building },
    invoice_number: { label: 'Invoice #', icon: Hash },
    total: { label: 'Total', icon: DollarSign, format: (v) => `$${Number(v).toLocaleString()}` },
    recipe_name: { label: 'Recipe Name', icon: FileText },
    servings: { label: 'Servings', icon: User },
    prep_time: { label: 'Prep Time', icon: Clock },
    cook_time: { label: 'Cook Time', icon: Clock },
    ingredients: { label: 'Ingredients', icon: FileText },
    people_mentioned: { label: 'People', icon: User },
    organizations: { label: 'Organizations', icon: Building },
    dates_found: { label: 'Dates', icon: Calendar },
    amounts: { label: 'Amounts', icon: DollarSign },
    locations: { label: 'Locations', icon: MapPin },
  };

  const isEmptyValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (value === '' || value === 'null') return true;
    if (Array.isArray(value)) {
      // Filter out null/undefined/empty from arrays
      const filtered = value.filter(v => v !== null && v !== undefined && v !== '' && v !== 'null');
      return filtered.length === 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    return false;
  };

  const formatValue = (value: unknown, format?: (v: unknown) => string): string => {
    if (value === null || value === undefined) return '';
    if (format) return format(value);
    if (Array.isArray(value)) {
      // Filter out empty values before joining
      return value.filter(v => v !== null && v !== undefined && v !== '' && v !== 'null').join(', ');
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const sortedEntries = Object.entries(data).filter(
    ([, value]) => !isEmptyValue(value)
  );

  return (
    <div className="space-y-3">
      {sortedEntries.map(([key, value]) => {
        const config = FIELD_CONFIG[key] || { label: key.replace(/_/g, ' '), icon: FileText };
        const Icon = config.icon;
        const formattedValue = formatValue(value, config.format);

        if (Array.isArray(value) && value.length > 0) {
          // Filter out empty values from arrays
          const filteredValues = value.filter(v => v !== null && v !== undefined && v !== '' && v !== 'null');
          if (filteredValues.length === 0) return null;

          return (
            <Card key={key} className="bg-muted/30">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {config.label}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {filteredValues.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }

        return (
          <div key={key} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground min-w-[100px] capitalize">{config.label}</span>
            <span className="text-sm font-medium flex-1 truncate">{formattedValue}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ExtractedDataDisplay({ data, category: _category, className = '', documentId, tenantId, onExtract }: ExtractedDataDisplayProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!documentId || !tenantId) return;

    setIsExtracting(true);
    setError(null);

    try {
      const { windmill } = await import('@/api/windmill');
      const result = await windmill.extractDocumentData({
        document_id: documentId,
        tenant_id: tenantId,
      });

      if (result.success && result.extracted_data && onExtract) {
        onExtract(result.extracted_data);
      } else if (!result.success) {
        setError(result.error || 'Failed to extract data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract data');
    } finally {
      setIsExtracting(false);
    }
  };

  // No data state
  if (!data || Object.keys(data).length === 0) {
    const canExtract = documentId && tenantId && onExtract;

    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">No extracted data yet</p>
        <p className="text-xs mt-1 mb-4">AI can extract key information from this document</p>

        {canExtract && (
          <Button
            onClick={handleExtract}
            disabled={isExtracting}
            size="sm"
            className="gap-2"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Extract Data
              </>
            )}
          </Button>
        )}

        {error && (
          <p className="text-xs text-destructive mt-2">{error}</p>
        )}
      </div>
    );
  }

  // Render based on format
  return (
    <div className={className}>
      {isV2Format(data) ? (
        <V2Display data={data} />
      ) : (
        <V1Display data={data} />
      )}
    </div>
  );
}
