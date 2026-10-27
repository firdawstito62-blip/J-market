import React from 'react';
import { formatFCFA } from '../../lib/currency.ts';
import {
  Store,
  ShoppingCart,
  Boxes,
  Users,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (tab: 'login' | 'register_company' | 'register_client') => void;
  onExploreMarketplace: () => void;
  onOpenStore: (slug: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onExploreMarketplace,
  onOpenStore,
}) => {
  const plans = [
    {
      name: 'Starter Commerçant',
      target: 'Pour petites boutiques et alimentations de quartier',
      price: 15000,
      features: [
        'Jusqu’à 100 produits catalogués',
        'Caisse tactile POS avec tickets',
        '1 Boutique en ligne avec URL propre',
        'Gestion des stocks en temps réel',
        '2 comptes employés & caissiers',
      ],
      popular: false,
    },
    {
      name: 'Business Pro',
      target: 'Pour supérettes, restaurants et boutiques multi-caisses',
      price: 35000,
      features: [
        'Jusqu’à 1 000 produits & alertes de seuil',
        'Jusqu’à 3 points de vente interconnectés',
        'Boutique en ligne avec zones et frais de livraison',
        'Gestion des fournisseurs et bons d’achat',
        '10 comptes staff (caissier, stock, gérant)',
        'Rapports de marge brute et export comptable',
      ],
      popular: true,
    },
    {
      name: 'Entreprise & Réseau',
      target: 'Pour chaînes, supermarchés et franchises',
      price: 75000,
      features: [
        'Produits & stocks illimités',
        'Jusqu’à 15 points de vente et caisses',
        'Accès API et intégration ERP dédiée',
        'Commissions réduites à 0.8%',
        '50 comptes employés avec matrice de permissions',
        'Support technique dédié et SLA prioritaire',
      ],
      popular: false,
    },
  ];

  return (
    <div className="bg-slate-50 text-slate-800">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-3">
                <span>Plateforme SaaS Tout-en-Un</span>
                <span>·</span>
                <span>Afrique de l’Ouest & Centrale (Devise XOF)</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Gérez votre commerce et vendez en ligne avec J-Market.
              </h1>

              <p className="text-base text-slate-600 mt-5 leading-relaxed">
                Alimentations, boutiques, supérettes, restaurants et fast-foods : encaissez vos ventes au comptoir, pilotez vos stocks, contrôlez votre caisse et activez votre propre boutique en ligne avec livraison à domicile.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenAuth('register_company')}
                  className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <span>Créer mon compte professionnel</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onExploreMarketplace}
                  className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-xl transition-colors border border-slate-200"
                >
                  Découvrir les boutiques
                </button>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-3.5 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
                >
                  Se connecter
                </button>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs text-slate-600">
                <div>
                  <span className="font-bold font-mono text-slate-900 text-base block">100% Dédié</span>
                  <span>Isolation des données par entreprise</span>
                </div>
                <div>
                  <span className="font-bold font-mono text-slate-900 text-base block">Franc CFA</span>
                  <span>Devise par défaut XOF</span>
                </div>
                <div>
                  <span className="font-bold font-mono text-slate-900 text-base block">Mobile Money</span>
                  <span>Wave & Orange Money</span>
                </div>
              </div>
            </div>

            {/* Hero Image Asset */}
            <div className="relative">
              <div className="aspect-16/9 rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80">
                <img
                  src="/src/assets/images/hero_jmarket_retail_1793091813856.jpg"
                  alt="Commerce et Caisse J-Market"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE STOREFRONT SPOTLIGHT */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Boutiques en activité
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Des commerces réels qui vendent déjà sur J-Market
            </h2>
          </div>
          <button
            onClick={onExploreMarketplace}
            className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>Voir l’annuaire complet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Epicerie Dakar */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="aspect-16/9 overflow-hidden">
                <img
                  src="/src/assets/images/store_cover_alimentation_1793091814524.jpg"
                  alt="L'Épicerie Dakar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase">
                  Alimentation & Épicerie Fine
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-0.5">
                  L'Épicerie Fine Dakar
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                  Fruits frais des Niayes, jus de bissap bio, riz parfumé de la vallée et produits du terroir sénégalais.
                </p>
                <span className="text-[11px] text-slate-500 mt-3 block">
                  Dakar, Sénégal · Livraison Almadies, Ouakam, Plateau
                </span>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={() => onOpenStore('epicerie-fine-dakar')}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Visiter la boutique en ligne
              </button>
            </div>
          </div>

          {/* Card 2: Afro-Grille Express */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="aspect-16/9 overflow-hidden">
                <img
                  src="/src/assets/images/store_cover_restaurant_1793091815739.jpg"
                  alt="Afro-Grille Express"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <span className="text-[11px] font-semibold text-amber-600 uppercase">
                  Restaurant & Fast-Food
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-0.5">
                  Afro-Grille Express
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                  Plateau dibi d’agneau braisé, poulet fermier aux épices de Grand-Bassam et alloco doré minute.
                </p>
                <span className="text-[11px] text-slate-500 mt-3 block">
                  Abidjan, Côte d’Ivoire · Livraison Cocody, Marcory, Plateau
                </span>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={() => onOpenStore('afro-grille-express')}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Visiter le restaurant en ligne
              </button>
            </div>
          </div>

          {/* Card 3: Maison Aurora */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="aspect-16/9 overflow-hidden">
                <img
                  src="/src/assets/images/store_cover_fashion_1793091814643.jpg"
                  alt="Maison Aurora"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <span className="text-[11px] font-semibold text-indigo-700 uppercase">
                  Boutique Mode & Lifestyle
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-0.5">
                  Maison Aurora Concept
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                  Prêt-à-porter en lin noble, sacs cabas en cuir pleine fleur façonnés à la main et maroquinerie d’art.
                </p>
                <span className="text-[11px] text-slate-500 mt-3 block">
                  Abidjan, Côte d’Ivoire · Livraison Zone 4, Deux Plateaux
                </span>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={() => onOpenStore('maison-aurora-abidjan')}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Visiter la boutique en ligne
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES SECTION */}
      <section id="features" className="py-16 bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Fonctionnalités Clés
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Tout ce dont votre commerce a besoin pour prospérer
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Une suite complète développée pour répondre aux réalités du commerce en Afrique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Caisse Tactile & Point de Vente
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Interface rapide adaptée aux tablettes et ordinateurs. Recherche par code-barre ou SKU, gestion des fonds de caisse, arrêté de caisse quotidien avec calcul des écarts.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Gestion des Stocks & Alertes
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Décompte automatique des stocks à chaque encaissement. Suivi des entrées, sorties et réajustements avec alertes visuelles avant rupture de stock.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Boutique en Ligne Personnalisée
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Chaque entreprise dispose d’une adresse web dédiée avec son logo, sa bannière, ses zones de livraison et frais paramétrables en Franc CFA.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Équipe & Permissions Rôles
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Création de comptes dédiés pour caissiers, gérants de points de vente et gestionnaires de stock avec des privilèges strictement cloisonnés côté serveur.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Paiements Locaux & Mobile Money
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Encaissez en espèces à la livraison ou intégrez vos comptes marchands Wave et Orange Money avec traçabilité et validation claire.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Sécurité & Confidentialité
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Cloisonnement multi-tenant garanti au niveau serveur et base de données. Mots de passe chiffrés et journaux d’audit inaltérables pour toutes les opérations critiques.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING & SUBSCRIPTIONS SECTION */}
      <section id="pricing" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Offres & Tarifs
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Des formules transparentes sans frais cachés
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Tarifs mensuels en Franc CFA (XOF) avec période d’essai gratuit sans engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                p.popular
                  ? 'bg-white border-emerald-600 shadow-lg ring-1 ring-emerald-600 relative'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs">
                  Recommandé pour les commerces actifs
                </span>
              )}

              <div>
                <h3 className="font-bold text-lg text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{p.target}</p>

                <div className="my-6">
                  <span className="font-mono text-3xl font-extrabold text-slate-900 tabular-nums">
                    {formatFCFA(p.price)}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">/ mois</span>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  {p.features.map((feat, fidx) => (
                    <div key={fidx} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={() => onOpenAuth('register_company')}
                  className={`w-full py-3 text-xs font-semibold rounded-xl transition-all shadow-xs ${
                    p.popular
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  Choisir la formule {p.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Prêt à propulser la gestion de votre commerce ?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-3 max-w-xl mx-auto">
            Créez votre compte en 2 minutes et accédez immédiatement à votre tableau de bord professionnel, votre caisse et votre vitrine en ligne.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth('register_company')}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Créer mon compte professionnel gratuitement
            </button>
            <button
              onClick={() => onOpenAuth('register_client')}
              className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-colors border border-slate-700"
            >
              Je suis un client
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
