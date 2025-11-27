// Types matching the Windmill RAG query script responses

export interface Source {
  id: number;
  title: string;
  category: string;
  relevance: number;
}

export interface RAGQueryArgs {
  query: string;
  session_id?: string;
  user_email?: string;
}

export interface RAGQueryResult {
  answer: string;
  sources: Source[];
  confidence: number;
  session_id: string;
}

export interface WindmillError {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Document types
export type DocumentCategory =
  | 'recipes'
  | 'medical'
  | 'financial'
  | 'family_history'
  | 'general'
  | 'insurance'
  | 'invoices';

export interface Document {
  id: number;
  title: string;
  content_preview: string;
  category: DocumentCategory;
  relevance_score: number;
  created_at: string;
}

export interface EmbedDocumentArgs {
  title: string;
  content: string;
  category: DocumentCategory;
  source_file?: string;
  created_by?: string;
}

export interface EmbedDocumentResult {
  document_id: number;
  message: string;
  tokens_used: number;
  category: DocumentCategory;
}

export interface SearchDocumentsArgs {
  search_term: string;
  category?: DocumentCategory;
  limit?: number;
}

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'recipes', label: 'Recipes' },
  { value: 'medical', label: 'Medical' },
  { value: 'financial', label: 'Financial' },
  { value: 'family_history', label: 'Family History' },
  { value: 'general', label: 'General' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'invoices', label: 'Invoices' },
];

// Analytics types
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'all';

export interface UsageByOperation {
  operation: string;
  count: number;
  tokens: number;
  cost: number;
}

export interface DocumentsByCategory {
  category: string;
  count: number;
}

export interface DailyActivity {
  date: string;
  queries: number;
}

export interface RecentActivity {
  operation: string;
  tokens: number;
  cost: number;
  timestamp: string;
}

export interface AnalyticsData {
  period: AnalyticsPeriod;
  start_date: string;
  end_date: string;
  usage: {
    totals: {
      requests: number;
      tokens: number;
      cost: number;
    };
    by_operation: UsageByOperation[];
  };
  documents: {
    total: number;
    by_category: DocumentsByCategory[];
  };
  activity: {
    daily: DailyActivity[];
    recent: RecentActivity[];
  };
  projections: {
    daily_avg_cost: number;
    monthly_estimate: number;
  };
}

// Family member types
export type MemberRole = 'admin' | 'member';

export interface FamilyMember {
  id: number;
  email: string;
  name: string;
  role: MemberRole;
  avatar_url: string | null;
  created_at: string | null;
  last_active: string | null;
  is_active: boolean;
  // Auth-related fields
  has_password: boolean;
  email_verified: boolean;
  last_login: string | null;
  invite_pending: boolean;
}

export interface FamilyMemberInput {
  email: string;
  name: string;
  role?: MemberRole;
  avatar_url?: string;
}

export interface FamilyMembersResult {
  success: boolean;
  members?: FamilyMember[];
  member?: FamilyMember;
  count?: number;
  message?: string;
  error?: string;
}

// Auth types
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: MemberRole;
}

export interface LoginResult {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: AuthUser;
  error?: string;
}

export interface VerifyResult {
  valid: boolean;
  user?: AuthUser;
  error?: string;
}

export interface RefreshResult {
  success: boolean;
  access_token?: string;
  expires_in?: number;
  user?: AuthUser;
  error?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  error?: string;
}
