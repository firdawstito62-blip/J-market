import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Store, ShieldCheck, UserCheck, LogOut, ShoppingBag, Store as StoreIcon } from 'lucide-react';

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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-base shadow-sm">
              J
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              J-Market
            </span>
          </button>

          {/* Zone 2: 4-5 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('landing')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'landing' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Accueil
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'marketplace' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Boutiques en ligne
            </button>
            <button
              onClick={() => onNavigate('features')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'features' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Fonctionnalités SaaS
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'pricing' ? 'text-emerald-700 font-semibold' : ''
              }`}
            >
              Abonnements & Tarifs
            </button>
          </nav>

          {/* Zone 3: 1 primary action or active user state */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Space switcher button */}
                {user.role === 'super_admin' && (
                  <button
                    onClick={() => onNavigate('super_admin')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      currentView === 'super_admin'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Administration Générale</span>
                  </button>
                )}

                {user.role !== 'super_admin' && user.role !== 'client' && (
                  <button
                    onClick={() => onNavigate('company')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      currentView === 'company'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Espace Entreprise ({company?.name || 'Ma Boutique'})</span>
                  </button>
                )}

                {user.role === 'client' && (
                  <button
                    onClick={() => onNavigate('client')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      currentView === 'client'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Espace Client</span>
                  </button>
                )}

                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
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
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => onOpenAuth('register_company')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 shadow-sm"
                >
                  Créer mon compte professionnel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
