/**
 * Windmill Admin API Client
 *
 * Provides access to Windmill's administrative APIs for:
 * - Job monitoring and management
 * - Worker status
 * - Script/Flow management
 * - System health
 * - Tenant management
 * - Document management
 */

export interface Job {
  id: string;
  parent_job?: string;
  created_by: string;
  created_at: string;
  started_at?: string;
  scheduled_for?: string;
  running: boolean;
  script_path?: string;
  script_hash?: string;
  args?: Record<string, unknown>;
  logs?: string;
  raw_code?: string;
  canceled: boolean;
  canceled_by?: string;
  canceled_reason?: string;
  success?: boolean;
  result?: unknown;
  deleted?: boolean;
  is_skipped: boolean;
  duration_ms?: number;
}

export interface Worker {
  worker: string;
  worker_instance: string;
  ip: string;
  started_at: string;
  last_ping?: number;
  jobs_executed: number;
  occupancy_rate: number;
  memory?: number;
  wm_version?: string;
  worker_group?: string;
  memory_usage?: number;
}

export interface Script {
  hash: string;
  path: string;
  summary: string;
  description: string;
  language: string;
  created_at: string;
  created_by: string;
  lock?: string;
}

export interface Flow {
  path: string;
  summary: string;
  description: string;
  edited_at: string;
  edited_by: string;
}

export interface Schedule {
  path: string;
  schedule: string;
  timezone: string;
  enabled: boolean;
  script_path?: string;
  is_flow: boolean;
  edited_at: string;
  edited_by: string;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  lastCheck: string;
  details?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  max_members: number;
  member_count: number;  // Legacy - same as family_member_count
  family_member_count: number;  // Count of family_members profiles
  user_count: number;  // Count of users with login access
  document_count: number;
  ai_allowance_usd: number;
  api_mode?: 'managed' | 'byok';
  max_storage_gb?: number;
  updated_at?: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

// User with login access (from tenant_memberships)
export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: string;
  joined_at: string;
  last_login?: string;
  email_verified: boolean;
}

// Family member profile (from family_members table)
export interface FamilyMember {
  id: number;
  name: string;
  email: string;
  role: string;
  member_type: string;
  avatar_url?: string;
  created_at: string;
  is_active: boolean;
  last_login?: string;
  email_verified: boolean;
}

// Legacy alias for backwards compatibility
export type TenantMember = TenantUser;

export interface TenantUsage {
  cost_usd_30d: number;
  operations_30d: number;
  input_tokens_30d: number;
  output_tokens_30d: number;
}

export interface TenantStorage {
  used_bytes: number;
  used_gb: number;
  limit_gb: number;
  percent_used: number;
}

export interface TenantDetails {
  tenant: Tenant;
  owner?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  family_members: FamilyMember[];  // Family member profiles
  users: TenantUser[];  // Users with login access
  members: TenantUser[];  // Legacy alias for users
  usage: TenantUsage;
  storage: TenantStorage;
  recent_chats: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
  document_stats: {
    total: number;
    by_category: Record<string, number>;
  };
}

export interface BackendHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    postgres: { status: string; error: string | null; response_time_ms: number };
    cohere_chat: { status: string; error: string | null; response_time_ms: number };
    cohere_embed: { status: string; error: string | null; response_time_ms: number };
    cohere_rerank: { status: string; error: string | null; response_time_ms: number };
  };
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  username: string;
  operation: string;
  action_kind: string;
  resource: string;
  parameters: Record<string, string>;
  span?: string;
  workspace_id: string;
}

// Admin audit log entry (application-level)
export interface AdminAuditLog {
  id: number;
  actor_email: string;
  actor_type: 'admin' | 'system' | 'api';
  action: string;
  action_type: 'create' | 'read' | 'update' | 'delete' | 'auth' | 'config' | 'execute';
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  success: boolean;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminAuditLogsResponse {
  status: string;
  logs: AdminAuditLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  summary: {
    total_logs_30d: number;
    unique_actors_30d: number;
    failed_actions_30d: number;
    active_days_30d: number;
  };
}

export interface Document {
  id: number;
  title: string;
  tenant_id: string;
  category: string;
  created_at: string;
  created_by: string | null;
  tenant_name: string;
  content_preview: string;
}

export interface APICostsData {
  summary: {
    total_cost_usd: number;
    total_requests: number;
    total_input_tokens?: number;
    total_output_tokens?: number;
    period: string;
    start_date: string;
    end_date: string;
  };
  by_provider: Array<{
    provider: string;
    endpoint: string;
    model: string;
    requests: number;
    cost_usd: number;
    input_tokens: number;
    output_tokens: number;
    avg_latency_ms?: number;
  }>;
  by_tenant: Array<{
    tenant_id: string;
    tenant_name: string;
    requests: number;
    cost_usd: number;
  }>;
  by_day: Array<{
    date: string;
    requests: number;
    cost_usd: number;
  }>;
  projections: {
    mtd_cost_usd: number;
    projected_monthly_usd: number;
    days_elapsed: number;
    days_in_month: number;
  };
  message?: string;
  error?: string;
}

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

export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  primary_color: string;
  primary_foreground: string;
  secondary_color?: string;
  accent_color?: string;
  background_light?: string;
  background_dark?: string;
  preview_image_url?: string;
  sort_order: number;
}

const WINDMILL_TOKEN = import.meta.env.VITE_WINDMILL_TOKEN || '';
const WORKSPACE = import.meta.env.VITE_WINDMILL_WORKSPACE || 'family-brain';

class WindmillAdminClient {
  private token: string;
  private workspace: string;

  constructor() {
    this.token = WINDMILL_TOKEN;
    this.workspace = WORKSPACE;
  }

  private getBaseUrl(): string {
    // In development, use empty string to leverage Vite's proxy
    // This makes requests go to /api/... which Vite proxies to Windmill
    if (import.meta.env.DEV) {
      return '';
    }
    // In production, use configured URL or same-origin
    if (import.meta.env.VITE_WINDMILL_URL) {
      return import.meta.env.VITE_WINDMILL_URL;
    }
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Windmill API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Run a Windmill script and wait for result
   */
  async runScript<T>(scriptPath: string, args: Record<string, unknown> = {}): Promise<T> {
    return this.request<T>(
      `/api/w/${this.workspace}/jobs/run_wait_result/p/${scriptPath}`,
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * List recent jobs
   */
  async listJobs(params?: {
    running?: boolean;
    success?: boolean;
    script_path?: string;
    limit?: number;
    offset?: number;
  }): Promise<Job[]> {
    const searchParams = new URLSearchParams();
    if (params?.running !== undefined) searchParams.set('running', String(params.running));
    if (params?.success !== undefined) searchParams.set('success', String(params.success));
    if (params?.script_path) searchParams.set('script_path_exact', params.script_path);
    if (params?.limit) searchParams.set('per_page', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return this.request<Job[]>(
      `/api/w/${this.workspace}/jobs/list${query ? `?${query}` : ''}`
    );
  }

  /**
   * Get a specific job
   */
  async getJob(jobId: string): Promise<Job> {
    return this.request<Job>(`/api/w/${this.workspace}/jobs/get/${jobId}`);
  }

  /**
   * List workers (global endpoint)
   */
  async listWorkers(): Promise<Worker[]> {
    return this.request<Worker[]>('/api/workers/list');
  }

  /**
   * List scripts in workspace
   */
  async listScripts(params?: {
    path_start?: string;
    limit?: number;
  }): Promise<Script[]> {
    const searchParams = new URLSearchParams();
    if (params?.path_start) searchParams.set('path_start', params.path_start);
    if (params?.limit) searchParams.set('per_page', String(params.limit));

    const query = searchParams.toString();
    return this.request<Script[]>(
      `/api/w/${this.workspace}/scripts/list${query ? `?${query}` : ''}`
    );
  }

  /**
   * List flows in workspace
   */
  async listFlows(params?: {
    path_start?: string;
    limit?: number;
  }): Promise<Flow[]> {
    const searchParams = new URLSearchParams();
    if (params?.path_start) searchParams.set('path_start', params.path_start);
    if (params?.limit) searchParams.set('per_page', String(params.limit));

    const query = searchParams.toString();
    return this.request<Flow[]>(
      `/api/w/${this.workspace}/flows/list${query ? `?${query}` : ''}`
    );
  }

  /**
   * List schedules
   */
  async listSchedules(): Promise<Schedule[]> {
    return this.request<Schedule[]>(`/api/w/${this.workspace}/schedules/list`);
  }

  /**
   * Get workspace audit logs (recent activity) - Windmill's built-in logs
   */
  async getAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
    return this.request<AuditLogEntry[]>(
      `/api/w/${this.workspace}/audit/list?per_page=${limit}`
    );
  }

  /**
   * Get admin audit logs (application-level audit trail)
   */
  async getAdminAuditLogs(params?: {
    limit?: number;
    offset?: number;
    actor_email?: string;
    action_type?: string;
    resource_type?: string;
    tenant_id?: string;
    success?: boolean;
    start_date?: string;
    end_date?: string;
  }): Promise<AdminAuditLogsResponse> {
    return this.runScript<AdminAuditLogsResponse>('f/admin/get_admin_audit_logs', params || {});
  }

  /**
   * Log an admin action to the audit trail
   */
  async logAdminAction(params: {
    actor_email: string;
    action: string;
    action_type: 'create' | 'read' | 'update' | 'delete' | 'auth' | 'config' | 'execute';
    resource_type: string;
    resource_id?: string;
    resource_name?: string;
    tenant_id?: string;
    tenant_name?: string;
    old_value?: Record<string, unknown>;
    new_value?: Record<string, unknown>;
    changes?: Record<string, unknown>;
    success?: boolean;
    error_message?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ status: string; log_id?: number; error?: string }> {
    return this.runScript('f/admin/log_admin_action', params);
  }

  /**
   * Check Windmill health (version info)
   */
  async getVersion(): Promise<string> {
    const response = await fetch(`${this.getBaseUrl()}/api/version`);
    return response.text();
  }

  // ============ TENANT MANAGEMENT ============

  /**
   * List all tenants
   */
  async listTenants(): Promise<Tenant[]> {
    return this.runScript<Tenant[]>('f/admin/list_tenants', {});
  }

  /**
   * Get tenant details including members, usage, and recent activity
   */
  async getTenantDetails(tenantId: string): Promise<TenantDetails> {
    return this.runScript<TenantDetails>('f/admin/get_tenant_details', { tenant_id: tenantId });
  }

  /**
   * Create a new tenant
   */
  async createTenant(data: {
    name: string;
    owner_email: string;
    plan?: string;
  }): Promise<{ tenant_id: string; slug: string }> {
    return this.runScript('f/chatbot/create_tenant', data);
  }

  /**
   * Update tenant (with audit logging)
   */
  async updateTenant(
    tenantId: string,
    data: Partial<{
      name: string;
      status: string;
      plan: string;
      ai_allowance_usd: number;
      max_members: number;
      max_storage_gb: number;
    }>,
    actorEmail: string = 'admin@system'
  ): Promise<Tenant> {
    return this.runScript('f/admin/update_tenant', {
      tenant_id: tenantId,
      actor_email: actorEmail,
      ...data,
    });
  }

  // ============ DOCUMENT MANAGEMENT ============

  /**
   * List all documents (admin view)
   */
  async listAllDocuments(params?: {
    tenant_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ documents: Document[]; total: number }> {
    return this.runScript('f/chatbot/admin_list_documents', params || {});
  }

  // ============ API COSTS ============

  /**
   * Get API usage costs
   */
  async getApiCosts(params?: {
    period?: 'today' | 'week' | 'month' | 'all';
    tenant_id?: string;
  }): Promise<APICostsData> {
    return this.runScript<APICostsData>('f/chatbot/get_api_costs', params || {});
  }

  // ============ BRANDING & THEMING ============

  /**
   * Get branding for a tenant (or system default if no tenant_id)
   */
  async getTenantBranding(tenantId?: string): Promise<BrandingConfig> {
    return this.runScript<BrandingConfig>('f/chatbot/get_tenant_branding', {
      tenant_id: tenantId,
    });
  }

  /**
   * Update tenant branding
   */
  async updateTenantBranding(
    tenantId: string,
    branding: Partial<BrandingConfig>,
    userId?: string
  ): Promise<{ success: boolean; branding: BrandingConfig; message?: string; error?: string }> {
    return this.runScript('f/chatbot/update_tenant_branding', {
      tenant_id: tenantId,
      user_id: userId,
      ...branding,
    });
  }

  /**
   * List available theme presets
   */
  async listThemePresets(): Promise<{ presets: ThemePreset[]; count: number }> {
    return this.runScript('f/chatbot/list_theme_presets', {});
  }

  /**
   * Apply a theme preset to a tenant
   */
  async applyThemePreset(
    tenantId: string,
    presetId: string,
    userId?: string
  ): Promise<{ success: boolean; branding: BrandingConfig; preset_name: string; message?: string; error?: string }> {
    return this.runScript('f/chatbot/apply_theme_preset', {
      tenant_id: tenantId,
      preset_id: presetId,
      user_id: userId,
    });
  }

  // ============ HEALTH CHECKS ============

  /**
   * Get backend health check (PostgreSQL, Cohere, etc.)
   */
  async getBackendHealth(): Promise<BackendHealthCheck> {
    return this.runScript<BackendHealthCheck>('f/chatbot/health_check', {});
  }

  /**
   * Get comprehensive system health
   */
  async getSystemHealth(): Promise<ServiceHealth[]> {
    const health: ServiceHealth[] = [];
    const now = new Date().toISOString();

    // Check Windmill
    try {
      const start = performance.now();
      const version = await this.getVersion();
      const latency = Math.round(performance.now() - start);
      health.push({
        name: 'Windmill',
        status: 'healthy',
        latency,
        lastCheck: now,
        details: `Version: ${version.trim()}`,
      });
    } catch (e) {
      health.push({
        name: 'Windmill',
        status: 'unhealthy',
        lastCheck: now,
        details: e instanceof Error ? e.message : 'Unknown error',
      });
    }

    // Check Workers
    try {
      const start = performance.now();
      const workers = await this.listWorkers();
      const latency = Math.round(performance.now() - start);
      const defaultWorkers = workers.filter(w => w.worker_group === 'default').length;
      const nativeWorkers = workers.filter(w => w.worker_group === 'native').length;
      health.push({
        name: 'Windmill Workers',
        status: workers.length > 0 ? 'healthy' : 'degraded',
        latency,
        lastCheck: now,
        details: `${defaultWorkers} default, ${nativeWorkers} native workers`,
      });
    } catch (e) {
      health.push({
        name: 'Windmill Workers',
        status: 'unhealthy',
        lastCheck: now,
        details: e instanceof Error ? e.message : 'Unknown error',
      });
    }

    // Check backend services via health_check script
    try {
      const start = performance.now();
      const backendHealth = await this.getBackendHealth();
      const latency = Math.round(performance.now() - start);

      // PostgreSQL
      const pg = backendHealth.services.postgres;
      health.push({
        name: 'PostgreSQL',
        status: pg.status === 'up' ? 'healthy' : 'unhealthy',
        latency: pg.response_time_ms,
        lastCheck: now,
        details: pg.error || 'Primary database operational',
      });

      // Cohere Embed
      const embed = backendHealth.services.cohere_embed;
      health.push({
        name: 'Cohere Embeddings',
        status: embed.status === 'up' ? 'healthy' : 'unhealthy',
        latency: embed.response_time_ms,
        lastCheck: now,
        details: embed.error || 'Embedding service operational',
      });

      // Cohere Rerank
      const rerank = backendHealth.services.cohere_rerank;
      health.push({
        name: 'Cohere Rerank',
        status: rerank.status === 'up' ? 'healthy' : 'unhealthy',
        latency: rerank.response_time_ms,
        lastCheck: now,
        details: rerank.error || 'Reranking service operational',
      });

      // Cohere Chat (LLM)
      const chat = backendHealth.services.cohere_chat;
      health.push({
        name: 'Cohere Chat',
        status: chat.status === 'up' ? 'healthy' : 'unhealthy',
        latency: chat.response_time_ms,
        lastCheck: now,
        details: chat.error || 'LLM fallback operational',
      });

      // Overall backend latency
      console.log(`Backend health check completed in ${latency}ms`);
    } catch (e) {
      // If health check fails, add error entries
      health.push({
        name: 'PostgreSQL',
        status: 'unhealthy',
        lastCheck: now,
        details: e instanceof Error ? e.message : 'Health check failed',
      });
    }

    return health;
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<{
    running: number;
    completed_today: number;
    failed_today: number;
  }> {
    const [runningJobs, recentJobs] = await Promise.all([
      this.listJobs({ running: true, limit: 100 }),
      this.listJobs({ limit: 100 }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayJobs = recentJobs.filter(
      job => new Date(job.created_at) >= today
    );

    return {
      running: runningJobs.length,
      completed_today: todayJobs.filter(j => j.success === true).length,
      failed_today: todayJobs.filter(j => j.success === false).length,
    };
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(): Promise<{
    totalTenants: number;
    activeTenants: number;
    totalMembers: number;
    totalDocuments: number;
  }> {
    const tenants = await this.listTenants();
    return {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.status === 'active').length,
      totalMembers: tenants.reduce((sum, t) => sum + t.member_count, 0),
      totalDocuments: tenants.reduce((sum, t) => sum + t.document_count, 0),
    };
  }

  // ============ RAG STATS ============

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(tenantId?: string): Promise<EmbeddingStats> {
    return this.runScript<EmbeddingStats>('f/chatbot/get_embedding_stats', {
      tenant_id: tenantId,
    });
  }

  /**
   * Get query statistics
   */
  async getQueryStats(params?: {
    tenant_id?: string;
    period?: 'today' | 'week' | 'month';
  }): Promise<QueryStats> {
    return this.runScript<QueryStats>('f/chatbot/get_query_stats', params || {});
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    return this.runScript<DatabaseStats>('f/chatbot/get_database_stats', {});
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(tenantId?: string): Promise<UsageStats> {
    return this.runScript<UsageStats>('f/chatbot/get_usage_stats', {
      tenant_id: tenantId,
    });
  }

  // ============ USAGE ALERTS ============

  /**
   * Get usage alerts
   */
  async getUsageAlerts(params?: {
    tenant_id?: string;
    status?: UsageAlertStatus;
    alert_type?: UsageAlertType;
    limit?: number;
  }): Promise<UsageAlertsResponse> {
    return this.runScript<UsageAlertsResponse>('f/admin/get_usage_alerts', params || {});
  }

  /**
   * Check usage thresholds and create alerts
   */
  async checkUsageAlerts(params?: {
    tenant_id?: string;
    dry_run?: boolean;
  }): Promise<CheckUsageAlertsResponse> {
    return this.runScript<CheckUsageAlertsResponse>('f/admin/check_usage_alerts', params || {});
  }

  /**
   * Acknowledge a usage alert
   */
  async acknowledgeAlert(
    alertId: number,
    tenantId: string,
    userId?: string
  ): Promise<{ success: boolean; alert_id?: number; error?: string }> {
    return this.runScript('f/admin/manage_notifications', {
      action: 'acknowledge_alert',
      notification_id: alertId,
      tenant_id: tenantId,
      user_id: userId,
    });
  }
}

// ============ ADDITIONAL INTERFACES ============

export interface EmbeddingStats {
  pgvector: {
    status: string;
    total_vectors: number;
    vector_dimensions: number;
    index_type: string;
  };
  by_tenant: Array<{
    tenant_id: string;
    tenant_name: string;
    document_count: number;
    embedded_count: number;
  }>;
  by_category: Array<{
    category: string;
    count: number;
    embedded_count: number;
  }>;
  embedding_health: {
    documents_with_embeddings: number;
    documents_without_embeddings: number;
    embedding_coverage_pct: number;
  };
  recent_embeddings: Array<{
    id: number;
    title: string;
    category: string;
    tenant_name: string;
    created_at: string;
  }>;
}

export interface QueryStats {
  summary: {
    total_queries: number;
    avg_response_time_ms: number;
    avg_documents_retrieved: number;
    successful_queries: number;
    failed_queries: number;
    period: string;
    start_date: string;
    end_date: string;
  };
  by_tenant: Array<{
    tenant_id: string;
    tenant_name: string;
    query_count: number;
    conversations: number;
  }>;
  by_day: Array<{
    date: string;
    queries: number;
  }>;
  by_hour: Array<{
    hour: number;
    queries: number;
  }>;
  recent_queries: Array<{
    id: number;
    query_preview: string;
    tenant_name: string;
    created_at: string;
  }>;
  message?: string;
  error?: string;
}

export interface DatabaseStats {
  postgres: {
    status: string;
    version: string | null;
    database: string;
    host: string;
    size_mb: number;
    tables: Array<{
      table_name: string;
      row_count: number;
      size_kb: number;
    }>;
    connections: {
      active: number;
      idle: number;
      max: number;
    };
    extensions: Array<{
      extname: string;
      extversion: string;
    }>;
    recent_migrations: Array<{
      version: string;
      applied_at: string;
    }>;
    error?: string;
  };
  pgvector: {
    status: string;
    total_vectors: number;
    vector_dimensions: number;
    index_info: Array<{
      indexname: string;
      indexdef: string;
    }>;
  };
}

export interface UsageStats {
  summary: {
    total_tenants: number;
    total_documents: string | number;
    total_queries: string | number;
    total_tokens_used: number;
    total_cost_usd: number;
    period: string;
  };
  by_tenant: Array<{
    tenant_id: string;
    tenant_name: string;
    plan: string;
    status: string;
    document_count: number;
    member_count: number;
    max_members: number;
    max_storage_gb: number;
    tokens_used: number;
    cost_used: number;
    ai_allowance_usd: number;
    ai_quota_pct: number;
    member_quota_pct: number;
    query_count: number;
  }>;
  quota_status: Array<{
    tenant_id: string;
    tenant_name: string;
    alerts: Array<{
      type: string;
      pct: number;
      severity: 'warning' | 'critical';
    }>;
  }>;
  usage_trends: Array<{
    date: string;
    tokens: number;
    cost: number;
    operations: number;
  }>;
  storage_usage: Array<{
    tenant_id: string;
    tenant_name: string;
    max_storage_gb: number;
    document_count: number;
    used_mb: number;
    used_pct: number;
  }>;
  top_users: Array<{
    user_id: string;
    email: string;
    name: string;
    tenant_name: string;
    tokens_used: number;
    cost_usd: number;
    operations: number;
  }>;
}

// Usage Alerts
export type UsageAlertType =
  | 'ai_budget_warning'
  | 'ai_budget_critical'
  | 'ai_budget_exceeded'
  | 'storage_warning'
  | 'storage_critical'
  | 'member_limit_reached'
  | 'rate_limit_warning'
  | 'custom';

export type UsageAlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface UsageAlert {
  id: number;
  tenant_id: string;
  tenant_name: string;
  tenant_plan: string;
  alert_type: UsageAlertType;
  threshold_percent: number | null;
  current_value: number | null;
  limit_value: number | null;
  current_percent: number | null;
  status: UsageAlertStatus;
  triggered_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  message: string;
  email_sent: boolean;
  in_app_shown: boolean;
  metadata: Record<string, unknown>;
}

export interface UsageAlertsSummary {
  total_active: number;
  total_acknowledged: number;
  total_resolved: number;
  budget_alerts_active: number;
  storage_alerts_active: number;
  member_alerts_active: number;
}

export interface UsageAlertsResponse {
  alerts: UsageAlert[];
  summary: UsageAlertsSummary;
  total_returned: number;
}

export interface CheckUsageAlertsResponse {
  tenants_checked: number;
  alerts_created: Array<{
    tenant_id: string;
    tenant_name: string;
    alert_id?: number;
    alert_type: string;
    threshold_percent: number;
    current_percent: number;
    message: string;
    notification_created?: boolean;
    dry_run?: boolean;
  }>;
  notifications_created: number;
  errors: Array<{
    tenant_id: string;
    tenant_name: string;
    error: string;
  }>;
  dry_run: boolean;
}

export const windmillAdmin = new WindmillAdminClient();
export default windmillAdmin;
