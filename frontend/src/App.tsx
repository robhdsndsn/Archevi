import { useState, useEffect } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatHistory } from '@/components/ChatHistory';
import { CommandPalette } from '@/components/CommandPalette';
import { AppSidebar } from '@/components/AppSidebar';
import { DocumentsView } from '@/components/documents';
import { AnalyticsView } from '@/components/analytics';
import { SettingsView } from '@/components/settings';
import { FamilyMembersView } from '@/components/family';
import { LoginPage, SetPasswordPage, ForgotPasswordPage } from '@/components/auth';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

export type ViewAsRole = 'admin' | 'user';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [currentView, setCurrentView] = useState('chat');
  const [viewAs, setViewAs] = useState<ViewAsRole>('admin');
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { switchSession } = useChatStore();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  // Check for invite token in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      setShowSetPassword(true);
    }
  }, []);

  // Effective admin status - true only if user is admin AND viewing as admin
  const isEffectiveAdmin = user?.role === 'admin' && viewAs === 'admin';

  useEffect(() => {
    // Check system preference on mount
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('archevi-theme');

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newValue = !prev;
      if (newValue) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('archevi-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('archevi-theme', 'light');
      }
      return newValue;
    });
  };

  const handleNavigate = (view: string) => {
    // Handle actual navigation for implemented views
    if (view === 'chat' || view === 'history' || view === 'documents' || view === 'analytics' || view === 'settings' || view === 'family') {
      setCurrentView(view);
      return;
    }

    // For unimplemented views, show "coming soon"
    alert(`${view.charAt(0).toUpperCase() + view.slice(1).replace(/-/g, ' ')} view coming soon!`);
  };

  const handleSelectSession = (sessionId: string) => {
    switchSession(sessionId);
    setCurrentView('chat');
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'chat':
        return 'Chat';
      case 'history':
        return 'Chat History';
      case 'documents':
        return 'Documents';
      case 'analytics':
        return 'Analytics';
      case 'settings':
        return 'Settings';
      case 'family':
        return 'Family Members';
      default:
        return currentView.charAt(0).toUpperCase() + currentView.slice(1);
    }
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show set password page for invited users
  if (showSetPassword) {
    return (
      <SetPasswordPage
        onSuccess={() => {
          // Clear URL params and show login
          window.history.replaceState({}, '', window.location.pathname);
          setShowSetPassword(false);
        }}
        onCancel={() => {
          window.history.replaceState({}, '', window.location.pathname);
          setShowSetPassword(false);
        }}
      />
    );
  }

  // Show forgot password page
  if (showForgotPassword) {
    return <ForgotPasswordPage onBack={() => setShowForgotPassword(false)} />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onForgotPassword={() => setShowForgotPassword(true)} />;
  }

  // Main authenticated app
  return (
    <SidebarProvider>
      <CommandPalette onToggleTheme={toggleTheme} onNavigate={handleNavigate} isDark={isDark} />
      <AppSidebar
          onNavigate={handleNavigate}
          currentView={currentView}
          viewAs={viewAs}
          onViewAsChange={setViewAs}
        />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4 lg:px-6">
          <SidebarTrigger className="-ml-2" />
          <span className="font-medium">{getViewTitle()}</span>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground hidden sm:block">
            {user?.name} ({user?.role})
          </span>
        </header>
        <main className="flex-1 overflow-auto">
          {currentView === 'chat' && <ChatContainer />}
          {currentView === 'history' && (
            <ChatHistory onSelectSession={handleSelectSession} />
          )}
          {currentView === 'documents' && <DocumentsView />}
          {currentView === 'analytics' && <AnalyticsView isEffectiveAdmin={isEffectiveAdmin} />}
          {currentView === 'settings' && (
            <SettingsView isDark={isDark} onToggleTheme={toggleTheme} isEffectiveAdmin={isEffectiveAdmin} />
          )}
          {currentView === 'family' && <FamilyMembersView />}
        </main>
      </SidebarInset>
      <Toaster richColors position="bottom-right" />
    </SidebarProvider>
  );
}

export default App;
