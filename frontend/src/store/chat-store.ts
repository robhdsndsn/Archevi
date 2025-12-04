import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Source } from '@/api/windmill';

// UUID generator that works in non-secure contexts (HTTP)
// crypto.randomUUID() only works in secure contexts (HTTPS/localhost)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: Source[];
  confidence?: number;
  reasoning?: string; // AI reasoning/thought process
  isStreaming?: boolean; // Whether reasoning is still streaming
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  windmillSessionId: string | null;
}

interface ChatStore {
  // Current session state
  currentSessionId: string | null;
  sessions: ChatSession[];
  isLoading: boolean;

  // Computed getters
  currentSession: () => ChatSession | null;
  messages: Message[];

  // Actions
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  setWindmillSessionId: (id: string) => void;
  clearChat: () => void;

  // Session management
  createNewSession: () => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, title: string) => void;
}

// Generate a title from the first user message
function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    const title = firstUserMessage.content.slice(0, 50);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  }
  return 'New Conversation';
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      currentSessionId: null,
      sessions: [],
      isLoading: false,

      // Computed: get current session
      currentSession: () => {
        const state = get();
        if (!state.currentSessionId) return null;
        return state.sessions.find(s => s.id === state.currentSessionId) || null;
      },

      // Messages getter for compatibility
      get messages() {
        const session = get().currentSession();
        return session?.messages || [];
      },

      addMessage: (msg) =>
        set((state) => {
          let sessionId = state.currentSessionId;
          let sessions = [...state.sessions];

          // Create new session if none exists
          if (!sessionId) {
            const newSession: ChatSession = {
              id: generateUUID(),
              title: 'New Conversation',
              messages: [],
              createdAt: new Date(),
              updatedAt: new Date(),
              windmillSessionId: null,
            };
            sessions = [newSession, ...sessions];
            sessionId = newSession.id;
          }

          // Add message to current session
          sessions = sessions.map(session => {
            if (session.id === sessionId) {
              const newMessages = [
                ...session.messages,
                {
                  ...msg,
                  id: generateUUID(),
                  timestamp: new Date(),
                },
              ];
              return {
                ...session,
                messages: newMessages,
                title: session.messages.length === 0 ? generateTitle(newMessages) : session.title,
                updatedAt: new Date(),
              };
            }
            return session;
          });

          return {
            sessions,
            currentSessionId: sessionId,
          };
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setWindmillSessionId: (windmillSessionId) =>
        set((state) => {
          if (!state.currentSessionId) return state;
          return {
            sessions: state.sessions.map(session =>
              session.id === state.currentSessionId
                ? { ...session, windmillSessionId }
                : session
            ),
          };
        }),

      clearChat: () =>
        set((state) => {
          // Create a new session instead of clearing
          const newSession: ChatSession = {
            id: generateUUID(),
            title: 'New Conversation',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            windmillSessionId: null,
          };
          return {
            sessions: [newSession, ...state.sessions],
            currentSessionId: newSession.id,
          };
        }),

      createNewSession: () => {
        const newSession: ChatSession = {
          id: generateUUID(),
          title: 'New Conversation',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          windmillSessionId: null,
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSession.id,
        }));
        return newSession.id;
      },

      switchSession: (sessionId) =>
        set({ currentSessionId: sessionId }),

      deleteSession: (sessionId) =>
        set((state) => {
          const newSessions = state.sessions.filter(s => s.id !== sessionId);
          const newCurrentId = state.currentSessionId === sessionId
            ? (newSessions[0]?.id || null)
            : state.currentSessionId;
          return {
            sessions: newSessions,
            currentSessionId: newCurrentId,
          };
        }),

      renameSession: (sessionId, title) =>
        set((state) => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, title }
              : session
          ),
        })),
    }),
    {
      name: 'archevi-chat',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);

// Legacy compatibility exports
export const sessionId = () => {
  const store = useChatStore.getState();
  const session = store.currentSession();
  return session?.windmillSessionId || null;
};
