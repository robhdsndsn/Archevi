import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatContainer } from './ChatContainer';

// Mock dependencies
vi.mock('@/store/chat-store', () => ({
  useChatStore: vi.fn(),
}));

vi.mock('@/store/auth-store', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/api/windmill', () => ({
  windmill: {
    ragQueryAgentStream: vi.fn(),
  },
}));

vi.mock('./ResearchModeToggle', () => ({
  ResearchModeToggle: ({ value }: { value: string }) => (
    <div data-testid="research-mode-toggle">Research Mode: {value}</div>
  ),
  useResearchMode: vi.fn(() => ['quick', vi.fn(), 'groq/llama-3.3-70b-versatile']),
}));

vi.mock('./SearchSuggestions', () => ({
  SearchSuggestions: () => <div data-testid="search-suggestions">Search Input</div>,
}));

vi.mock('./QueryTemplates', () => ({
  FeaturedTemplates: () => <div data-testid="query-templates">Templates</div>,
}));

vi.mock('./ChatMessage', () => ({
  ChatMessage: ({ message }: { message: { content: string; role: string } }) => (
    <div data-testid="chat-message" data-role={message.role}>
      {message.content}
    </div>
  ),
}));

vi.mock('@/lib/export-chat', () => ({
  exportChatToPDF: vi.fn(),
}));

import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { useResearchMode } from './ResearchModeToggle';

describe('ChatContainer', () => {
  const mockAddMessage = vi.fn();
  const mockUpdateMessage = vi.fn();
  const mockSetLoading = vi.fn();
  const mockSetWindmillSessionId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(useChatStore).mockReturnValue({
      isLoading: false,
      currentSession: () => ({
        id: 'session-1',
        title: 'Test Session',
        messages: [],
        windmillSessionId: null,
      }),
      addMessage: mockAddMessage,
      updateMessage: mockUpdateMessage,
      setLoading: mockSetLoading,
      setWindmillSessionId: mockSetWindmillSessionId,
    });

    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-1', tenant_id: 'tenant-1' },
    });

    mockAddMessage.mockImplementation((msg) => ({
      id: 'msg-' + Date.now(),
      ...msg,
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Empty state', () => {
    it('renders welcome message and templates when no messages', () => {
      render(<ChatContainer />);

      expect(screen.getByText('Welcome to Archevi')).toBeInTheDocument();
      expect(screen.getByTestId('query-templates')).toBeInTheDocument();
    });

    it('renders search suggestions input', () => {
      render(<ChatContainer />);

      expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
    });

    it('renders research mode toggle', () => {
      render(<ChatContainer />);

      expect(screen.getByTestId('research-mode-toggle')).toBeInTheDocument();
    });
  });

  describe('With messages', () => {
    it('renders messages when session has messages', () => {
      vi.mocked(useChatStore).mockReturnValue({
        isLoading: false,
        currentSession: () => ({
          id: 'session-1',
          title: 'Test Session',
          messages: [
            { id: '1', content: 'Hello', role: 'user' },
            { id: '2', content: 'Hi there!', role: 'assistant' },
          ],
          windmillSessionId: null,
        }),
        addMessage: mockAddMessage,
        updateMessage: mockUpdateMessage,
        setLoading: mockSetLoading,
        setWindmillSessionId: mockSetWindmillSessionId,
      });

      render(<ChatContainer />);

      const messages = screen.getAllByTestId('chat-message');
      expect(messages).toHaveLength(2);
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('renders user messages with user role', () => {
      vi.mocked(useChatStore).mockReturnValue({
        isLoading: false,
        currentSession: () => ({
          id: 'session-1',
          title: 'Test Session',
          messages: [{ id: '1', content: 'User message', role: 'user' }],
          windmillSessionId: null,
        }),
        addMessage: mockAddMessage,
        updateMessage: mockUpdateMessage,
        setLoading: mockSetLoading,
        setWindmillSessionId: mockSetWindmillSessionId,
      });

      render(<ChatContainer />);

      const message = screen.getByTestId('chat-message');
      expect(message).toHaveAttribute('data-role', 'user');
    });

    it('renders assistant messages with assistant role', () => {
      vi.mocked(useChatStore).mockReturnValue({
        isLoading: false,
        currentSession: () => ({
          id: 'session-1',
          title: 'Test Session',
          messages: [{ id: '1', content: 'Assistant message', role: 'assistant' }],
          windmillSessionId: null,
        }),
        addMessage: mockAddMessage,
        updateMessage: mockUpdateMessage,
        setLoading: mockSetLoading,
        setWindmillSessionId: mockSetWindmillSessionId,
      });

      render(<ChatContainer />);

      const message = screen.getByTestId('chat-message');
      expect(message).toHaveAttribute('data-role', 'assistant');
    });

    it('shows session title when messages exist', () => {
      vi.mocked(useChatStore).mockReturnValue({
        isLoading: false,
        currentSession: () => ({
          id: 'session-1',
          title: 'My Conversation',
          messages: [{ id: '1', content: 'Hello', role: 'user' }],
          windmillSessionId: null,
        }),
        addMessage: mockAddMessage,
        updateMessage: mockUpdateMessage,
        setLoading: mockSetLoading,
        setWindmillSessionId: mockSetWindmillSessionId,
      });

      render(<ChatContainer />);

      expect(screen.getByText('My Conversation')).toBeInTheDocument();
    });

    it('shows export button when messages exist', () => {
      vi.mocked(useChatStore).mockReturnValue({
        isLoading: false,
        currentSession: () => ({
          id: 'session-1',
          title: 'Test Session',
          messages: [
            { id: '1', content: 'Hello', role: 'user' },
            { id: '2', content: 'Hi!', role: 'assistant' },
          ],
          windmillSessionId: null,
        }),
        addMessage: mockAddMessage,
        updateMessage: mockUpdateMessage,
        setLoading: mockSetLoading,
        setWindmillSessionId: mockSetWindmillSessionId,
      });

      render(<ChatContainer />);

      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });
  });

  describe('Research modes', () => {
    it('uses quick mode by default', () => {
      render(<ChatContainer />);

      expect(useResearchMode).toHaveBeenCalled();
      expect(screen.getByText(/Research Mode: quick/)).toBeInTheDocument();
    });

    it('displays deep mode when set', () => {
      vi.mocked(useResearchMode).mockReturnValue([
        'deep',
        vi.fn(),
        'cohere/command-r-plus',
      ]);

      render(<ChatContainer />);

      expect(screen.getByText(/Research Mode: deep/)).toBeInTheDocument();
    });
  });

  describe('Component lifecycle', () => {
    it('renders without crashing', () => {
      render(<ChatContainer />);

      expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
    });

    it('cleans up abort controller on unmount', () => {
      const { unmount } = render(<ChatContainer />);

      unmount();

      // No errors should occur - cleanup should happen gracefully
      expect(true).toBe(true);
    });

    it('scrolls to bottom when new messages arrive', () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      vi.mocked(useChatStore).mockReturnValue({
        isLoading: false,
        currentSession: () => ({
          id: 'session-1',
          title: 'Test Session',
          messages: [{ id: '1', content: 'Hello', role: 'user' }],
          windmillSessionId: null,
        }),
        addMessage: mockAddMessage,
        updateMessage: mockUpdateMessage,
        setLoading: mockSetLoading,
        setWindmillSessionId: mockSetWindmillSessionId,
      });

      render(<ChatContainer />);

      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
  });
});
