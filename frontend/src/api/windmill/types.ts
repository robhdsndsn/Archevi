// Types matching the Windmill RAG query script responses

// ============================================
// SSE Streaming Types for RAG Agent
// ============================================

export type RAGStreamEventType =
  | 'thinking'
  | 'search'
  | 'visual_search'
  | 'answer'
  | 'complete'
  | 'error';

export interface RAGStreamThinkingData {
  status: 'started';
}

export interface RAGStreamSearchData {
  status: 'started' | 'complete';
  query: string;
  count?: number;
  sources?: Source[];
}

export interface RAGStreamVisualSearchData {
  status: 'started' | 'complete';
  query: string;
  count?: number;
  page_sources?: PageSource[];
}

export interface RAGStreamAnswerData {
  status: 'started' | 'complete';
  content?: string;
}

export interface RAGStreamCompleteData {
  answer: string;
  sources: Source[];
  page_sources?: PageSource[];  // Visual search results (PDF page thumbnails)
  tool_calls: ToolCall[];
  confidence: number;
  session_id: string;
  tenant_id: string;
  model: string;
  rate_limit?: {
    remaining: number;
    limit: number;
    window: number;
  };
}

export interface RAGStreamErrorData {
  message: string;
  retry_after?: number;
}

export type RAGStreamEventData =
  | RAGStreamThinkingData
  | RAGStreamSearchData
  | RAGStreamVisualSearchData
  | RAGStreamAnswerData
  | RAGStreamCompleteData
  | RAGStreamErrorData;

export interface RAGStreamEvent {
  type: RAGStreamEventType;
  data: RAGStreamEventData;
}

// Helper type guards for SSE events
export function isThinkingEvent(event: RAGStreamEvent): event is RAGStreamEvent & { data: RAGStreamThinkingData } {
  return event.type === 'thinking';
}

export function isSearchEvent(event: RAGStreamEvent): event is RAGStreamEvent & { data: RAGStreamSearchData } {
  return event.type === 'search';
}

export function isVisualSearchEvent(event: RAGStreamEvent): event is RAGStreamEvent & { data: RAGStreamVisualSearchData } {
  return event.type === 'visual_search';
}

export function isAnswerEvent(event: RAGStreamEvent): event is RAGStreamEvent & { data: RAGStreamAnswerData } {
  return event.type === 'answer';
}

export function isCompleteEvent(event: RAGStreamEvent): event is RAGStreamEvent & { data: RAGStreamCompleteData } {
  return event.type === 'complete';
}

export function isErrorEvent(event: RAGStreamEvent): event is RAGStreamEvent & { data: RAGStreamErrorData } {
  return event.type === 'error';
}

// ============================================
// Core Types
// ============================================

export interface Source {
  id: number;
  title: string;
  category: string;
  relevance: number;
  snippet?: string;  // First 500 chars of document content for preview
}

// Visual search result - PDF page with thumbnail
export interface PageSource {
  page_id: number;
  document_id: number;
  document_title: string;
  page_number: number;
  similarity: number;
  page_image?: string;  // Base64 encoded JPEG thumbnail
  ocr_text?: string;    // OCR text from page (first 500 chars)
  type: 'page';         // Discriminator for UI
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

// ============================================
// AI Model Selection Types
// ============================================

export type AIModelProvider = 'groq' | 'cohere';

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIModelProvider;
  description: string;
  contextLength: number;
  supportsTools: boolean;
  multimodal: boolean;
}

// Available models for user selection (must match backend AVAILABLE_MODELS)
export const AVAILABLE_AI_MODELS: AIModelInfo[] = [
  // Groq models
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    description: 'Fast, versatile, great for most queries',
    contextLength: 128000,
    supportsTools: true,
    multimodal: false,
  },
  {
    id: 'llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout',
    provider: 'groq',
    description: 'Multimodal with image understanding, 128K context',
    contextLength: 128000,
    supportsTools: true,
    multimodal: true,
  },
  {
    id: 'llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick',
    provider: 'groq',
    description: 'Larger MoE, better reasoning',
    contextLength: 128000,
    supportsTools: true,
    multimodal: true,
  },
  // Cohere models
  {
    id: 'command-a-03-2025',
    name: 'Command A',
    provider: 'cohere',
    description: 'Most performant, 256K context, great tool use',
    contextLength: 256000,
    supportsTools: true,
    multimodal: false,
  },
  {
    id: 'command-r-plus-08-2024',
    name: 'Command R+',
    provider: 'cohere',
    description: 'Good balance of speed and quality',
    contextLength: 128000,
    supportsTools: true,
    multimodal: false,
  },
];

export const DEFAULT_AI_MODEL = 'llama-3.3-70b-versatile';

// AI Agent types (Groq with tool calling)
export interface RAGAgentArgs {
  user_message: string;
  tenant_id: string;
  session_id?: string;
  conversation_history?: ConversationMessage[];
  user_member_type?: MemberType;
  user_member_id?: number;
  model?: string;  // Optional model selection
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolCall {
  name: string;
  query: string;
}

export interface RAGAgentResult {
  answer: string;
  sources: Source[];
  tool_calls: ToolCall[];
  confidence: number;
  session_id: string;
  tenant_id: string;
  model: string;
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
  | 'invoices'
  | 'legal'
  | 'education'
  | 'personal';

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
  // Image embedding fields
  has_image_embedding?: boolean;
  image_url?: string | null;
  content_type?: 'text' | 'image' | 'mixed';
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
  { value: 'legal', label: 'Legal' },
  { value: 'education', label: 'Education' },
  { value: 'personal', label: 'Personal' },
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
  tenant_id: string;  // Required - every user must belong to a tenant
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
  extracted_data?: ExtractedData | null;
  // Image embedding fields
  has_image_embedding?: boolean;
  image_url?: string | null;
  content_type?: 'text' | 'image' | 'mixed';
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
  tenant_id: string;
  filename?: string;
  title?: string;
  created_by?: string;
  category?: DocumentCategory;
}

export interface TranscribeVoiceNoteResult {
  voice_note_id: number;
  document_id: number;  // ID in family_documents table
  transcript: string;
  duration_seconds: number;
  language: string;
  title: string;
  tags: string[];
  category: string;
  tokens_used: number;
  transcription_cost: number;
  embedding_cost: number;
  total_cost: number;
}

// Image embedding types (visual search)
export interface EmbedImageArgs {
  document_id: number;
  tenant_id: string;
  image_content: string;  // Base64 encoded image
}

export interface EmbedImageResult {
  success: boolean;
  document_id?: number;
  image_tokens?: number;
  cost_usd?: number;
  error?: string;
}

// Storage-based document embedding (uploads file to Supabase first)
export interface EmbedDocumentFromStorageArgs {
  storage_path: string;
  title: string;
  tenant_id: string;
  category?: DocumentCategory;
  created_by?: string;
  assigned_to?: number;
  visibility?: DocumentVisibility;
  ocr_language?: string;
  auto_categorize_enabled?: boolean;
  extract_tags_enabled?: boolean;
  extract_dates_enabled?: boolean;
}

export interface EmbedDocumentFromStorageResult {
  document_id: number | null;
  message: string;
  is_duplicate: boolean;
  existing_document: ExistingDocument | null;
  storage_path: string;
  extracted_text_preview: string;
  full_text_length: number;
  file_type: string;
  pages: number;
  tokens_used: number;
  category: DocumentCategory;
  suggested_category?: DocumentCategory;
  category_confidence: number;
  tags: string[];
  expiry_dates: ExpiryDate[];
  ai_features_used: string[];
  assigned_to?: number;
  visibility?: DocumentVisibility;
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

// Bulk ZIP upload types
export interface ProcessZipUploadArgs {
  zip_content_base64: string;
  tenant_id: string;
  default_category?: DocumentCategory;
  auto_categorize?: boolean;
  extract_tags?: boolean;
  visibility?: DocumentVisibility;
  assigned_to?: number;
}

export interface ZipFileResult {
  filename: string;
  status: 'success' | 'failed' | 'skipped';
  document_id?: number;
  title?: string;
  category?: string;
  category_confidence?: number;
  content_length?: number;
  error?: string;
  reason?: string;
}

export interface ProcessZipUploadResult {
  success: boolean;
  total_files: number;
  processed: number;
  failed: number;
  skipped: number;
  results: ZipFileResult[];
  error?: string;
}

// ============================================
// Smart Data Extraction Types
// ============================================

export interface ExtractDocumentDataArgs {
  document_id: number;
  tenant_id: string;
  force_reextract?: boolean;
}

// Extracted data fields by category
export interface InsuranceExtractedData {
  policy_number?: string;
  provider?: string;
  coverage_type?: string;
  coverage_amount?: number;
  deductible?: number;
  premium?: number;
  premium_frequency?: string;
  effective_date?: string;
  expiry_date?: string;
  insured_name?: string;
  beneficiaries?: string[];
}

export interface MedicalExtractedData {
  patient_name?: string;
  provider_name?: string;
  visit_date?: string;
  diagnosis?: string[];
  medications?: string[];
  dosage?: string;
  next_appointment?: string;
  allergies?: string[];
  blood_type?: string;
  test_results?: string;
}

export interface FinancialExtractedData {
  institution?: string;
  account_number?: string;
  account_type?: string;
  balance?: number;
  statement_date?: string;
  statement_period?: string;
  interest_rate?: number;
  transactions_summary?: string;
}

export interface InvoiceExtractedData {
  vendor?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  items?: string[];
  payment_method?: string;
  warranty_info?: string;
}

export interface RecipeExtractedData {
  recipe_name?: string;
  cuisine_type?: string;
  prep_time?: string;
  cook_time?: string;
  total_time?: string;
  servings?: number;
  ingredients?: string[];
  calories?: number;
  difficulty?: string;
  dietary_tags?: string[];
}

export interface GeneralExtractedData {
  people_mentioned?: string[];
  organizations?: string[];
  dates?: string[];
  amounts?: string[];
  locations?: string[];
  phone_numbers?: string[];
  emails?: string[];
  key_points?: string[];
  dates_found?: string[];
  reference_numbers?: string[];
}

// V2 Dynamic Extraction Types (AI-discovered fields)
export type ExtractedItemType = 'date' | 'amount' | 'person' | 'organization' | 'reference' | 'contact' | 'location' | 'duration' | 'percentage' | 'text';
export type ExtractedItemImportance = 'high' | 'medium' | 'low';

export interface ExtractedItem {
  label: string;
  value: string;
  type: ExtractedItemType;
  importance: ExtractedItemImportance;
  source?: string;  // 'pattern' for regex-detected items
}

export interface KeyItem {
  label: string;
  value: string;
}

export interface HighImportanceItem extends KeyItem {
  type: ExtractedItemType;
}

// V2 format extracted data (dynamic discovery)
export interface ExtractedDataV2 {
  items: ExtractedItem[];
  summary?: string;
  document_type?: string;
  key_dates?: KeyItem[];
  key_amounts?: KeyItem[];
  key_people?: KeyItem[];
  key_organizations?: KeyItem[];
  key_references?: KeyItem[];
  high_importance?: HighImportanceItem[];
}

// Union type for all extracted data (v1 category-specific or v2 dynamic)
export type ExtractedData =
  | InsuranceExtractedData
  | MedicalExtractedData
  | FinancialExtractedData
  | InvoiceExtractedData
  | RecipeExtractedData
  | GeneralExtractedData
  | ExtractedDataV2;

export interface ExtractDocumentDataResult {
  success: boolean;
  document_id: number;
  category: string;
  extracted_data: ExtractedData;
  confidence: number;
  tokens_used: number;
  fields_extracted?: number;
  already_extracted?: boolean;
  error?: string;
}

// ============================================
// Document Sharing Types
// ============================================

export type SharePermission = 'view' | 'edit';

export interface ShareMember {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: string;
}

export interface ShareData {
  shared_with_user_id: string;
  permission?: SharePermission;
  message?: string;
}

export interface DocumentShare {
  share_id: string;
  document_id: string;
  document_title: string;
  document_category: string;
  document_created_at?: string | null;
  content_preview?: string;
  sharer_id?: string;
  sharer_name?: string;
  sharer_email?: string;
  recipient_id?: string;
  recipient_name?: string;
  recipient_email?: string;
  permission: SharePermission;
  message?: string | null;
  shared_at: string | null;
  is_read?: boolean;
  notification_id?: string | null;
}

export interface ShareDocumentArgs {
  action: 'share' | 'unshare' | 'list_shared_with_me' | 'list_shared_by_me' | 'get_document_shares' | 'mark_notification_read' | 'get_tenant_members';
  document_id?: string;
  user_id?: string;
  tenant_id?: string;
  share_data?: ShareData | { share_id: string };
}

export interface ShareDocumentResult {
  success: boolean;
  share_id?: string;
  document_title?: string;
  shared_with_name?: string;
  shared_with_email?: string;
  permission?: SharePermission;
  message?: string;
  error?: string;
}

export interface UnshareDocumentResult {
  success: boolean;
  unshared?: boolean;
  message?: string;
  error?: string;
}

export interface ListSharedWithMeResult {
  success: boolean;
  shares: DocumentShare[];
  total: number;
  unread_count: number;
  error?: string;
}

export interface ListSharedByMeResult {
  success: boolean;
  shares: DocumentShare[];
  total: number;
  error?: string;
}

export interface GetDocumentSharesResult {
  success: boolean;
  document_id?: string;
  shares: Array<{
    share_id: string;
    user_id: string;
    name: string;
    email: string;
    permission: SharePermission;
    message?: string | null;
    shared_at: string | null;
    shared_by_name: string;
  }>;
  total: number;
  error?: string;
}

export interface MarkNotificationReadResult {
  success: boolean;
  marked_read?: boolean;
  error?: string;
}

export interface GetTenantMembersResult {
  success: boolean;
  members: ShareMember[];
  total: number;
  error?: string;
}

// ============================================
// Related Documents Types
// ============================================

export interface RelatedDocument {
  id: number;
  title: string;
  category: string | null;
  similarity: number;  // Percentage (0-100)
  created_at: string | null;
  tags: string[];
}

export interface RelatedDocumentsSourceDocument {
  id: number;
  title: string;
  category: string | null;
}

export interface RelatedDocumentsArgs {
  document_id: number;
  tenant_id: string;
  limit?: number;
  user_member_type?: MemberType;
  user_member_id?: number;
}

export interface RelatedDocumentsResult {
  related_documents: RelatedDocument[];
  source_document: RelatedDocumentsSourceDocument | null;
  error: string | null;
}

// ============================================
// In-App Notification Types
// ============================================

export type NotificationType = 'alert' | 'info' | 'success' | 'warning' | 'error';

export interface InAppNotification {
  id: number;
  tenant_id: string;
  user_id: string | null;
  title: string;
  message: string;
  notification_type: NotificationType;
  alert_id: number | null;
  alert_type: string | null;
  action_url: string | null;
  action_label: string | null;
  is_read: boolean;
  read_at: string | null;
  is_dismissed: boolean;
  dismissed_at: string | null;
  expires_at: string | null;
  created_at: string | null;
}

export interface GetNotificationsArgs {
  tenant_id: string;
  user_id?: string;
  include_read?: boolean;
  include_dismissed?: boolean;
  limit?: number;
}

export interface GetNotificationsResult {
  notifications: InAppNotification[];
  unread_count: number;
  total_returned: number;
}

export interface ManageNotificationArgs {
  action: 'read' | 'dismiss' | 'dismiss_all' | 'read_all' | 'acknowledge_alert';
  tenant_id: string;
  notification_id?: number;
  user_id?: string;
}

export interface ManageNotificationResult {
  action: string;
  success: boolean;
  notification_id?: number;
  notifications_updated?: number;
  alert_id?: number;
  error?: string;
}

// ============================================
// Search Suggestions Types (Autocomplete)
// ============================================

export type SearchSuggestionType = 'document' | 'person' | 'tag' | 'recent' | 'entity' | 'category';

export interface SearchSuggestion {
  type: SearchSuggestionType;
  value: string;
  label: string;
  document_id: number | null;
  score: number;
}

export interface GetSearchSuggestionsArgs {
  query_prefix: string;
  tenant_id?: string;
  user_email?: string;
  limit?: number;
}

export interface GetSearchSuggestionsResult {
  success: boolean;
  suggestions: SearchSuggestion[];
  error?: string;
}

// ============================================
// Document Versioning Types
// ============================================

export type DocumentChangeType = 'initial' | 'update' | 'correction' | 'major_revision';

export interface DocumentVersion {
  version_number: number;
  title: string;
  content_preview: string;
  content_hash: string;
  file_size_bytes: number | null;
  change_summary: string | null;
  change_type: DocumentChangeType;
  created_by_name: string | null;
  created_at: string;
  is_current: boolean;
}

export interface GetDocumentVersionsArgs {
  document_id: string;
  tenant_id: string;
}

export interface GetDocumentVersionsResult {
  document_id: string;
  document_title: string;
  current_version: number;
  version_count: number;
  versions: DocumentVersion[];
}

export interface RollbackDocumentVersionArgs {
  document_id: string;
  target_version: number;
  tenant_id: string;
  user_id: string;
}

export interface RollbackDocumentVersionResult {
  success: boolean;
  document_id: string;
  new_version_number: number;
  rolled_back_from: number;
  rolled_back_to: number;
  message: string;
}

export interface CreateDocumentVersionArgs {
  document_id: string;
  title: string;
  content: string;
  tenant_id: string;
  user_id: string;
  change_summary?: string;
  change_type?: DocumentChangeType;
  file_size_bytes?: number;
  storage_path?: string;
}

export interface CreateDocumentVersionResult {
  success: boolean;
  document_id: string;
  version_number: number;
  message: string;
}

// ============================================
// Calendar Integration Types
// ============================================

export interface CalendarSettings {
  feed_id: string;
  feed_url: string;
  is_enabled: boolean;
  reminder_days: number[];
  include_categories: string[];
  last_accessed_at: string | null;
  access_count: number;
  created_at: string;
}

export interface GetCalendarSettingsArgs {
  tenant_id: string;
  action?: 'get' | 'update' | 'regenerate_token';
  is_enabled?: boolean;
  reminder_days?: number[];
  include_categories?: string[];
}

export interface GetCalendarSettingsResult {
  success: boolean;
  settings: CalendarSettings | null;
  message: string;
}

export interface GenerateCalendarFeedArgs {
  feed_token: string;
}

export interface GenerateCalendarFeedResult {
  ics_content: string;
  content_type: string;
  event_count: number;
  tenant_name: string;
  error: string | null;
}

// ============================================
// Secure Links Types
// ============================================

export type SecureLinkExpiration = '1h' | '1d' | '7d' | '30d' | '90d';

export interface CreateSecureLinkArgs {
  document_id: number;
  tenant_id: string;
  user_id: string;
  expires_in?: SecureLinkExpiration;
  password?: string;
  max_views?: number;
  label?: string;
}

export interface CreateSecureLinkResult {
  success: boolean;
  link_id?: string;
  token?: string;
  url?: string;
  document_title?: string;
  expires_at?: string;
  requires_password?: boolean;
  max_views?: number | null;
  label?: string | null;
  error?: string;
}

export interface AccessSecureLinkArgs {
  token: string;
  password?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AccessSecureLinkResult {
  success: boolean;
  requires_password?: boolean;
  document?: {
    id: number;
    title: string;
    content: string;
    category: string;
    source_file: string | null;
    created_at: string | null;
    expiry_date: string | null;
    metadata: Record<string, unknown> | null;
  };
  link_label?: string | null;
  views_remaining?: number | null;
  expires_at?: string;
  error?: string;
}

export interface RevokeSecureLinkArgs {
  link_id: string;
  tenant_id: string;
  user_id: string;
}

export interface RevokeSecureLinkResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ListSecureLinksArgs {
  tenant_id: string;
  document_id?: number;
  include_revoked?: boolean;
  include_expired?: boolean;
}

export interface SecureLink {
  id: string;
  document_id: number;
  document_title: string;
  token: string;
  url: string;
  label: string | null;
  expires_at: string;
  is_expired: boolean;
  is_revoked: boolean;
  requires_password: boolean;
  max_views: number | null;
  view_count: number;
  created_by_name: string;
  created_at: string;
  last_accessed: string | null;
}

export interface ListSecureLinksResult {
  success: boolean;
  links?: SecureLink[];
  count?: number;
  error?: string;
}

// ============================================
// Two-Factor Authentication Types
// ============================================

export interface Setup2FAResult {
  success: boolean;
  secret?: string;
  qr_code?: string;  // Base64-encoded PNG
  provisioning_uri?: string;
  error?: string;
}

export interface Verify2FAResult {
  success: boolean;
  message?: string;
  totp_enabled?: boolean;
  // For login mode (returns tokens after verification):
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: AuthUser;
  error?: string;
}

export interface Disable2FAResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface GenerateBackupCodesResult {
  success: boolean;
  codes?: string[];  // 10 codes in XXXX-XXXX format (shown once!)
  message?: string;
  error?: string;
}

export interface VerifyBackupCodeResult {
  success: boolean;
  message?: string;
  remaining_codes?: number;
  warning?: string;  // If low on backup codes
  // Returns tokens after successful verification:
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: AuthUser;
  error?: string;
}

// Extended LoginResult to handle 2FA flow
export interface LoginResultWith2FA extends LoginResult {
  requires_2fa?: boolean;
  session_token?: string;  // Temporary token for 2FA verification
}

// ============================================
// Timeline Types
// ============================================

export type TimelineEventType =
  | 'birth'
  | 'death'
  | 'wedding'
  | 'anniversary'
  | 'graduation'
  | 'medical'
  | 'legal'
  | 'financial'
  | 'insurance'
  | 'purchase'
  | 'travel'
  | 'milestone'
  | 'photo'
  | 'other';

export const TIMELINE_EVENT_TYPES: { value: TimelineEventType; label: string; icon: string; color: string }[] = [
  { value: 'birth', label: 'Birth', icon: 'baby', color: 'pink' },
  { value: 'death', label: 'Death', icon: 'heart-off', color: 'gray' },
  { value: 'wedding', label: 'Wedding', icon: 'heart', color: 'red' },
  { value: 'anniversary', label: 'Anniversary', icon: 'cake', color: 'purple' },
  { value: 'graduation', label: 'Graduation', icon: 'graduation-cap', color: 'blue' },
  { value: 'medical', label: 'Medical', icon: 'stethoscope', color: 'green' },
  { value: 'legal', label: 'Legal', icon: 'scale', color: 'amber' },
  { value: 'financial', label: 'Financial', icon: 'banknote', color: 'emerald' },
  { value: 'insurance', label: 'Insurance', icon: 'shield-check', color: 'cyan' },
  { value: 'purchase', label: 'Purchase', icon: 'shopping-cart', color: 'orange' },
  { value: 'travel', label: 'Travel', icon: 'plane', color: 'sky' },
  { value: 'milestone', label: 'Milestone', icon: 'trophy', color: 'yellow' },
  { value: 'photo', label: 'Photo', icon: 'camera', color: 'indigo' },
  { value: 'other', label: 'Other', icon: 'calendar', color: 'slate' },
];

export interface TimelineEvent {
  id: number;
  event_date: string;
  event_end_date?: string | null;
  event_time?: string | null;
  event_type: TimelineEventType;
  title: string;
  description?: string | null;
  document_id?: number | null;
  document_title?: string | null;
  family_member_id?: number | null;
  family_member_name?: string | null;
  source: 'extracted' | 'manual' | 'imported';
  confidence?: number | null;
  created_at: string;
}

export interface TimelineSummary {
  by_year: Record<number, { total: number; types: Record<string, number> }>;
  by_type: Record<string, number>;
  total: number;
}

export interface GetTimelineEventsArgs {
  tenant_id: string;
  start_date?: string;
  end_date?: string;
  event_types?: TimelineEventType[];
  family_member_id?: number;
  document_id?: number;
  limit?: number;
  offset?: number;
}

export interface GetTimelineEventsResult {
  success: boolean;
  events: TimelineEvent[];
  total_count: number;
  summary: TimelineSummary;
  limit: number;
  offset: number;
  error?: string;
}

export interface GenerateTimelineEventsArgs {
  document_id: number;
  tenant_id: string;
  user_id?: number;
}

export interface GenerateTimelineEventsResult {
  success: boolean;
  events_created: number;
  events: Array<{
    id: number;
    event_date: string;
    event_type: string;
    title: string;
    confidence: number;
  }>;
  message?: string;
  error?: string;
}

export interface ManageTimelineEventArgs {
  action: 'create' | 'update' | 'delete';
  tenant_id: string;
  event_id?: number;
  event_date?: string;
  event_end_date?: string;
  event_time?: string;
  event_type?: TimelineEventType;
  title?: string;
  description?: string;
  document_id?: number;
  family_member_id?: number;
  family_member_name?: string;
  user_id?: number;
}

export interface ManageTimelineEventResult {
  success: boolean;
  event?: {
    id: number;
    event_date: string;
    event_type: string;
    title: string;
    created_at?: string;
    updated_at?: string;
  };
  message?: string;
  error?: string;
}

// ============================================
// Biography Generator Types
// ============================================

export type BiographyStyle = 'narrative' | 'formal' | 'casual' | 'children';

export interface GenerateBiographyArgs {
  person_name: string;
  tenant_id: string;
  style?: BiographyStyle;
  max_words?: number;
  include_historical_context?: boolean;
}

export interface BiographySource {
  id: string;
  title: string;
  category: string;
  relevance: number;
}

export interface GenerateBiographyResult {
  success: boolean;
  biography?: string;
  person_name?: string;
  style?: BiographyStyle;
  word_count?: number;
  sources?: BiographySource[];
  tokens_used?: {
    input: number;
    output: number;
  };
  error?: string;
}

// ============================================
// Text-to-Speech (TTS) Types
// ============================================

export interface TTSVoice {
  key: string;
  id: string;
  name: string;
  description: string;
}

export interface GetTTSVoicesResult {
  success: boolean;
  voices: TTSVoice[];
  default_voice: string;
}

export interface TextToSpeechArgs {
  text: string;
  voice_key?: string;
  model_id?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
  output_format?: string;
}

export interface TextToSpeechResult {
  success: boolean;
  audio_base64?: string;
  audio_format: string;
  voice_id: string;
  voice_name: string;
  text_length: number;
  error?: string;
}

// ============================================
// Billing & Subscription Types
// ============================================

export type BillingInterval = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string | number;
  tooltip?: string;
}

export interface PlanPricing {
  monthly: number;
  yearly: number;  // per month when billed yearly
  yearlyTotal: number;  // total annual price
  savings?: number;  // percentage saved with yearly
}

export interface Plan {
  id: TenantPlan;
  name: string;
  description: string;
  pricing: PlanPricing;
  features: PlanFeature[];
  limits: {
    members: number | 'unlimited';
    storageGb: number | 'unlimited';
    aiAllowanceUsd: number | 'unlimited';
    documentsPerMonth: number | 'unlimited';
    aiQueriesPerMonth: number | 'unlimited';
  };
  badge?: string;  // "Popular", "Best Value", etc.
  highlight?: boolean;  // Whether to visually highlight this plan
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: TenantPlan;
  status: SubscriptionStatus;
  interval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export interface UsageMetric {
  name: string;
  current: number;
  limit: number | 'unlimited';
  unit: string;
  percentage?: number;  // Calculated usage percentage
  warning?: boolean;  // True if approaching limit
  exceeded?: boolean;  // True if over limit
}

export interface BillingUsage {
  period: {
    start: string;
    end: string;
  };
  metrics: {
    storage: UsageMetric;
    aiSpend: UsageMetric;
    documents: UsageMetric;
    aiQueries: UsageMetric;
    members: UsageMetric;
  };
  // Cost breakdown
  costs: {
    basePlan: number;
    overage: number;
    total: number;
    projected: number;  // Projected cost based on current usage
  };
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  amount: number;
  currency: string;
  description: string;
  pdfUrl?: string;
}

// ============================================
// Tenant Branding Types
// ============================================

export interface BrandingConfig {
  brand_name: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  primary_color: string;
  primary_foreground: string;
  secondary_color: string;
  accent_color: string;
  background_light: string;
  background_dark: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  font_family?: string;
  font_heading?: string;
  border_radius: string;
  sidebar_style: 'default' | 'compact' | 'minimal';
  custom_css?: string;
  show_powered_by: boolean;
  custom_footer_text?: string;
}

export interface GetTenantBrandingArgs {
  tenant_id?: string;
}

export interface GetTenantBrandingResult {
  success: boolean;
  branding: BrandingConfig;
  error?: string;
}

// Plan configurations with full details
export const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Free Trial',
    description: '14-day trial with full access',
    pricing: { monthly: 0, yearly: 0, yearlyTotal: 0 },
    features: [
      { name: 'AI-powered document search', included: true },
      { name: 'Document upload & OCR', included: true },
      { name: 'Family member profiles', included: true, limit: 3 },
      { name: 'Secure document sharing', included: true },
      { name: 'Email support', included: true },
    ],
    limits: {
      members: 3,
      storageGb: 1,
      aiAllowanceUsd: 1,
      documentsPerMonth: 50,
      aiQueriesPerMonth: 100,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for getting started',
    pricing: { monthly: 9, yearly: 7, yearlyTotal: 84, savings: 22 },
    features: [
      { name: 'AI-powered document search', included: true },
      { name: 'Document upload & OCR', included: true },
      { name: 'Family member profiles', included: true, limit: 5 },
      { name: 'Secure document sharing', included: true },
      { name: 'Email support', included: true },
      { name: 'Document expiry alerts', included: true },
      { name: 'Export data', included: true },
    ],
    limits: {
      members: 5,
      storageGb: 10,
      aiAllowanceUsd: 3,
      documentsPerMonth: 200,
      aiQueriesPerMonth: 500,
    },
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Best for growing families',
    pricing: { monthly: 19, yearly: 15, yearlyTotal: 180, savings: 21 },
    badge: 'Most Popular',
    highlight: true,
    features: [
      { name: 'Everything in Starter', included: true },
      { name: 'Family member profiles', included: true, limit: 10 },
      { name: 'Priority AI processing', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Family timeline', included: true },
      { name: 'Biography generator', included: true },
      { name: 'Priority support', included: true },
    ],
    limits: {
      members: 10,
      storageGb: 50,
      aiAllowanceUsd: 8,
      documentsPerMonth: 1000,
      aiQueriesPerMonth: 2000,
    },
  },
  {
    id: 'family_office',
    name: 'Family Office',
    description: 'For multi-generational families',
    pricing: { monthly: 49, yearly: 39, yearlyTotal: 468, savings: 20 },
    badge: 'Best Value',
    features: [
      { name: 'Everything in Family', included: true },
      { name: 'Unlimited family members', included: true },
      { name: 'Unlimited storage', included: true },
      { name: 'White-glove onboarding', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'SLA guarantee', included: true },
      { name: 'Phone support', included: true },
    ],
    limits: {
      members: 'unlimited',
      storageGb: 'unlimited',
      aiAllowanceUsd: 25,
      documentsPerMonth: 'unlimited',
      aiQueriesPerMonth: 'unlimited',
    },
  },
];
