import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Store, ShieldCheck, UserCheck, LogOut, Menu, X, ArrowRight } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  onOpenAuth: (initialTab?: 'login' | 'register_company' | 'register_client') => void;
  cartCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  cartCount = 0,
}) => {
  const { user, company, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single text wordmark */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-base shadow-sm">
              J
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              J-Market
            </span>
          </button>

          {/* Zone 2: Desktop 4-5 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('landing')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 min-h-[44px] flex items-center ${
                currentView === 'landing' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Accueil
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 min-h-[44px] flex items-center ${
                currentView === 'marketplace' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Boutiques en ligne
            </button>
            <button
              onClick={() => onNavigate('features')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 min-h-[44px] flex items-center ${
                currentView === 'features' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Fonctionnalités SaaS
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 min-h-[44px] flex items-center ${
                currentView === 'pricing' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Abonnements & Tarifs
            </button>
          </nav>

          {/* Zone 3: Actions desktop & Mobile triggers */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Space switcher button */}
                {user.role === 'super_admin' && (
                  <button
                    onClick={() => onNavigate('super_admin')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                      currentView === 'super_admin'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Administration Générale</span>
                    <span className="sm:hidden">Admin</span>
                  </button>
                )}

                {user.role !== 'super_admin' && user.role !== 'client' && (
                  <button
                    onClick={() => onNavigate('company')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                      currentView === 'company'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Espace Entreprise ({company?.name || 'Ma Boutique'})</span>
                    <span className="sm:hidden">Espace Pro</span>
                  </button>
                )}

                {user.role === 'client' && (
                  <button
                    onClick={() => onNavigate('client')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                      currentView === 'client'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Espace Client</span>
                    <span className="sm:hidden">Commandes</span>
                  </button>
                )}

                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                    {user.fullName}
                  </span>
                  <span className="text-[11px] text-slate-500 capitalize">
                    {user.role === 'super_admin'
                      ? 'Super Admin'
                      : user.role === 'client'
                      ? 'Client'
                      : user.role.replace('_', ' ')}
                  </span>
                </div>

                <button
                  onClick={() => logout()}
                  title="Se déconnecter"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  aria-label="Se déconnecter"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="min-h-[44px] px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => onOpenAuth('register_company')}
                  className="hidden sm:flex min-h-[44px] items-center px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 shadow-sm"
                >
                  Créer mon compte professionnel
                </button>
              </div>
            )}

            {/* Mobile menu hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-700 hover:text-slate-900 p-2 rounded-lg"
              aria-label="Ouvrir le menu de navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1 text-sm font-medium text-slate-700">
            <button
              onClick={() => handleMobileNav('landing')}
              className={`min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                currentView === 'landing' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'hover:bg-slate-50'
              }`}
            >
              <span>Accueil</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => handleMobileNav('marketplace')}
              className={`min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                currentView === 'marketplace' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'hover:bg-slate-50'
              }`}
            >
              <span>Boutiques & Commerces en ligne</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => handleMobileNav('features')}
              className={`min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                currentView === 'features' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'hover:bg-slate-50'
              }`}
            >
              <span>Fonctionnalités SaaS (Caisse & Stock)</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => handleMobileNav('pricing')}
              className={`min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                currentView === 'pricing' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'hover:bg-slate-50'
              }`}
            >
              <span>Abonnements & Tarifs (XOF)</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            {!user && (
              <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => {
                    onOpenAuth('register_company');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>Créer mon compte professionnel</span>
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register_client');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-slate-100 text-slate-800 font-medium text-xs rounded-xl hover:bg-slate-200 flex items-center justify-center"
                >
                  <span>Créer un compte client</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
