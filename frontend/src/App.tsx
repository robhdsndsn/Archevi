import { useState, useEffect, useRef } from 'react';
import { AskAIView } from '@/components/chat/AskAIView';
import { CommandPalette, SearchButton, type CommandPaletteRef } from '@/components/CommandPalette';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { DocumentsView } from '@/components/documents';
import { AnalyticsView } from '@/components/analytics';
import { SettingsView } from '@/components/settings';
import { FamilyMembersView, BiographyGenerator } from '@/components/family';
import { AdminView } from '@/components/admin';
import { Timeline } from '@/components/timeline';
import { LoginPage, SetPasswordPage, ForgotPasswordPage, AuthCallback } from '@/components/auth';
import { SharePage } from '@/components/share/SharePage';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { PWAInstallPrompt, PWAReloadPrompt } from '@/components/pwa';
import { OnboardingTour } from '@/components/onboarding';
import { NotificationBanner } from '@/components/NotificationBanner';
import { useAuthStore } from '@/store/auth-store';
import { useIsMobile } from '@/hooks/use-mobile';
import { windmill } from '@/api/windmill';
import { applyBranding } from '@/lib/theme-config';
import { Loader2 } from 'lucide-react';

// Check if current URL is a public share link
function getShareToken(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/share\/([a-zA-Z0-9]+)$/);
  return match ? match[1] : null;
}

// Check if current URL is the auth callback route (from marketing site signup)
function isAuthCallback(): boolean {
  return window.location.pathname === '/auth/callback' && window.location.hash.includes('access_token');
}

// Map URL hash to view name
function getViewFromHash(): { view: string; tab?: string } {
  const hash = window.location.hash.slice(1); // Remove #
  if (!hash) return { view: 'chat' };
  
  // Handle documents tabs
  if (hash === 'documents' || hash === 'documents-overview') return { view: 'documents', tab: 'overview' };
  if (hash === 'documents-browse') return { view: 'documents', tab: 'browse' };
  if (hash === 'documents-search') return { view: 'documents', tab: 'search' };
  if (hash === 'documents-add' || hash === 'add-document') return { view: 'documents', tab: 'add' };
  
  // Direct view mappings
  const viewMap: Record<string, string> = {
    'chat': 'chat',
    'ask': 'chat',
    'ai': 'chat',
    'timeline': 'timeline',
    'biography': 'biography',
    'biographies': 'biography',
    'analytics': 'analytics',
    'family': 'family',
    'members': 'family',
    'settings': 'settings',
    'admin': 'admin',
    'history': 'chat', // history now integrated into chat
  };
  
  return { view: viewMap[hash] || 'chat' };
}

// Update URL hash based on view
function updateHash(view: string, tab?: string) {
  let hash = view;
  if (view === 'documents' && tab && tab !== 'overview') {
    hash = 'documents-' + tab;
  }
  if (window.location.hash !== '#' + hash) {
    window.history.pushState(null, '', '#' + hash);
  }
}

export type ViewAsRole = 'admin' | 'user';

export type DocumentsTab = 'overview' | 'browse' | 'search' | 'add';

function App() {
  const [isDark, setIsDark] = useState(false);
  const initialView = getViewFromHash();
  const [currentView, setCurrentView] = useState(initialView.view);
  const [documentsTab, setDocumentsTab] = useState<DocumentsTab>((initialView.tab as DocumentsTab) || 'overview');
  const [pendingDocumentId, setPendingDocumentId] = useState<number | null>(null);
  const [viewAs, setViewAs] = useState<ViewAsRole>('admin');
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showAuthCallback, setShowAuthCallback] = useState(isAuthCallback);
  const [expiringCount, setExpiringCount] = useState(0);
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const commandPaletteRef = useRef<CommandPaletteRef>(null);
  const isMobile = useIsMobile();

  // Sync URL hash with current view
  useEffect(() => {
    updateHash(currentView, currentView === 'documents' ? documentsTab : undefined);
  }, [currentView, documentsTab]);

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const { view, tab } = getViewFromHash();
      setCurrentView(view);
      if (tab) setDocumentsTab(tab as DocumentsTab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check for invite token in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      setShowSetPassword(true);
    }
  }, []);

  // Fetch expiring documents count
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchExpiringDocs = async () => {
      try {
        const result = await windmill.getExpiringDocuments(30);
        if (result.success) {
          const urgentCount = result.documents.filter((d: any) => d.days_until_expiry <= 14).length;
          setExpiringCount(urgentCount);
        }
      } catch (error) {
        console.error('Failed to fetch expiring documents:', error);
      }
    };
    fetchExpiringDocs();
  }, [isAuthenticated]);

  // Load and apply tenant branding when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.tenant_id) return;

    const loadBranding = async () => {
      try {
        const branding = await windmill.getTenantBranding({ tenant_id: user.tenant_id });
        // Check for error response (Windmill returns { error: "..." } on failure)
        if (branding && !('error' in branding)) {
          applyBranding(branding);
        }
      } catch (error) {
        console.error('Failed to load tenant branding:', error);
        // Continue with default branding - don't block the app
      }
    };

    loadBranding();
  }, [isAuthenticated, user?.tenant_id]);

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
    if (view === 'chat' || view === 'analytics' || view === 'settings' || view === 'family' || view === 'admin' || view === 'timeline' || view === 'biography') {
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
      case 'timeline':
        return 'Family Timeline';
      case 'biography':
        return 'Biography Generator';
      default:
        return currentView.charAt(0).toUpperCase() + currentView.slice(1);
    }
  };

  // Handle auth callback from marketing site signup
  if (showAuthCallback) {
    return (
      <AuthCallback
        onComplete={() => {
          setShowAuthCallback(false);
          // App will re-render and show authenticated state
        }}
      />
    );
  }

  // Check for public share link - render without auth
  const shareToken = getShareToken();
  if (shareToken) {
    return (
      <>
        <SharePage token={shareToken} />
        <Toaster richColors position="bottom-right" />
      </>
    );
  }

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
      {/* Only show sidebar on desktop */}
      {!isMobile && (
        <AppSidebar
          onNavigate={handleNavigate}
          currentView={currentView}
          viewAs={viewAs}
          onViewAsChange={setViewAs}
        />
      )}
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4 lg:px-6">
          {/* Only show sidebar trigger on desktop */}
          {!isMobile && <SidebarTrigger className="-ml-2" />}
          <span className="font-medium">{getViewTitle()}</span>
          <div className="flex-1" />
          <SearchButton onClick={() => commandPaletteRef.current?.open()} />
          <span className="text-xs text-muted-foreground hidden sm:block ml-2">
            {user?.name} ({user?.role})
          </span>
        </header>
        {/* Add bottom padding on mobile to account for bottom nav */}
        <main className={`flex-1 overflow-auto ${isMobile ? 'pb-16' : ''}`}>
          {currentView === 'chat' && <AskAIView />}
          {currentView === 'documents' && (
            <DocumentsView
              activeTab={documentsTab}
              onTabChange={setDocumentsTab}
              openDocumentId={pendingDocumentId}
              onDocumentOpened={() => setPendingDocumentId(null)}
            />
          )}
          {currentView === 'analytics' && <AnalyticsView isEffectiveAdmin={isEffectiveAdmin} />}
          {currentView === 'settings' && (
            <SettingsView isDark={isDark} onToggleTheme={toggleTheme} isEffectiveAdmin={isEffectiveAdmin} />
          )}
          {currentView === 'family' && <FamilyMembersView />}
          {currentView === 'admin' && <AdminView isEffectiveAdmin={isEffectiveAdmin} />}
          {currentView === 'timeline' && (
            <Timeline
              onDocumentClick={(documentId) => {
                setPendingDocumentId(documentId);
                setCurrentView('documents');
                setDocumentsTab('browse');
              }}
            />
          )}
          {currentView === 'biography' && <BiographyGenerator />}
        </main>
      </SidebarInset>
      {/* Mobile bottom navigation */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        isSystemAdmin={isEffectiveAdmin}
        expiringCount={expiringCount}
      />
      <Toaster richColors position="bottom-right" />
      <PWAInstallPrompt />
      <PWAReloadPrompt />
      <OnboardingTour />
      <NotificationBanner position="top" />
    </SidebarProvider>
  );
}

export default App;
