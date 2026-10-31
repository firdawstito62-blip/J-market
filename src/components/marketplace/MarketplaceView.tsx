import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api.ts';
import { formatFCFA } from '../../lib/currency.ts';
import { Store, Search, MapPin, Package, ArrowRight } from 'lucide-react';

interface MarketplaceViewProps {
  onOpenStore: (slug: string) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({ onOpenStore }) => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const data = await apiFetch('/api/public/stores');
        setStores(data.stores || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const filtered = stores.filter((s) => {
    if (activityFilter !== 'all' && s.activityType !== activityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.config?.tagline && s.config.tagline.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
          Marketplace J-Market
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Boutiques, Alimentations & Restaurants en Ligne
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Commandez directement auprès des commerces locaux certifiés et faites-vous livrer rapidement.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 mb-8">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'alimentation', 'restaurant', 'boutique', 'superette'].map((type) => (
            <button
              key={type}
              onClick={() => setActivityFilter(type)}
              className={`min-h-[40px] px-3.5 py-2 text-xs rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center ${
                activityFilter === type
                  ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300'
              }`}
            >
              {type === 'all'
                ? 'Tous les commerces'
                : type === 'alimentation'
                ? 'Alimentations'
                : type === 'restaurant'
                ? 'Restaurants'
                : type === 'boutique'
                ? 'Boutiques Mode'
                : 'Supérettes'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Rechercher par nom, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
          />
        </div>
      </div>

      {/* Stores Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          Chargement des commerces...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
          Aucune boutique ne correspond à vos critères de recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                <div className="aspect-16/9 bg-slate-100 relative overflow-hidden">
                  {s.config?.bannerUrl ? (
                    <img
                      src={s.config.bannerUrl}
                      alt={s.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Store className="w-8 h-8" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs capitalize">
                    {s.activityType}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{s.city}, {s.country}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {s.name}
                  </h3>

                  {s.config?.tagline && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {s.config.tagline}
                    </p>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      <span>{s.productCount} articles</span>
                    </span>
                    {s.config?.deliveryZones?.length > 0 && (
                      <span className="font-mono text-emerald-800 font-medium">
                        Livraison dès {formatFCFA(s.config.deliveryZones[0].feeXof)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => onOpenStore(s.slug)}
                  className="w-full min-h-[44px] py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <span>Consulter le catalogue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
