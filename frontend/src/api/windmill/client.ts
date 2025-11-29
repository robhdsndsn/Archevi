import type {
  RAGQueryArgs,
  RAGQueryResult,
  WindmillError,
  EmbedDocumentArgs,
  EmbedDocumentResult,
  SearchDocumentsArgs,
  Document,
  AnalyticsData,
  AnalyticsPeriod,
  FamilyMembersResult,
  FamilyMemberInput,
  LoginResult,
  VerifyResult,
  RefreshResult,
  AuthResult,
  InviteResult,
  InviteValidationResult,
  PasswordResetResult,
  GetDocumentResult,
  DeleteDocumentResult,
  UpdateDocumentArgs,
  UpdateDocumentResult,
  ParsePDFResult,
  EmbedDocumentEnhancedArgs,
  EmbedDocumentEnhancedResult,
  TranscribeVoiceNoteArgs,
  TranscribeVoiceNoteResult,
  GetTagsResult,
  GetExpiringDocumentsResult,
  Tenant,
  TenantDetails,
  CreateTenantArgs,
  CreateTenantResult,
  UpdateTenantArgs,
  UpdateTenantResult,
  AdvancedSearchArgs,
  AdvancedSearchResult,
} from './types';

const WINDMILL_URL = import.meta.env.VITE_WINDMILL_URL || 'http://localhost';
const WINDMILL_TOKEN = import.meta.env.VITE_WINDMILL_TOKEN || '';
const WORKSPACE = import.meta.env.VITE_WINDMILL_WORKSPACE || 'archevi';

export class WindmillClient {
  private baseUrl: string;
  private token: string;
  private workspace: string;

  constructor() {
    this.baseUrl = WINDMILL_URL;
    this.token = WINDMILL_TOKEN;
    this.workspace = WORKSPACE;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/w/${this.workspace}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json() as WindmillError;
      throw new Error(errorData.error?.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Run the RAG query script and wait for result
   */
  async ragQuery(args: RAGQueryArgs): Promise<RAGQueryResult> {
    return this.request<RAGQueryResult>(
      '/jobs/run_wait_result/p/f/chatbot/rag_query',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Embed and store a document
   */
  async embedDocument(args: EmbedDocumentArgs): Promise<EmbedDocumentResult> {
    return this.request<EmbedDocumentResult>(
      '/jobs/run_wait_result/p/f/chatbot/embed_document',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Embed document with enhanced AI features (auto-categorization, smart tags, expiry detection)
   */
  async embedDocumentEnhanced(args: EmbedDocumentEnhancedArgs): Promise<EmbedDocumentEnhancedResult> {
    return this.request<EmbedDocumentEnhancedResult>(
      '/jobs/run_wait_result/p/f/chatbot/embed_document_enhanced',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Transcribe a voice note and embed it for RAG queries
   */
  async transcribeVoiceNote(args: TranscribeVoiceNoteArgs): Promise<TranscribeVoiceNoteResult> {
    return this.request<TranscribeVoiceNoteResult>(
      '/jobs/run_wait_result/p/f/chatbot/transcribe_voice_note',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Search documents with semantic search
   */
  async searchDocuments(args: SearchDocumentsArgs): Promise<Document[]> {
    return this.request<Document[]>(
      '/jobs/run_wait_result/p/f/chatbot/search_documents',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Get analytics and usage data
   */
  async getAnalytics(period: AnalyticsPeriod = 'week'): Promise<AnalyticsData> {
    return this.request<AnalyticsData>(
      '/jobs/run_wait_result/p/f/chatbot/get_analytics',
      {
        method: 'POST',
        body: JSON.stringify({ period }),
      }
    );
  }

  /**
   * List all family members
   */
  async listFamilyMembers(): Promise<FamilyMembersResult> {
    return this.request<FamilyMembersResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_family_members',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'list' }),
      }
    );
  }

  /**
   * Add a new family member
   */
  async addFamilyMember(member: FamilyMemberInput): Promise<FamilyMembersResult> {
    return this.request<FamilyMembersResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_family_members',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'add', member_data: member }),
      }
    );
  }

  /**
   * Update an existing family member
   */
  async updateFamilyMember(memberId: number, member: Partial<FamilyMemberInput>): Promise<FamilyMembersResult> {
    return this.request<FamilyMembersResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_family_members',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'update', member_id: memberId, member_data: member }),
      }
    );
  }

  /**
   * Remove a family member (soft delete)
   */
  async removeFamilyMember(memberId: number): Promise<FamilyMembersResult> {
    return this.request<FamilyMembersResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_family_members',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'remove', member_id: memberId }),
      }
    );
  }

  /**
   * Generate an invite link for a family member
   */
  async generateInvite(memberId: number): Promise<InviteResult> {
    return this.request<InviteResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_family_members',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'generate_invite', member_id: memberId }),
      }
    );
  }

  /**
   * Validate an invite token and get member info
   */
  async validateInviteToken(token: string): Promise<InviteValidationResult> {
    return this.request<InviteValidationResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_family_members',
      {
        method: 'POST',
        body: JSON.stringify({ action: 'get_by_invite_token', member_data: { token } }),
      }
    );
  }

  // ============================================
  // Auth Methods
  // ============================================

  /**
   * Login with email and password
   */
  async login(email: string, password: string, deviceInfo?: string): Promise<LoginResult> {
    return this.request<LoginResult>(
      '/jobs/run_wait_result/p/f/chatbot/auth_login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, device_info: deviceInfo }),
      }
    );
  }

  /**
   * Verify JWT access token
   */
  async verifyToken(token: string): Promise<VerifyResult> {
    return this.request<VerifyResult>(
      '/jobs/run_wait_result/p/f/chatbot/auth_verify',
      {
        method: 'POST',
        body: JSON.stringify({ token }),
      }
    );
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    return this.request<RefreshResult>(
      '/jobs/run_wait_result/p/f/chatbot/auth_refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );
  }

  /**
   * Logout (revoke refresh token)
   */
  async logout(refreshToken: string, revokeAll: boolean = false): Promise<AuthResult> {
    return this.request<AuthResult>(
      '/jobs/run_wait_result/p/f/chatbot/auth_logout',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken, revoke_all: revokeAll }),
      }
    );
  }

  /**
   * Set password (for initial setup or via invite)
   */
  async setPassword(
    email: string,
    password: string,
    inviteToken?: string,
    adminOverride?: boolean
  ): Promise<AuthResult> {
    return this.request<AuthResult>(
      '/jobs/run_wait_result/p/f/chatbot/auth_set_password',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          invite_token: inviteToken,
          admin_override: adminOverride,
        }),
      }
    );
  }

  /**
   * Request a password reset token
   */
  async requestPasswordReset(email: string): Promise<PasswordResetResult> {
    return this.request<PasswordResetResult>(
      '/jobs/run_wait_result/p/f/chatbot/auth_request_password_reset',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
  }

  // ============================================
  // Document CRUD Methods
  // ============================================

  /**
   * Get a single document by ID
   */
  async getDocument(documentId: number): Promise<GetDocumentResult> {
    return this.request<GetDocumentResult>(
      '/jobs/run_wait_result/p/f/chatbot/get_document',
      {
        method: 'POST',
        body: JSON.stringify({ document_id: documentId }),
      }
    );
  }

  /**
   * Delete a document by ID
   */
  async deleteDocument(documentId: number): Promise<DeleteDocumentResult> {
    return this.request<DeleteDocumentResult>(
      '/jobs/run_wait_result/p/f/chatbot/delete_document',
      {
        method: 'POST',
        body: JSON.stringify({ document_id: documentId }),
      }
    );
  }

  /**
   * Update a document (re-embeds if content changes)
   */
  async updateDocument(args: UpdateDocumentArgs): Promise<UpdateDocumentResult> {
    return this.request<UpdateDocumentResult>(
      '/jobs/run_wait_result/p/f/chatbot/update_document',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Parse a PDF file and extract text content
   */
  async parsePDF(fileContent: string, filename: string): Promise<ParsePDFResult> {
    return this.request<ParsePDFResult>(
      '/jobs/run_wait_result/p/f/chatbot/parse_pdf',
      {
        method: 'POST',
        body: JSON.stringify({ file_content: fileContent, filename }),
      }
    );
  }

  // ============================================
  // Tag & Expiry Methods
  // ============================================

  /**
   * Get all unique tags across documents
   */
  async getTags(): Promise<GetTagsResult> {
    return this.request<GetTagsResult>(
      '/jobs/run_wait_result/p/f/chatbot/get_tags',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  }

  /**
   * Get documents with upcoming expiry dates
   */
  async getExpiringDocuments(days: number = 90): Promise<GetExpiringDocumentsResult> {
    return this.request<GetExpiringDocumentsResult>(
      '/jobs/run_wait_result/p/f/chatbot/get_expiring_documents',
      {
        method: 'POST',
        body: JSON.stringify({ days }),
      }
    );
  }
  // ============================================
  // Admin: Multi-Tenant Management
  // ============================================

  /**
   * List all tenants (admin only)
   */
  async listTenants(): Promise<Tenant[]> {
    return this.request<Tenant[]>(
      '/jobs/run_wait_result/p/f/admin/list_tenants',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  }

  /**
   * Get detailed tenant info (admin only)
   */
  async getTenantDetails(tenantId: string): Promise<TenantDetails> {
    return this.request<TenantDetails>(
      '/jobs/run_wait_result/p/f/admin/get_tenant_details',
      {
        method: 'POST',
        body: JSON.stringify({ tenant_id: tenantId }),
      }
    );
  }

  /**
   * Create a new tenant (admin only)
   */
  async createTenant(args: CreateTenantArgs): Promise<CreateTenantResult> {
    return this.request<CreateTenantResult>(
      '/jobs/run_wait_result/p/f/admin/create_tenant',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Update an existing tenant (admin only)
   */
  async updateTenant(args: UpdateTenantArgs): Promise<UpdateTenantResult> {
    return this.request<UpdateTenantResult>(
      '/jobs/run_wait_result/p/f/admin/update_tenant',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  // ============================================
  // Advanced Search
  // ============================================

  /**
   * Search documents with advanced filters
   */
  async advancedSearchDocuments(args: AdvancedSearchArgs): Promise<AdvancedSearchResult> {
    return this.request<AdvancedSearchResult>(
      '/jobs/run_wait_result/p/f/chatbot/search_documents_advanced',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }
}

// Singleton instance
export const windmill = new WindmillClient();
