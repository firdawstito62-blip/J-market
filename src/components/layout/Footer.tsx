import React from 'react';

interface FooterProps {
  onNavigate: (view: string) => void;
  onOpenAuth: (tab: 'login' | 'register_company' | 'register_client') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAuth }) => {
  return (
    <footer className="bg-white border-t border-slate-200 text-xs text-slate-500 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-emerald-700 flex items-center justify-center text-white font-bold text-xs">
                J
              </div>
              <span className="font-bold text-slate-900 text-sm">J-Market</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Plateforme SaaS de gestion commerciale, encaissement POS, stocks et boutiques en ligne pour l’Afrique de l’Ouest et Centrale.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Plateforme</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('marketplace')} className="hover:text-slate-900">
                  Boutiques & Commerces
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('features')} className="hover:text-slate-900">
                  Caisse POS & Stocks
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="hover:text-slate-900">
                  Tarifs & Formules
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Espaces Dédiés</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onOpenAuth('register_company')} className="hover:text-slate-900">
                  Inscription Entreprise
                </button>
              </li>
              <li>
                <button onClick={() => onOpenAuth('register_client')} className="hover:text-slate-900">
                  Espace Client Final
                </button>
              </li>
              <li>
                <button onClick={() => onOpenAuth('login')} className="hover:text-slate-900">
                  Connexion Administration
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Conformité & Devises</h4>
            <p className="text-slate-500 leading-relaxed mb-2">
              Devise officielle : Franc CFA (XOF / XAF). Données cryptées et hébergées conformément aux normes de sécurité.
            </p>
            <span className="font-mono text-[11px] text-slate-400">
              Support : contact@jmarket.africa
            </span>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} J-Market SaaS. Tous droits réservés.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Conditions d’Utilisation</span>
            <span>·</span>
            <span>Politique de Confidentialité</span>
            <span>·</span>
            <span>Sécurité & Audit</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
