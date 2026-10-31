import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Order, Product } from '../../types/index.ts';
import { apiFetch } from '../../lib/api.ts';
import { formatFCFA, formatDateFr } from '../../lib/currency.ts';
import {
  ShoppingBag,
  Store,
  MapPin,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  RefreshCw,
  Phone,
  Search,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ClientPortalProps {
  onOpenStore: (slug: string) => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({ onOpenStore }) => {
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'stores' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile edit state
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAddress, setProfileAddress] = useState(user?.deliveryAddress || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ords, strs] = await Promise.all([
        apiFetch('/api/client/orders'),
        apiFetch('/api/public/stores'),
      ]);
      setOrders(ords.orders || []);
      setStores(strs.stores || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/client/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: profileName,
          phone: profilePhone,
          deliveryAddress: profileAddress,
        }),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      await refreshUser();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Espace Client Sécurisé
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                Bonjour, {user?.fullName}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Suivez vos commandes en cours, vos adresses et retrouvez vos commerces favoris.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchClientData}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs text-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualiser</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="border-t border-slate-100 bg-slate-50/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto py-2 text-xs font-medium no-scrollbar">
              <button
                onClick={() => setActiveTab('orders')}
                className={`min-h-[40px] px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'orders'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 active:bg-slate-200/50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Mes Commandes ({orders.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('stores')}
                className={`min-h-[40px] px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'stores'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 active:bg-slate-200/50'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Boutiques & Commerces</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`min-h-[40px] px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'profile'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 active:bg-slate-200/50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Mon Profil & Adresses</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* 1. ORDERS LIST & TRACKING */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-slate-800">Aucune commande pour le moment</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Découvrez les boutiques et restaurants disponibles sur J-Market et passez votre première commande.
                </p>
                <button
                  onClick={() => setActiveTab('stores')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
                >
                  Explorer les boutiques
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 text-xs space-y-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">Commande #{ord.orderNumber}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-semibold text-emerald-800">{ord.companyName}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Passée le {formatDateFr(ord.createdAt)} · {ord.items.length} article(s)
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-base font-bold text-slate-900 block">
                          {formatFCFA(ord.totalXof)}
                        </span>
                        <span className="text-[11px] text-slate-500 uppercase font-mono">
                          {ord.paymentMethod} ({ord.paymentStatus === 'paid' ? 'Payé' : 'À régler'})
                        </span>
                      </div>
                    </div>

                    {/* Progress tracking indicator */}
                    <div className="py-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-2">
                        <span className={ord.orderStatus === 'received' ? 'text-emerald-700' : ''}>1. Reçue</span>
                        <span className={ord.orderStatus === 'preparing' ? 'text-emerald-700' : ''}>2. En préparation</span>
                        <span className={ord.orderStatus === 'ready' || ord.orderStatus === 'delivering' ? 'text-emerald-700' : ''}>
                          3. Prête / Expédiée
                        </span>
                        <span className={ord.orderStatus === 'completed' ? 'text-emerald-700 font-bold' : ''}>
                          4. Livrée
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full transition-all duration-500"
                          style={{
                            width:
                              ord.orderStatus === 'received'
                                ? '25%'
                                : ord.orderStatus === 'preparing'
                                ? '50%'
                                : ord.orderStatus === 'ready' || ord.orderStatus === 'delivering'
                                ? '75%'
                                : ord.orderStatus === 'completed'
                                ? '100%'
                                : '0%',
                          }}
                        />
                      </div>
                    </div>

                    {/* Order items snapshot */}
                    <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                      {ord.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span>
                            {i.quantity}x {i.productName}
                          </span>
                          <span className="font-mono font-medium text-slate-700">
                            {formatFCFA(i.totalXof)}
                          </span>
                        </div>
                      ))}
                      {ord.deliveryFeeXof > 0 && (
                        <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                          <span>Frais de livraison</span>
                          <span className="font-mono">{formatFCFA(ord.deliveryFeeXof)}</span>
                        </div>
                      )}
                    </div>

                    {ord.deliveryAddress && (
                      <div className="text-[11px] text-slate-600">
                        <strong>Adresse de livraison :</strong> {ord.deliveryAddress}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-800 capitalize">
                        Statut : {ord.orderStatus}
                      </span>
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Voir le reçu complet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. STORES EXPLORER */}
        {activeTab === 'stores' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Commerces Partenaires J-Market ({stores.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Commandez directement en ligne avec livraison ou retrait en magasin.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {stores.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all"
                >
                  <div>
                    <div className="aspect-16/9 bg-slate-100 relative overflow-hidden">
                      {s.config?.bannerUrl ? (
                        <img
                          src={s.config.bannerUrl}
                          alt={s.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Store className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span className="capitalize font-semibold text-emerald-700">{s.activityType}</span>
                        <span>{s.city}, {s.country}</span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900">{s.name}</h4>
                      {s.config?.tagline && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {s.config.tagline}
                        </p>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                        {s.config?.openingHours && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{s.config.openingHours}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" />
                          <span>{s.productCount} produits disponibles</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => onOpenStore(s.slug)}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>Visiter la boutique</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. PROFILE & SAVED ADDRESSES */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="max-w-xl bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Coordonnées Personnelles & Adresse de Livraison
            </h3>

            {profileSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Vos informations ont été mises à jour avec succès.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom complet
              </label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse e-mail (identifiant de connexion)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Numéro de téléphone portable
              </label>
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse de livraison enregistrée
              </label>
              <textarea
                rows={3}
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                placeholder="Ex: Cité Keur Gorgui, Immeuble A, Appartement 302, Dakar"
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg"
            >
              Sauvegarder mon profil
            </button>
          </form>
        )}
      </div>

      {/* ORDER DETAILS RECEIPT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-mono text-emerald-700 uppercase font-bold">
                  Reçu de commande
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-0.5">
                  #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Commerçant :</span>
                <span className="font-semibold text-slate-900">{selectedOrder.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date :</span>
                <span className="font-mono">{formatDateFr(selectedOrder.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paiement :</span>
                <span className="font-mono uppercase">{selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 border-t border-b border-slate-200 py-2 text-xs">
              {selectedOrder.items.map((i, idx) => (
                <div key={idx} className="py-1.5 flex justify-between">
                  <span>{i.quantity}x {i.productName}</span>
                  <span className="font-mono font-bold text-slate-900">{formatFCFA(i.totalXof)}</span>
                </div>
              ))}
              {selectedOrder.deliveryFeeXof > 0 && (
                <div className="py-1.5 flex justify-between text-slate-500">
                  <span>Livraison</span>
                  <span className="font-mono">{formatFCFA(selectedOrder.deliveryFeeXof)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-base font-bold text-slate-900">
              <span>Total Réglé / Dû :</span>
              <span className="font-mono text-emerald-800">{formatFCFA(selectedOrder.totalXof)}</span>
            </div>

            {selectedOrder.deliveryAddress && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                <strong>Adresse :</strong> {selectedOrder.deliveryAddress}
              </p>
            )}

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg"
            >
              Fermer le reçu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
