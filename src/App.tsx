import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { LandingPage } from './components/landing/LandingPage.tsx';
import { MarketplaceView } from './components/marketplace/MarketplaceView.tsx';
import { PublicStorefront } from './components/storefront/PublicStorefront.tsx';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard.tsx';
import { CompanyDashboard } from './components/company/CompanyDashboard.tsx';
import { ClientPortal } from './components/client/ClientPortal.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { Shield, Store, UserCheck, Sparkles } from 'lucide-react';

function AppContent() {
  const { user, company, quickLoginAs } = useAuth();

  // Navigation view
  const [currentView, setCurrentView] = useState<
    'landing' | 'marketplace' | 'features' | 'pricing' | 'store' | 'super_admin' | 'company' | 'client'
  >('landing');

  // If viewing a public store
  const [activeStoreSlug, setActiveStoreSlug] = useState<string>('epicerie-fine-dakar');

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register_company' | 'register_client'>('login');

  // Auto route on login if on landing
  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin' && currentView === 'landing') {
        setCurrentView('super_admin');
      } else if (user.role === 'client' && currentView === 'landing') {
        setCurrentView('client');
      } else if (user.role !== 'super_admin' && user.role !== 'client' && currentView === 'landing') {
        setCurrentView('company');
      }
    }
  }, [user]);

  const handleOpenAuth = (tab: 'login' | 'register_company' | 'register_client' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const handleNavigate = (view: string, params?: any) => {
    if (view === 'store' && params?.slug) {
      setActiveStoreSlug(params.slug);
      setCurrentView('store');
    } else {
      setCurrentView(view as any);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenStore = (slug: string) => {
    setActiveStoreSlug(slug);
    setCurrentView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Quick Demo Switcher Bar for fast evaluation */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1.5 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white">J-Market SaaS :</span>
            <span className="hidden sm:inline text-slate-400">Changer de rôle pour tester les 3 espaces :</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={async () => {
                await quickLoginAs('super_admin');
                setCurrentView('super_admin');
              }}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
            >
              1. Super Admin
            </button>
            <button
              onClick={async () => {
                await quickLoginAs('epicerie');
                setCurrentView('company');
              }}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
            >
              2. Épicerie Dakar (Alimentation)
            </button>
            <button
              onClick={async () => {
                await quickLoginAs('grille');
                setCurrentView('company');
              }}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
            >
              3. Afro-Grille (Restaurant)
            </button>
            <button
              onClick={async () => {
                await quickLoginAs('client');
                setCurrentView('client');
              }}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
            >
              4. Client Final
            </button>
          </div>
        </div>
      </div>

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onExploreMarketplace={() => setCurrentView('marketplace')}
            onOpenStore={handleOpenStore}
          />
        )}

        {currentView === 'marketplace' && (
          <MarketplaceView onOpenStore={handleOpenStore} />
        )}

        {currentView === 'features' && (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onExploreMarketplace={() => setCurrentView('marketplace')}
            onOpenStore={handleOpenStore}
          />
        )}

        {currentView === 'pricing' && (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onExploreMarketplace={() => setCurrentView('marketplace')}
            onOpenStore={handleOpenStore}
          />
        )}

        {currentView === 'store' && (
          <PublicStorefront
            slug={activeStoreSlug}
            onBackToMarketplace={() => setCurrentView('marketplace')}
            onOrderSuccess={(order) => {
              if (user?.role === 'client') {
                setCurrentView('client');
              }
            }}
          />
        )}

        {currentView === 'super_admin' && <SuperAdminDashboard />}

        {currentView === 'company' && (
          <CompanyDashboard onOpenStorefront={handleOpenStore} />
        )}

        {currentView === 'client' && (
          <ClientPortal onOpenStore={handleOpenStore} />
        )}
      </main>

      {/* Footer */}
      {currentView !== 'super_admin' && (
        <Footer onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
        onSuccess={() => {
          // View will be switched via user effect or remained
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
