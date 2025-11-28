import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WindmillClient } from './client';

describe('WindmillClient', () => {
  let client: WindmillClient;

  beforeEach(() => {
    client = new WindmillClient();
    vi.clearAllMocks();
  });

  describe('Login', () => {
    it('should call login endpoint with correct parameters', async () => {
      const mockResponse = {
        success: true,
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_in: 900,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          family_id: 'family-001',
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.login('test@example.com', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/run_wait_result/p/f/chatbot/auth_login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            device_info: undefined,
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include device info when provided', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await client.login('test@example.com', 'password', 'Chrome/Windows');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
            device_info: 'Chrome/Windows',
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
      } as Response);

      await expect(client.login('test@example.com', 'wrong')).rejects.toThrow('Unauthorized');
    });
  });

  describe('Verify Token', () => {
    it('should verify token with correct parameters', async () => {
      const mockResponse = {
        valid: true,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          family_id: 'family-001',
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.verifyToken('test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/run_wait_result/p/f/chatbot/auth_verify'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: 'test-token' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Refresh Token', () => {
    it('should refresh token with correct parameters', async () => {
      const mockResponse = {
        success: true,
        access_token: 'new-token',
        expires_in: 900,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          family_id: 'family-001',
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.refreshToken('refresh-token');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/run_wait_result/p/f/chatbot/auth_refresh'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'refresh-token' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Logout', () => {
    it('should logout with correct parameters', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await client.logout('refresh-token', false);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/run_wait_result/p/f/chatbot/auth_logout'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'refresh-token', revoke_all: false }),
        })
      );
    });

    it('should logout with revoke_all when specified', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await client.logout('refresh-token', true);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ refresh_token: 'refresh-token', revoke_all: true }),
        })
      );
    });
  });

  describe('Set Password', () => {
    it('should set password with invite token', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Password set' }),
      } as Response);

      const result = await client.setPassword('test@example.com', 'newpassword', 'invite-token');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/run_wait_result/p/f/chatbot/auth_set_password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'newpassword',
            invite_token: 'invite-token',
            admin_override: undefined,
          }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should set password with admin override', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await client.setPassword('test@example.com', 'newpassword', undefined, true);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'newpassword',
            invite_token: undefined,
            admin_override: true,
          }),
        })
      );
    });
  });

  describe('RAG Query', () => {
    it('should send RAG query with correct parameters', async () => {
      const mockResponse = {
        answer: 'Test answer',
        sources: [],
        conversation_id: 'conv-123',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.ragQuery({
        query: 'What is test?',
        family_id: 'family-001',
        conversation_id: 'conv-123',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/run_wait_result/p/f/chatbot/rag_query'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.answer).toBe('Test answer');
    });
  });

  describe('Document Operations', () => {
    it('should embed document', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, document_id: 'doc-123' }),
      } as Response);

      const result = await client.embedDocument({
        title: 'Test Doc',
        content: 'Test content',
        category: 'general',
        family_id: 'family-001',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/run_wait_result/p/f/chatbot/embed_document'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.success).toBe(true);
    });

    it('should search documents', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 1, title: 'Test' }]),
      } as Response);

      const result = await client.searchDocuments({
        query: 'test',
        family_id: 'family-001',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/run_wait_result/p/f/chatbot/search_documents'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('Family Members', () => {
    it('should list family members', async () => {
      const mockMembers = {
        success: true,
        members: [{ id: 1, name: 'Test', email: 'test@example.com' }],
        count: 1,
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMembers),
      } as Response);

      const result = await client.listFamilyMembers();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/run_wait_result/p/f/chatbot/manage_family_members'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'list' }),
        })
      );
      expect(result.members).toHaveLength(1);
    });

    it('should add family member', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      await client.addFamilyMember({
        email: 'new@example.com',
        name: 'New User',
        role: 'member',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            action: 'add',
            member_data: {
              email: 'new@example.com',
              name: 'New User',
              role: 'member',
            },
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw on network error', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.login('test@example.com', 'password')).rejects.toThrow('Network error');
    });

    it('should throw on HTTP error with message', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Internal server error' } }),
      } as Response);

      await expect(client.login('test@example.com', 'password')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should throw generic error when no message provided', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(client.login('test@example.com', 'password')).rejects.toThrow(
        'Request failed: 500'
      );
    });
  });
});
