import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Home,
  Store,
  ShoppingCart,
  ShieldCheck,
  UserCheck,
  LogIn,
} from 'lucide-react';

interface MobileTabBarProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  onOpenAuth: (initialTab?: 'login' | 'register_company' | 'register_client') => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
}) => {
  const { user } = useAuth();

  return (
    <nav
      aria-label="Navigation mobile principale"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe"
    >
      <div className="grid grid-cols-4 items-center h-16 max-w-lg mx-auto px-1">
        {/* Tab 1: Accueil */}
        <button
          onClick={() => onNavigate('landing')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
            currentView === 'landing'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">Accueil</span>
        </button>

        {/* Tab 2: Boutiques / Marketplace */}
        <button
          onClick={() => onNavigate('marketplace')}
          className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
            currentView === 'marketplace' || currentView === 'store'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-5 h-5" />
          <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">Boutiques</span>
        </button>

        {/* Tab 3: Caisse POS ou Tarifs */}
        {user && user.role !== 'client' && user.role !== 'super_admin' ? (
          <button
            onClick={() => onNavigate('company')}
            className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
              currentView === 'company'
                ? 'text-emerald-700 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">Caisse / POS</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('pricing')}
            className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
              currentView === 'pricing'
                ? 'text-emerald-700 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="text-base font-bold font-mono leading-none">FCFA</span>
            <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">Tarifs</span>
          </button>
        )}

        {/* Tab 4: Espace utilisateur ou Connexion */}
        {user ? (
          user.role === 'super_admin' ? (
            <button
              onClick={() => onNavigate('super_admin')}
              className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
                currentView === 'super_admin'
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">Admin</span>
            </button>
          ) : user.role === 'client' ? (
            <button
              onClick={() => onNavigate('client')}
              className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
                currentView === 'client'
                  ? 'text-emerald-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">Commandes</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('company')}
              className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
                currentView === 'company'
                  ? 'text-emerald-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Store className="w-5 h-5" />
              <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">Mon Espace</span>
            </button>
          )
        ) : (
          <button
            onClick={() => onOpenAuth('login')}
            className="min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">Connexion</span>
          </button>
        )}
      </div>
    </nav>
  );
};
