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
} from './types';

const WINDMILL_URL = import.meta.env.VITE_WINDMILL_URL || 'http://localhost';
const WINDMILL_TOKEN = import.meta.env.VITE_WINDMILL_TOKEN || '';
const WORKSPACE = import.meta.env.VITE_WINDMILL_WORKSPACE || 'family-brain';

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
}

// Singleton instance
export const windmill = new WindmillClient();
