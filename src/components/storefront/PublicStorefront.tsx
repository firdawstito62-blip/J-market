import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Product, Category, DeliveryZone, Order } from '../../types/index.ts';
import { apiFetch } from '../../lib/api.ts';
import { formatFCFA } from '../../lib/currency.ts';
import {
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Truck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Store,
} from 'lucide-react';

interface PublicStorefrontProps {
  slug: string;
  onBackToMarketplace?: () => void;
  onOrderSuccess?: (order: Order) => void;
}

export const PublicStorefront: React.FC<PublicStorefrontProps> = ({
  slug,
  onBackToMarketplace,
  onOrderSuccess,
}) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Checkout state
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.deliveryAddress || '');
  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wave' | 'orange_money'>('cod');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch(`/api/public/stores/${slug}`);
        setStore(data.store);
        setProducts(data.products || []);
        setCategories(data.categories || []);
        if (data.store?.config?.deliveryZones?.length) {
          setSelectedZone(data.store.config.deliveryZones[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Impossible de charger la boutique');
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [slug]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          alert(`Quantité maximale en stock atteinte (${product.currentStock}).`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
    );
  };

  const subtotalXof = cart.reduce((sum, i) => sum + i.product.priceXof * i.quantity, 0);
  const deliveryFeeXof = deliveryMethod === 'delivery' ? selectedZone?.feeXof || 1500 : 0;
  const totalXof = subtotalXof + deliveryFeeXof;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length) return;
    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      alert('Veuillez renseigner votre adresse de livraison.');
      return;
    }
    if (!customerName || !customerPhone) {
      alert('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const res = await apiFetch('/api/client/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          companyId: store.id,
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          deliveryMethod,
          deliveryAddress,
          deliveryZoneName: deliveryMethod === 'delivery' ? selectedZone?.name : undefined,
          paymentMethod,
          customerName,
          customerPhone,
          customerEmail,
          notes: orderNotes,
        }),
      });

      setCompletedOrder(res.order);
      setCart([]);
      if (onOrderSuccess) onOrderSuccess(res.order);
    } catch (err: any) {
      alert(`Erreur lors de la commande : ${err.message}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Chargement de la boutique en ligne...
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Boutique Indisponible</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
        {onBackToMarketplace && (
          <button
            onClick={onBackToMarketplace}
            className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg"
          >
            Retour aux commerces J-Market
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Back button header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {onBackToMarketplace && (
            <button
              onClick={onBackToMarketplace}
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
            >
              <span>← Retour aux boutiques J-Market</span>
            </button>
          )}

          <button
            onClick={() => setCartOpen(true)}
            className="relative px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ml-auto shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Mon Panier ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            {cart.length > 0 && (
              <span className="font-mono text-emerald-200">
                · {formatFCFA(subtotalXof)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Store Hero Banner */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        {store.config?.bannerUrl && (
          <img
            src={store.config.bannerUrl}
            alt={store.name}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold mb-2">
              <span className="uppercase tracking-wider">{store.activityType}</span>
              <span>·</span>
              <span>Boutique Officielle Vérifiée</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              {store.name}
            </h1>
            {store.config?.tagline && (
              <p className="text-sm sm:text-base text-slate-200 mt-2">
                {store.config.tagline}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{store.address}, {store.city} ({store.country})</span>
              </div>
              {store.config?.openingHours && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{store.config.openingHours}</span>
                </div>
              )}
              {store.config?.contactWhatsapp && (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp : {store.config.contactWhatsapp}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tous les rayons ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === c.id
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Product Grid: 2-column on mobile, up to 4-column on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-6">
          {filteredProducts.map((p) => {
            const inCart = cart.find((i) => i.product.id === p.id);
            const isOutOfStock = p.currentStock <= 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-xs"
              >
                <div>
                  <div className="aspect-4/3 bg-slate-100 relative overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Store className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                    )}
                    {p.isFeatured && (
                      <span className="absolute top-2 left-2 bg-emerald-700 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Coup de cœur
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 sm:p-4">
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 sm:p-4 pt-0">
                  <div className="flex items-baseline justify-between mb-2 sm:mb-3">
                    <span className="font-mono text-sm sm:text-base font-bold text-slate-900">
                      {formatFCFA(p.priceXof)}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500">
                      /{p.unit}
                    </span>
                  </div>

                  <button
                    disabled={isOutOfStock}
                    onClick={() => addToCart(p)}
                    className={`w-full min-h-[40px] py-2 px-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                      isOutOfStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : inCart
                        ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                        : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs active:bg-emerald-900'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {isOutOfStock
                        ? 'Rupture'
                        : inCart
                        ? `Ajouté (${inCart.quantity})`
                        : 'Ajouter'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Quick-Cart Trigger for Mobile Thumb-zone */}
      {cart.length > 0 && !cartOpen && (
        <div className="fixed bottom-20 md:hidden left-4 right-4 z-40 animate-bounce-in">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full min-h-[48px] py-3 px-4 bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500/30"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-200" />
              <span>Voir le panier ({cart.reduce((s, i) => s + i.quantity, 0)} articles)</span>
            </div>
            <span className="font-mono text-sm bg-emerald-800/80 px-2 py-0.5 rounded-lg">
              {formatFCFA(subtotalXof)}
            </span>
          </button>
        </div>
      )}

      {/* SHOPPING CART & CHECKOUT DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-4 sm:p-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-base text-slate-900">
                    Mon Panier ({cart.reduce((s, i) => s + i.quantity, 0)})
                  </h3>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 active:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-slate-100 my-4 max-h-56 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400">
                    Votre panier est vide pour l’instant.
                  </p>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="pr-2">
                        <span className="font-semibold text-slate-900 block line-clamp-1">{item.product.name}</span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {formatFCFA(item.product.priceXof)} x {item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                          className="min-h-[36px] min-w-[36px] w-9 h-9 bg-slate-100 active:bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs w-5 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                          className="min-h-[36px] min-w-[36px] w-9 h-9 bg-slate-100 active:bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700"
                        >
                          +
                        </button>
                        <span className="font-mono font-bold text-slate-900 w-16 text-right">
                          {formatFCFA(item.product.priceXof * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Form */}
              {cart.length > 0 && (
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-3.5 pt-3 border-t border-slate-200">
                  <h4 className="font-bold text-xs text-slate-900 uppercase font-mono tracking-wider">
                    Informations de Livraison
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('delivery')}
                      className={`min-h-[44px] p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                        deliveryMethod === 'delivery'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 active:bg-slate-100'
                      }`}
                    >
                      Livraison à domicile
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`min-h-[44px] p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                        deliveryMethod === 'pickup'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 active:bg-slate-100'
                      }`}
                    >
                      Retrait en boutique
                    </button>
                  </div>

                  {deliveryMethod === 'delivery' && store.config?.deliveryZones?.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Sélectionnez votre zone de livraison
                      </label>
                      <select
                        value={selectedZone?.name}
                        onChange={(e) => {
                          const z = store.config.deliveryZones.find((dz: any) => dz.name === e.target.value);
                          if (z) setSelectedZone(z);
                        }}
                        className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                      >
                        {store.config.deliveryZones.map((z: DeliveryZone, idx: number) => (
                          <option key={idx} value={z.name}>
                            {z.name} (+{formatFCFA(z.feeXof)} - {z.estTime})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Votre nom et prénom *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Awa Diop"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Numéro de téléphone portable *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+221 77 000 00 00"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>

                  {deliveryMethod === 'delivery' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Adresse précise de livraison *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Quartier, Immeuble, Numéro de rue"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-slate-300"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mode de Règlement
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`min-h-[44px] py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all ${
                          paymentMethod === 'cod'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 active:bg-slate-100'
                        }`}
                      >
                        À la livraison
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('wave')}
                        className={`min-h-[44px] py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all ${
                          paymentMethod === 'wave'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 active:bg-slate-100'
                        }`}
                      >
                        Wave
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('orange_money')}
                        className={`min-h-[44px] py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all ${
                          paymentMethod === 'orange_money'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 active:bg-slate-100'
                        }`}
                      >
                        Orange Money
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Instructions pour le commerçant (optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Sonner à l’interphone Diop"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-slate-300"
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Total and Submit Button */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-3 mt-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total articles :</span>
                    <span className="font-mono">{formatFCFA(subtotalXof)}</span>
                  </div>
                  {deliveryMethod === 'delivery' && (
                    <div className="flex justify-between text-slate-600">
                      <span>Frais de livraison :</span>
                      <span className="font-mono">{formatFCFA(deliveryFeeXof)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total de la commande :</span>
                    <span className="font-mono text-emerald-800 text-lg">
                      {formatFCFA(totalXof)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmittingOrder}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmittingOrder ? 'Confirmation en cours...' : 'Valider ma commande'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORDER CONFIRMATION MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-900">
                Commande Validée !
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Numéro de commande : <strong className="font-mono text-slate-900">#{completedOrder.orderNumber}</strong>
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-left space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Boutique :</span>
                <span className="font-semibold text-slate-900">{completedOrder.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span>Total réglé / dû :</span>
                <span className="font-bold text-emerald-800">{formatFCFA(completedOrder.totalXof)}</span>
              </div>
              <div className="flex justify-between">
                <span>Statut :</span>
                <span className="capitalize font-semibold text-emerald-700">{completedOrder.orderStatus}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Votre commande a été transmise à la boutique. Vous pouvez suivre l’état de préparation en temps réel depuis votre espace client.
            </p>

            <button
              onClick={() => {
                setCompletedOrder(null);
                setCartOpen(false);
              }}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg"
            >
              Continuer mes achats
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
