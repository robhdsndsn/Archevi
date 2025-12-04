// Types matching the Windmill RAG query script responses

export interface Source {
  id: number;
  title: string;
  category: string;
  relevance: number;
}

export interface RAGQueryArgs {
  query: string;
  tenant_id: string;
  user_id?: string;
  session_id?: string;
  user_email?: string;
  // Visibility filtering
  user_member_type?: MemberType;  // For filtering documents by visibility
  user_member_id?: number;        // For private document access
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

// Document visibility levels
export type DocumentVisibility = 'everyone' | 'adults_only' | 'admins_only' | 'private';

// Family member types for visibility filtering
export type MemberType = 'admin' | 'adult' | 'teen' | 'child';

export const DOCUMENT_VISIBILITY: { value: DocumentVisibility; label: string; description: string }[] = [
  { value: 'everyone', label: 'Everyone', description: 'All family members can see this document' },
  { value: 'adults_only', label: 'Adults Only', description: 'Only adults and admins can see this document' },
  { value: 'admins_only', label: 'Admins Only', description: 'Only family administrators can see this document' },
  { value: 'private', label: 'Private', description: 'Only the assigned person and admins can see this document' },
];

export const MEMBER_TYPES: { value: MemberType; label: string; canView: DocumentVisibility[] }[] = [
  { value: 'admin', label: 'Admin', canView: ['everyone', 'adults_only', 'admins_only', 'private'] },
  { value: 'adult', label: 'Adult', canView: ['everyone', 'adults_only'] },
  { value: 'teen', label: 'Teen', canView: ['everyone'] },
  { value: 'child', label: 'Child', canView: ['everyone'] },
];

export interface Document {
  id: number;
  title: string;
  content_preview: string;
  category: DocumentCategory;
  relevance_score: number;
  created_at: string;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  visibility?: DocumentVisibility;
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
  tenant_id: string;
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

export interface ModelUsageStats {
  model: string;
  count: number;
  avg_relevance: number;
  avg_latency_ms: number;
  avg_tokens: number;
}

export interface HealthService {
  status: 'up' | 'down' | 'degraded';
  response_time_ms: number;
  last_check: string | null;
}

export interface HealthIssue {
  service: string;
  status: string;
  error: string | null;
  timestamp: string | null;
}

export interface LogSummaryCategory {
  category: string;
  level: string;
  count: number;
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
  model_stats?: {
    by_model: ModelUsageStats[];
    savings_estimate: number;
    threshold_analysis: Record<string, Record<string, number>>;
  };
  health?: {
    services: Record<string, HealthService>;
    recent_issues: HealthIssue[];
  };
  logs?: {
    errors: number;
    warnings: number;
    by_category: LogSummaryCategory[];
  };
}

// Family member types
export type MemberRole = 'admin' | 'member';

export interface FamilyMember {
  id: number;
  email: string;
  name: string;
  role: MemberRole;
  member_type: MemberType;
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
  member_type?: MemberType;
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
  id: string;  // UUID from users table
  email: string;
  name: string;
  role: MemberRole;
  tenant_id?: string;
  tenant_name?: string;
  member_type?: MemberType;   // For visibility filtering (admin, adult, teen, child)
  member_id?: number;         // family_members.id for private doc access
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

// Invite types
export interface InviteResult {
  success: boolean;
  member_id?: number;
  email?: string;
  name?: string;
  invite_token?: string;
  expires_at?: string;
  email_sent?: boolean;
  email_error?: string;
  message?: string;
  error?: string;
}

export interface InviteValidationResult {
  success: boolean;
  member?: {
    id: number;
    email: string;
    name: string;
    role: MemberRole;
    invite_expires: string | null;
  };
  error?: string;
}

// Password reset types
export interface PasswordResetResult {
  success: boolean;
  reset_token?: string;
  email?: string;
  name?: string;
  expires_at?: string;
  message?: string;
  error?: string;
}

// Document CRUD types
export interface FullDocument {
  id: number;
  title: string;
  content: string;
  category: DocumentCategory;
  source_file: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  visibility?: DocumentVisibility;
}

export interface GetDocumentResult {
  success: boolean;
  document: FullDocument | null;
  error?: string;
}

export interface DeleteDocumentResult {
  success: boolean;
  message?: string;
  deleted_title?: string;
  deleted_id?: number;
  error?: string;
}

export interface UpdateDocumentArgs {
  document_id: number;
  title?: string;
  content?: string;
  category?: DocumentCategory;
  assigned_to?: number | null;
  clear_assigned_to?: boolean;
  visibility?: DocumentVisibility;
}

export interface UpdateDocumentResult {
  success: boolean;
  message?: string;
  document_id?: number;
  re_embedded?: boolean;
  tokens_used?: number;
  error?: string;
}

// PDF parsing types
export interface ParsePDFResult {
  success: boolean;
  text?: string;
  page_count?: number;
  filename?: string;
  error?: string;
}

// Enhanced document embedding types
export interface ExpiryDate {
  date: string;
  type: 'expiry' | 'renewal' | 'due_date' | 'validity' | 'policy_end' | 'effective_end';
  confidence: number;
}

export interface EmbedDocumentEnhancedArgs {
  title: string;
  content: string;
  tenant_id: string;
  category?: DocumentCategory;
  source_file?: string;
  created_by?: string;
  assigned_to?: number;  // Family member ID to assign this document to
  visibility?: DocumentVisibility;  // Who can see this document
  auto_categorize_enabled?: boolean;
  extract_tags_enabled?: boolean;
  extract_dates_enabled?: boolean;
}

export interface ExistingDocument {
  id: number;
  title: string;
  category: DocumentCategory;
  created_at: string | null;
}

export interface EmbedDocumentEnhancedResult {
  document_id: number | null;
  message: string;
  is_duplicate: boolean;
  existing_document: ExistingDocument | null;
  tokens_used: number;
  category: DocumentCategory;
  suggested_category?: DocumentCategory;
  category_confidence: number;
  tags: string[];
  expiry_dates: ExpiryDate[];
  ai_features_used: string[];
}

// Voice note types
export interface TranscribeVoiceNoteArgs {
  audio_content: string;
  filename?: string;
  title?: string;
  created_by?: string;
}

export interface TranscribeVoiceNoteResult {
  voice_note_id: number;
  transcript: string;
  duration_seconds: number;
  language: string;
  title: string;
  tags: string[];
  tokens_used: number;
  transcription_cost: number;
  embedding_cost: number;
  total_cost: number;
}

// Expiring documents query
export interface ExpiringDocument {
  id: number;
  title: string;
  category: DocumentCategory;
  expiry_date: string;
  expiry_type: string;
  days_until_expiry: number;
}

// Tag query
export interface TagCount {
  tag: string;
  document_count: number;
}

export interface GetTagsResult {
  success: boolean;
  tags: TagCount[];
  total_tags: number;
  error?: string;
}

// Expiring documents
export interface ExpiringDocumentDetail {
  id: number;
  title: string;
  category: DocumentCategory;
  expiry_date: string;
  expiry_type: string;
  days_until_expiry: number;
  confidence: number;
}

export interface GetExpiringDocumentsResult {
  success: boolean;
  documents: ExpiringDocumentDetail[];
  total: number;
  by_urgency?: {
    urgent: number;
    soon: number;
    upcoming: number;
  };
  error?: string;
}

// ============================================
// Multi-Tenant Admin Types
// ============================================

export type TenantPlan = 'starter' | 'family' | 'family_office' | 'trial';
export type TenantStatus = 'active' | 'suspended' | 'cancelled' | 'pending';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  ai_allowance_usd: number;
  max_members: number;
  created_at: string;
  member_count: number;
  document_count: number;
}

export interface TenantMember {
  id: string;
  email: string;
  name: string;
  role: string;
  joined_at: string | null;
}

export interface TenantDetails {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: TenantPlan;
    status: TenantStatus;
    ai_allowance_usd: number;
    max_members: number;
    max_storage_gb: number;
    api_mode: string;
    created_at: string;
    updated_at: string;
  };
  members: TenantMember[];
  document_stats: {
    total: number;
    by_category: Record<string, number>;
  };
  usage: {
    input_tokens_30d: number;
    output_tokens_30d: number;
    cost_usd_30d: number;
    operations_30d: number;
  };
  recent_chats: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
}

// Tenant creation/update types
export interface CreateTenantArgs {
  name: string;
  slug: string;
  plan: TenantPlan;
  owner_email: string;
  owner_name: string;
  ai_allowance_usd?: number;
  max_members?: number;
  max_storage_gb?: number;
}

export interface CreateTenantResult {
  success: boolean;
  tenant_id?: string;
  slug?: string;
  message?: string;
  error?: string;
}

export interface UpdateTenantArgs {
  tenant_id: string;
  name?: string;
  plan?: TenantPlan;
  status?: TenantStatus;
  ai_allowance_usd?: number;
  max_members?: number;
  max_storage_gb?: number;
}

export interface UpdateTenantResult {
  success: boolean;
  message?: string;
  error?: string;
}

// Plan configurations
export const TENANT_PLANS: { value: TenantPlan; label: string; description: string }[] = [
  { value: 'starter', label: 'Starter', description: '5 members, 10GB storage, $3 AI/mo' },
  { value: 'family', label: 'Family', description: '10 members, 50GB storage, $8 AI/mo' },
  { value: 'family_office', label: 'Family Office', description: 'Unlimited members & storage' },
  { value: 'trial', label: 'Trial', description: '14-day free trial' },
];

// Advanced search types
export interface AdvancedSearchArgs {
  search_term?: string;
  tenant_id: string;
  category?: DocumentCategory;
  date_from?: string;
  date_to?: string;
  created_by?: string;
  assigned_to?: number;  // Filter by family member ID
  tags?: string[];
  limit?: number;
  offset?: number;
  // Visibility filtering
  user_member_type?: MemberType;  // Current user's member type for visibility filtering
  user_member_id?: number;        // Current user's family_member.id for private doc access
}

export interface AdvancedSearchResult {
  documents: Document[];
  total: number;
  has_more: boolean;
}

// Tag suggestion types
export interface SuggestTagsArgs {
  content: string;
  title?: string;
  include_existing_tags?: boolean;
}

export interface SuggestTagsResult {
  suggested_category: string;
  category_confidence: number;
  suggested_tags: string[];
  existing_tags_matched: string[];
  new_tags_suggested: string[];
  expiry_dates: ExpiryDate[];
  tokens_used: number;
  error?: string;
}

// Admin document listing types
export interface AdminDocument {
  id: number;
  title: string;
  content_preview: string;
  category: DocumentCategory;
  tenant_id: string;
  tenant_name: string;
  created_at: string;
  created_by: string | null;
}

export interface TenantOption {
  id: string;
  name: string;
}

export interface AdminListDocumentsArgs {
  search_term?: string;
  category?: DocumentCategory;
  tenant_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'title' | 'tenant' | 'category';
  sort_order?: 'asc' | 'desc';
}

export interface AdminListDocumentsResult {
  documents: AdminDocument[];
  total: number;
  has_more: boolean;
  tenants: TenantOption[];
}
