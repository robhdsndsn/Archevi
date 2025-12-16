import type {
  RAGQueryArgs,
  RAGQueryResult,
  RAGAgentArgs,
  RAGAgentResult,
  RAGStreamEvent,
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
  SuggestTagsArgs,
  SuggestTagsResult,
  AdminListDocumentsArgs,
  AdminListDocumentsResult,
  ProcessZipUploadArgs,
  ProcessZipUploadResult,
  ExtractDocumentDataArgs,
  ExtractDocumentDataResult,
  EmbedImageArgs,
  EmbedImageResult,
  EmbedDocumentFromStorageArgs,
  EmbedDocumentFromStorageResult,
  // Document sharing types
  SharePermission,
  ShareDocumentResult,
  UnshareDocumentResult,
  ListSharedWithMeResult,
  ListSharedByMeResult,
  GetDocumentSharesResult,
  MarkNotificationReadResult,
  GetTenantMembersResult,
  // Related documents types
  RelatedDocumentsArgs,
  RelatedDocumentsResult,
  // In-app notification types
  GetNotificationsArgs,
  GetNotificationsResult,
  ManageNotificationArgs,
  ManageNotificationResult,
  // Search suggestions types
  GetSearchSuggestionsArgs,
  GetSearchSuggestionsResult,
  // Document versioning types
  GetDocumentVersionsArgs,
  GetDocumentVersionsResult,
  RollbackDocumentVersionArgs,
  RollbackDocumentVersionResult,
  CreateDocumentVersionArgs,
  CreateDocumentVersionResult,
  // Calendar integration types
  GetCalendarSettingsArgs,
  GetCalendarSettingsResult,
  // Secure links types
  CreateSecureLinkArgs,
  CreateSecureLinkResult,
  AccessSecureLinkArgs,
  AccessSecureLinkResult,
  RevokeSecureLinkArgs,
  RevokeSecureLinkResult,
  ListSecureLinksArgs,
  ListSecureLinksResult,
  // 2FA types
  Setup2FAResult,
  Verify2FAResult,
  Disable2FAResult,
  GenerateBackupCodesResult,
  VerifyBackupCodeResult,
  // Timeline types
  GetTimelineEventsArgs,
  GetTimelineEventsResult,
  GenerateTimelineEventsArgs,
  GenerateTimelineEventsResult,
  ManageTimelineEventArgs,
  ManageTimelineEventResult,
  // Biography types
  GenerateBiographyArgs,
  GenerateBiographyResult,
  // TTS types
  GetTTSVoicesResult,
  TextToSpeechArgs,
  TextToSpeechResult,
  // Branding types
  BrandingConfig,
  GetTenantBrandingArgs,
} from './types';

const WINDMILL_TOKEN = import.meta.env.VITE_WINDMILL_TOKEN || '';
const WORKSPACE = import.meta.env.VITE_WINDMILL_WORKSPACE || 'archevi';

export class WindmillClient {
  private token: string;
  private workspace: string;

  constructor() {
    this.token = WINDMILL_TOKEN;
    this.workspace = WORKSPACE;
  }

  /**
   * Get the Windmill base URL dynamically at request time.
   * This allows the app to work from any device on the network (phone, tablet, etc.)
   * by using the same hostname the browser used to access the frontend.
   */
  private getBaseUrl(): string {
    // If explicitly set in env, use that (for production deployments)
    if (import.meta.env.VITE_WINDMILL_URL) {
      return import.meta.env.VITE_WINDMILL_URL;
    }

    // For local development, use the same host as the frontend but on port 80
    // This works whether accessing from localhost, 192.168.x.x, or any other address
    const protocol = window.location.protocol; // http: or https:
    const hostname = window.location.hostname; // localhost, 192.168.40.72, etc.

    // Windmill runs on port 80, so no port suffix needed for http
    return `${protocol}//${hostname}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/api/w/${this.workspace}${endpoint}`;

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
   * Run the RAG query script and wait for result (legacy Cohere-based)
   * @deprecated Use ragQueryAgent for better performance and lower cost
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
   * Run the AI Agent RAG query with Groq tool calling (recommended)
   * - Uses Llama 3.3 70B (FREE tier)
   * - AI decides when to search documents
   * - Still uses Cohere for embeddings/reranking
   */
  async ragQueryAgent(args: RAGAgentArgs): Promise<RAGAgentResult> {
    return this.request<RAGAgentResult>(
      '/jobs/run_wait_result/p/f/chatbot/rag_query_agent',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Run the AI Agent RAG query with SSE streaming
   * Returns an async generator that yields RAGStreamEvent objects as they arrive.
   *
   * Events emitted:
   * - thinking: {status: "started"} - AI is processing
   * - search: {status: "started"|"complete", query, count?, sources?} - Document search
   * - answer: {status: "started"|"complete", content?} - Answer generation
   * - complete: Full result object
   * - error: {message, retry_after?}
   *
   * Usage:
   * ```typescript
   * for await (const event of windmill.ragQueryAgentStream(args)) {
   *   switch (event.type) {
   *     case 'thinking': // Show thinking indicator
   *     case 'search': // Update search status
   *     case 'answer': // Display answer as it streams
   *     case 'complete': // Final result
   *   }
   * }
   * ```
   */
  async *ragQueryAgentStream(
    args: RAGAgentArgs,
    signal?: AbortSignal
  ): AsyncGenerator<RAGStreamEvent, void, unknown> {
    const baseUrl = this.getBaseUrl();
    // Use run_and_stream endpoint for SSE streaming
    const url = `${baseUrl}/api/w/${this.workspace}/jobs/run_and_stream/p/f/chatbot/rag_query_agent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ ...args, stream: true }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json() as WindmillError;
      throw new Error(errorData.error?.message || `Streaming failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null - streaming not supported');
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Windmill SSE format: data: {"type": "update", ...}
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const windmillEvent = JSON.parse(jsonStr);

              // Windmill wraps stream results in an update event
              // The actual data is in new_result_stream as a JSON string
              if (windmillEvent.type === 'update' && windmillEvent.new_result_stream) {
                // Parse the streamed result (our RAGStreamEvent)
                const ragEvent = JSON.parse(windmillEvent.new_result_stream) as RAGStreamEvent;
                yield ragEvent;
              } else if (windmillEvent.type === 'update' && windmillEvent.completed) {
                // Job completed - check for wm_stream in only_result
                // wmill.stream_result() concatenates all streamed JSON objects
                const result = windmillEvent.only_result;
                if (result?.wm_stream) {
                  // Parse concatenated JSON objects from wm_stream
                  // Format: {"type":"thinking",...}{"type":"search",...}{"type":"complete",...}
                  const wmStream = result.wm_stream as string;
                  const events = this.parseWmStream(wmStream);
                  for (const event of events) {
                    yield event;
                  }
                } else if (result && !result.error) {
                  // No stream events, emit complete with the result
                  yield {
                    type: 'complete',
                    data: result,
                  } as RAGStreamEvent;
                } else if (result?.error) {
                  yield {
                    type: 'error',
                    data: { message: result.error.message || 'Unknown error' },
                  } as RAGStreamEvent;
                }
                break;
              }
            } catch (parseError) {
              console.warn('[ragQueryAgentStream] Failed to parse SSE event:', parseError, jsonStr);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Parse concatenated JSON objects from Windmill's wm_stream field
   * Format: {"type":"thinking",...}{"type":"search",...}{"type":"complete",...}
   */
  private parseWmStream(wmStream: string): RAGStreamEvent[] {
    const events: RAGStreamEvent[] = [];
    let depth = 0;
    let start = 0;

    for (let i = 0; i < wmStream.length; i++) {
      if (wmStream[i] === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (wmStream[i] === '}') {
        depth--;
        if (depth === 0) {
          try {
            const jsonStr = wmStream.slice(start, i + 1);
            const event = JSON.parse(jsonStr) as RAGStreamEvent;
            events.push(event);
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    return events;
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
   * Embed an image for visual search (opt-in feature)
   * Resizes to 512x512 and embeds using Cohere Embed v4
   * Cost: ~$0.00076 per image
   */
  async embedImage(args: EmbedImageArgs): Promise<EmbedImageResult> {
    return this.request<EmbedImageResult>(
      '/jobs/run_wait_result/p/f/chatbot/embed_image',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Embed document from Supabase Storage with AI-powered features.
   * Use this for scalable uploads - file is already in Supabase Storage,
   * Windmill fetches, extracts text, and embeds.
   */
  async embedDocumentFromStorage(args: EmbedDocumentFromStorageArgs): Promise<EmbedDocumentFromStorageResult> {
    return this.request<EmbedDocumentFromStorageResult>(
      '/jobs/run_wait_result/p/f/chatbot/embed_document_from_storage',
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
   * @param period - Time period for analytics
   * @param tenant_id - Optional tenant ID to filter analytics (for user-level access)
   */
  async getAnalytics(period: AnalyticsPeriod = 'week', tenant_id?: string): Promise<AnalyticsData> {
    return this.request<AnalyticsData>(
      '/jobs/run_wait_result/p/f/chatbot/get_analytics',
      {
        method: 'POST',
        body: JSON.stringify({ period, tenant_id }),
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

  /**
   * Get AI suggestions for tags and category before document upload
   */
  async suggestTags(args: SuggestTagsArgs): Promise<SuggestTagsResult> {
    return this.request<SuggestTagsResult>(
      '/jobs/run_wait_result/p/f/chatbot/suggest_tags',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  // ============================================
  // Admin Document Management
  // ============================================

  /**
   * List all documents across all tenants (admin only)
   */
  async adminListDocuments(args: AdminListDocumentsArgs): Promise<AdminListDocumentsResult> {
    return this.request<AdminListDocumentsResult>(
      '/jobs/run_wait_result/p/f/chatbot/admin_list_documents',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  // ============================================
  // Bulk Upload
  // ============================================

  /**
   * Process a ZIP file containing multiple documents for batch embedding
   */
  async processZipUpload(args: ProcessZipUploadArgs): Promise<ProcessZipUploadResult> {
    return this.request<ProcessZipUploadResult>(
      '/jobs/run_wait_result/p/f/chatbot/process_zip_upload',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  // ============================================
  // Smart Data Extraction
  // ============================================

  /**
   * Extract structured data from a document using AI
   * Extracts key fields based on document category (insurance, medical, financial, etc.)
   */
  async extractDocumentData(args: ExtractDocumentDataArgs): Promise<ExtractDocumentDataResult> {
    return this.request<ExtractDocumentDataResult>(
      '/jobs/run_wait_result/p/f/chatbot/extract_document_data',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }
  // Document Sharing Methods
  // ============================================

  /**
   * Share a document with another family member
   */
  async shareDocument(
    documentId: string,
    userId: string,
    sharedWithUserId: string,
    permission: SharePermission = 'view',
    message?: string
  ): Promise<ShareDocumentResult> {
    return this.request<ShareDocumentResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_document_shares',
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'share',
          document_id: documentId,
          user_id: userId,
          share_data: {
            shared_with_user_id: sharedWithUserId,
            permission,
            message,
          },
        }),
      }
    );
  }

  /**
   * Remove sharing for a document
   */
  async unshareDocument(
    documentId: string,
    userId: string,
    sharedWithUserId: string
  ): Promise<UnshareDocumentResult> {
    return this.request<UnshareDocumentResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_document_shares',
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'unshare',
          document_id: documentId,
          user_id: userId,
          share_data: {
            shared_with_user_id: sharedWithUserId,
          },
        }),
      }
    );
  }

  /**
   * Get documents shared with the current user
   */
  async listSharedWithMe(userId: string): Promise<ListSharedWithMeResult> {
    return this.request<ListSharedWithMeResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_document_shares',
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'list_shared_with_me',
          user_id: userId,
        }),
      }
    );
  }

  /**
   * Get documents the current user has shared
   */
  async listSharedByMe(userId: string): Promise<ListSharedByMeResult> {
    return this.request<ListSharedByMeResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_document_shares',
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'list_shared_by_me',
          user_id: userId,
        }),
      }
    );
  }

  /**
   * Get all shares for a specific document
   */
  async getDocumentShares(documentId: string): Promise<GetDocumentSharesResult> {
    return this.request<GetDocumentSharesResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_document_shares',
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'get_document_shares',
          document_id: documentId,
        }),
      }
    );
  }

  /**
   * Mark a share notification as read
   */
  async markShareNotificationRead(
    userId: string,
    shareId: string
  ): Promise<MarkNotificationReadResult> {
    return this.request<MarkNotificationReadResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_document_shares',
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'mark_notification_read',
          user_id: userId,
          share_data: {
            share_id: shareId,
          },
        }),
      }
    );
  }

  /**
   * Get tenant members for sharing (excludes current user)
   */
  async getTenantMembersForSharing(
    tenantId: string,
    userId: string
  ): Promise<GetTenantMembersResult> {
    return this.request<GetTenantMembersResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_document_shares',
      {
        method: 'POST',
        body: JSON.stringify({
          action: 'get_tenant_members',
          tenant_id: tenantId,
          user_id: userId,
        }),
      }
    );
  }

  // ============================================
  // Related Documents
  // ============================================

  /**
   * Get documents related to a given document by vector similarity
   * Returns documents with similar content, useful for "You might also want to see..." suggestions
   */
  async getRelatedDocuments(args: RelatedDocumentsArgs): Promise<RelatedDocumentsResult> {
    return this.request<RelatedDocumentsResult>(
      '/jobs/run_wait_result/p/f/chatbot/get_related_documents',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  // ============================================
  // In-App Notifications
  // ============================================

  /**
   * Get notifications for the current user/tenant
   */
  async getNotifications(args: GetNotificationsArgs): Promise<GetNotificationsResult> {
    return this.request<GetNotificationsResult>(
      '/jobs/run_wait_result/p/f/admin/get_notifications',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Manage notification state (mark read, dismiss, etc.)
   */
  async manageNotification(args: ManageNotificationArgs): Promise<ManageNotificationResult> {
    return this.request<ManageNotificationResult>(
      '/jobs/run_wait_result/p/f/admin/manage_notifications',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  // ============================================
  // Search Suggestions (Autocomplete)
  // ============================================

  /**
   * Get smart search suggestions based on query prefix.
   * Returns suggestions from documents, people, tags, recent queries, and extracted entities.
   */
  async getSearchSuggestions(args: GetSearchSuggestionsArgs): Promise<GetSearchSuggestionsResult> {
    return this.request<GetSearchSuggestionsResult>(
      '/jobs/run_wait_result/p/f/chatbot/get_search_suggestions',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  // ============================================
  // Document Versioning
  // ============================================

  /**
   * Get version history for a document.
   * Returns all versions with metadata sorted by version number descending.
   */
  async getDocumentVersions(args: GetDocumentVersionsArgs): Promise<GetDocumentVersionsResult> {
    return this.request<GetDocumentVersionsResult>(
      '/jobs/run_wait_result/p/f/documents/get_document_versions',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Rollback a document to a previous version.
   * Creates a new version from the old content (preserves history).
   */
  async rollbackDocumentVersion(args: RollbackDocumentVersionArgs): Promise<RollbackDocumentVersionResult> {
    return this.request<RollbackDocumentVersionResult>(
      '/jobs/run_wait_result/p/f/documents/rollback_document_version',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Create a new version of an existing document.
   * Used when updating a document to preserve history.
   */
  async createDocumentVersion(args: CreateDocumentVersionArgs): Promise<CreateDocumentVersionResult> {
    return this.request<CreateDocumentVersionResult>(
      '/jobs/run_wait_result/p/f/documents/create_document_version',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  // ============================================
  // Calendar Integration
  // ============================================

  /**
   * Get calendar feed settings for a tenant.
   * Returns the feed URL and configuration options.
   */
  async getCalendarSettings(args: GetCalendarSettingsArgs): Promise<GetCalendarSettingsResult> {
    return this.request<GetCalendarSettingsResult>(
      '/jobs/run_wait_result/p/f/chatbot/get_calendar_settings',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Update calendar feed settings (enable/disable, categories, reminders)
   */
  async updateCalendarSettings(
    tenantId: string,
    settings: {
      is_enabled?: boolean;
      reminder_days?: number[];
      include_categories?: string[];
    }
  ): Promise<GetCalendarSettingsResult> {
    return this.request<GetCalendarSettingsResult>(
      '/jobs/run_wait_result/p/f/chatbot/get_calendar_settings',
      {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantId,
          action: 'update',
          ...settings,
        }),
      }
    );
  }

  /**
   * Regenerate the calendar feed token (invalidates old URL)
   */
  async regenerateCalendarToken(tenantId: string): Promise<GetCalendarSettingsResult> {
    return this.request<GetCalendarSettingsResult>(
      '/jobs/run_wait_result/p/f/chatbot/get_calendar_settings',
      {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: tenantId,
          action: 'regenerate_token',
        }),
      }
    );
  }

  // ============================================
  // Secure Links API
  // ============================================

  /**
   * Create a secure, expiring link for sharing a document externally
   */
  async createSecureLink(args: CreateSecureLinkArgs): Promise<CreateSecureLinkResult> {
    return this.request<CreateSecureLinkResult>(
      '/jobs/run_wait_result/p/f/chatbot/create_secure_link',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Access a document via secure link (public, no auth required)
   */
  async accessSecureLink(args: AccessSecureLinkArgs): Promise<AccessSecureLinkResult> {
    return this.request<AccessSecureLinkResult>(
      '/jobs/run_wait_result/p/f/chatbot/access_secure_link',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Revoke a secure link so it can no longer be used
   */
  async revokeSecureLink(args: RevokeSecureLinkArgs): Promise<RevokeSecureLinkResult> {
    return this.request<RevokeSecureLinkResult>(
      '/jobs/run_wait_result/p/f/chatbot/revoke_secure_link',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * List all secure links for a tenant or specific document
   */
  async listSecureLinks(args: ListSecureLinksArgs): Promise<ListSecureLinksResult> {
    return this.request<ListSecureLinksResult>(
      '/jobs/run_wait_result/p/f/chatbot/list_secure_links',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  // ============================================
  // Two-Factor Authentication (2FA)
  // ============================================

  /**
   * Start 2FA setup - generates TOTP secret and QR code
   * User must verify with auth code before 2FA is enabled
   */
  async setup2FA(userId: number): Promise<Setup2FAResult> {
    return this.request<Setup2FAResult>(
      '/jobs/run_wait_result/p/f/chatbot/auth_setup_2fa',
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      }
    );
  }

  /**
   * Verify 2FA code (for setup or login)
   * - Setup mode: Pass user_id and enable_2fa=true
   * - Login mode: Pass session_token from login response
   */
  async verify2FA(
    code: string,
    options: {
      userId?: number;
      enable2FA?: boolean;
      sessionToken?: string;
    }
  ): Promise<Verify2FAResult> {
    return this.request<Verify2FAResult>(
      '/jobs/run_wait_result/p/f/chatbot/auth_verify_2fa',
      {
        method: 'POST',
        body: JSON.stringify({
          code,
          user_id: options.userId,
          enable_2fa: options.enable2FA,
          session_token: options.sessionToken,
        }),
      }
    );
  }

  /**
   * Disable 2FA for a user (requires password confirmation)
   */
  async disable2FA(userId: number, password: string): Promise<Disable2FAResult> {
    return this.request<Disable2FAResult>(
      '/jobs/run_wait_result/p/f/chatbot/auth_disable_2fa',
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, password }),
      }
    );
  }

  /**
   * Generate new backup codes for 2FA recovery
   * Requires password confirmation, replaces existing codes
   * IMPORTANT: The codes are only shown once!
   */
  async generateBackupCodes(userId: number, password: string): Promise<GenerateBackupCodesResult> {
    return this.request<GenerateBackupCodesResult>(
      '/jobs/run_wait_result/p/f/chatbot/auth_generate_backup_codes',
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, password }),
      }
    );
  }

  /**
   * Verify a backup code during login (when user can't access authenticator)
   */
  async verifyBackupCode(
    sessionToken: string,
    backupCode: string
  ): Promise<VerifyBackupCodeResult> {
    return this.request<VerifyBackupCodeResult>(
      '/jobs/run_wait_result/p/f/chatbot/auth_verify_backup_code',
      {
        method: 'POST',
        body: JSON.stringify({
          session_token: sessionToken,
          backup_code: backupCode,
        }),
      }
    );
  }

  // ============================================
  // Timeline Methods
  // ============================================

  /**
   * Get timeline events with optional filters
   */
  async getTimelineEvents(args: GetTimelineEventsArgs): Promise<GetTimelineEventsResult> {
    return this.request<GetTimelineEventsResult>(
      '/jobs/run_wait_result/p/f/chatbot/get_timeline_events',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Generate timeline events from a document using AI extraction
   */
  async generateTimelineEvents(args: GenerateTimelineEventsArgs): Promise<GenerateTimelineEventsResult> {
    return this.request<GenerateTimelineEventsResult>(
      '/jobs/run_wait_result/p/f/chatbot/generate_timeline_events',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  /**
   * Create, update, or delete a timeline event
   */
  async manageTimelineEvent(args: ManageTimelineEventArgs): Promise<ManageTimelineEventResult> {
    return this.request<ManageTimelineEventResult>(
      '/jobs/run_wait_result/p/f/chatbot/manage_timeline_event',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  // ============================================
  // Biography Methods
  // ============================================

  /**
   * Generate an AI-powered biography for a family member
   * Uses documents from the knowledge base to create a narrative story
   */
  async generateBiography(args: GenerateBiographyArgs): Promise<GenerateBiographyResult> {
    return this.request<GenerateBiographyResult>(
      '/jobs/run_wait_result/p/f/chatbot/generate_biography',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }

  // ============================================
  // Text-to-Speech (TTS) Methods
  // ============================================

  /**
   * Get available TTS voices
   */
  async getTTSVoices(): Promise<GetTTSVoicesResult> {
    return this.request<GetTTSVoicesResult>(
      '/jobs/run_wait_result/p/f/chatbot/get_tts_voices',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  }

  /**
   * Convert text to speech using ElevenLabs
   * Returns base64-encoded audio
   */
  async textToSpeech(args: TextToSpeechArgs): Promise<TextToSpeechResult> {
    return this.request<TextToSpeechResult>(
      '/jobs/run_wait_result/p/f/chatbot/text_to_speech',
      {
        method: 'POST',
        body: JSON.stringify(args),
      },
    );
  }

  // ============================================
  // Tenant Branding Methods
  // ============================================

  /**
   * Get branding configuration for a tenant.
   * Used to apply custom colors, logos, and styling.
   * Returns BrandingConfig directly from the Windmill script.
   */
  async getTenantBranding(args: GetTenantBrandingArgs): Promise<BrandingConfig> {
    return this.request<BrandingConfig>(
      '/jobs/run_wait_result/p/f/chatbot/get_tenant_branding',
      {
        method: 'POST',
        body: JSON.stringify(args),
      }
    );
  }
}

// Singleton instance
export const windmill = new WindmillClient();
