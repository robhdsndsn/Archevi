import { useState, useEffect, useRef } from 'react';
import { AskAIView } from '@/components/chat/AskAIView';
import { CommandPalette, SearchButton, type CommandPaletteRef } from '@/components/CommandPalette';
import { AppSidebar } from '@/components/AppSidebar';
import { DocumentsView } from '@/components/documents';
import { AnalyticsView } from '@/components/analytics';
import { SettingsView } from '@/components/settings';
import { FamilyMembersView } from '@/components/family';
import { AdminView } from '@/components/admin';
import { LoginPage, SetPasswordPage, ForgotPasswordPage } from '@/components/auth';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { PWAInstallPrompt, PWAReloadPrompt } from '@/components/pwa';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';

export type ViewAsRole = 'admin' | 'user';

export type DocumentsTab = 'overview' | 'browse' | 'search' | 'add';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [currentView, setCurrentView] = useState('chat');
  const [documentsTab, setDocumentsTab] = useState<DocumentsTab>('overview');
  const [viewAs, setViewAs] = useState<ViewAsRole>('admin');
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const commandPaletteRef = useRef<CommandPaletteRef>(null);

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

  const handleNavigate = (view: string, options?: { tab?: DocumentsTab }) => {
    // Handle documents with optional tab
    if (view === 'documents') {
      setCurrentView('documents');
      if (options?.tab) {
        setDocumentsTab(options.tab);
      }
      return;
    }

    // Map 'history' to 'chat' since history is now integrated into Ask AI view
    if (view === 'history') {
      setCurrentView('chat');
      return;
    }

    // Handle actual navigation for implemented views
    if (view === 'chat' || view === 'analytics' || view === 'settings' || view === 'family' || view === 'admin') {
      setCurrentView(view);
      return;
    }

    // For unimplemented views, show "coming soon"
    alert(`${view.charAt(0).toUpperCase() + view.slice(1).replace(/-/g, ' ')} view coming soon!`);
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'chat':
        return 'Ask AI';
      case 'documents':
        return 'Documents';
      case 'analytics':
        return 'Analytics';
      case 'settings':
        return 'Settings';
      case 'family':
        return 'Family Members';
      case 'admin':
        return 'System Admin';
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
      <CommandPalette ref={commandPaletteRef} onToggleTheme={toggleTheme} onNavigate={handleNavigate} isDark={isDark} />
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
          <SearchButton onClick={() => commandPaletteRef.current?.open()} />
          <span className="text-xs text-muted-foreground hidden sm:block ml-2">
            {user?.name} ({user?.role})
          </span>
        </header>
        <main className="flex-1 overflow-auto">
          {currentView === 'chat' && <AskAIView />}
          {currentView === 'documents' && <DocumentsView activeTab={documentsTab} onTabChange={setDocumentsTab} />}
          {currentView === 'analytics' && <AnalyticsView isEffectiveAdmin={isEffectiveAdmin} />}
          {currentView === 'settings' && (
            <SettingsView isDark={isDark} onToggleTheme={toggleTheme} isEffectiveAdmin={isEffectiveAdmin} />
          )}
          {currentView === 'family' && <FamilyMembersView />}
          {currentView === 'admin' && <AdminView isEffectiveAdmin={isEffectiveAdmin} />}
        </main>
      </SidebarInset>
      <Toaster richColors position="bottom-right" />
      <PWAInstallPrompt />
      <PWAReloadPrompt />
    </SidebarProvider>
  );
}

export default App;
