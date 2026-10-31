import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Product, Category, Order, StockMovement, CashRegister, UserRole, DeliveryZone } from '../../types/index.ts';
import { apiFetch } from '../../lib/api.ts';
import { formatFCFA, formatDateFr, formatDateShort } from '../../lib/currency.ts';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  FileCheck2,
  Users,
  Store,
  Wallet,
  Truck,
  TrendingUp,
  Settings,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Barcode,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Printer,
  X,
  CreditCard,
  DollarSign,
} from 'lucide-react';

interface CompanyDashboardProps {
  onOpenStorefront?: (slug: string) => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ onOpenStorefront }) => {
  const { user, company, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'pos' | 'products' | 'stock' | 'orders' | 'online_store' | 'team' | 'cash' | 'suppliers' | 'reports' | 'settings'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [purchasesList, setPurchasesList] = useState<any[]>([]);

  // POS State
  const [posCart, setPosCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [posSearch, setPosSearch] = useState('');
  const [posCategoryFilter, setPosCategoryFilter] = useState('all');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'cod' | 'wave' | 'orange_money'>('cod');
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posSaleSuccess, setPosSaleSuccess] = useState<Order | null>(null);

  // Cash Register Modals
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [openFloatAmount, setOpenFloatAmount] = useState(50000);
  const [closeRegisterModal, setCloseRegisterModal] = useState(false);
  const [countedCashAmount, setCountedCashAmount] = useState(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [cashMovementModal, setCashMovementModal] = useState(false);
  const [cashMovType, setCashMovType] = useState<'in' | 'out'>('out');
  const [cashMovAmount, setCashMovAmount] = useState(5000);
  const [cashMovReason, setCashMovReason] = useState('');

  // Product Add/Edit Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    categoryId: '',
    sku: '',
    barcode: '',
    description: '',
    priceXof: 1000,
    costPriceXof: 600,
    currentStock: 10,
    minStockAlert: 3,
    unit: 'unité',
    imageUrl: '',
    isAvailableOnline: true,
    isFeatured: false,
  });

  // Stock Adjustment Modal
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedStockProd, setSelectedStockProd] = useState<Product | null>(null);
  const [stockAdjType, setStockAdjType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [stockAdjQty, setStockAdjQty] = useState(10);
  const [stockAdjRef, setStockAdjRef] = useState('');
  const [stockAdjNotes, setStockAdjNotes] = useState('');

  // Add Staff Modal
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'cashier' as UserRole,
    password: '',
  });

  // Online Store Configuration State
  const [storeConfig, setStoreConfig] = useState(company?.onlineStoreConfig || null);
  const [storeConfigSaved, setStoreConfigSaved] = useState(false);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dash, prods, ords, stks, posStatus, staff, sups] = await Promise.all([
        apiFetch('/api/company/dashboard'),
        apiFetch('/api/company/products'),
        apiFetch('/api/company/orders'),
        apiFetch('/api/company/stocks/movements'),
        apiFetch('/api/company/pos/status'),
        apiFetch('/api/company/staff'),
        apiFetch('/api/company/suppliers'),
      ]);

      setDashboardData(dash);
      setProducts(prods.products || []);
      setCategories(prods.categories || []);
      setOrders(ords.orders || []);
      setMovements(stks.movements || []);
      setActiveRegister(posStatus.activeRegister || null);
      setStaffList(staff.staff || []);
      setSuppliersList(sups.suppliers || []);
      setPurchasesList(sups.purchases || []);

      if (company?.onlineStoreConfig) {
        setStoreConfig(company.onlineStoreConfig);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l’espace entreprise.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [company?.id]);

  // POS Cart management
  const addToPosCart = (product: Product) => {
    if (product.currentStock <= 0) {
      alert(`Stock épuisé pour ${product.name}`);
      return;
    }
    setPosCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          alert(`Limite de stock disponible atteinte (${product.currentStock}).`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromPosCart = (productId: string) => {
    setPosCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromPosCart(productId);
      return;
    }
    setPosCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const posTotalXof = posCart.reduce(
    (sum, item) => sum + item.product.priceXof * item.quantity,
    0
  );

  const handlePosCheckout = async () => {
    if (!posCart.length) return;
    try {
      const res = await apiFetch('/api/company/pos/sale', {
        method: 'POST',
        body: JSON.stringify({
          items: posCart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          paymentMethod: posPaymentMethod,
          customerName: posCustomerName || 'Client Comptoir',
        }),
      });

      setPosSaleSuccess(res.order);
      setPosCart([]);
      setPosCustomerName('');
      await fetchCompanyData();
    } catch (err: any) {
      alert(`Erreur encaissement : ${err.message}`);
    }
  };

  const handleOpenRegister = async () => {
    try {
      const res = await apiFetch('/api/company/pos/open-register', {
        method: 'POST',
        body: JSON.stringify({ openingBalanceXof: openFloatAmount }),
      });
      setActiveRegister(res.register);
      setOpenRegisterModal(false);
      await fetchCompanyData();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleCloseRegister = async () => {
    if (!activeRegister) return;
    try {
      await apiFetch('/api/company/pos/close-register', {
        method: 'POST',
        body: JSON.stringify({
          registerId: activeRegister.id,
          closingCountedBalanceXof: countedCashAmount,
          notes: closeNotes,
        }),
      });
      setActiveRegister(null);
      setCloseRegisterModal(false);
      await fetchCompanyData();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleCashMovement = async () => {
    if (!activeRegister) return;
    try {
      await apiFetch('/api/company/pos/cash-movement', {
        method: 'POST',
        body: JSON.stringify({
          registerId: activeRegister.id,
          type: cashMovType,
          amountXof: cashMovAmount,
          reason: cashMovReason,
        }),
      });
      setCashMovementModal(false);
      setCashMovReason('');
      await fetchCompanyData();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await apiFetch(`/api/company/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(prodForm),
        });
      } else {
        await apiFetch('/api/company/products', {
          method: 'POST',
          body: JSON.stringify(prodForm),
        });
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      await fetchCompanyData();
    } catch (err: any) {
      alert(`Erreur enregistrement : ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Êtes-vous certain de vouloir supprimer ce produit ?')) return;
    try {
      await apiFetch(`/api/company/products/${id}`, { method: 'DELETE' });
      await fetchCompanyData();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockProd) return;
    try {
      await apiFetch('/api/company/stocks/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedStockProd.id,
          type: stockAdjType,
          quantity: stockAdjQty,
          reference: stockAdjRef,
          notes: stockAdjNotes,
        }),
      });
      setStockModalOpen(false);
      setSelectedStockProd(null);
      await fetchCompanyData();
    } catch (err: any) {
      alert(`Erreur ajustement stock : ${err.message}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, orderStatus: string, paymentStatus?: string) => {
    try {
      await apiFetch(`/api/company/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ orderStatus, paymentStatus }),
      });
      await fetchCompanyData();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleSaveOnlineStoreConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeConfig) return;
    try {
      await apiFetch('/api/company/profile', {
        method: 'PUT',
        body: JSON.stringify({ onlineStoreConfig: storeConfig }),
      });
      setStoreConfigSaved(true);
      setTimeout(() => setStoreConfigSaved(false), 3000);
      await refreshUser();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/company/staff', {
        method: 'POST',
        body: JSON.stringify(staffForm),
      });
      setStaffModalOpen(false);
      setStaffForm({ fullName: '', email: '', phone: '', role: 'cashier', password: '' });
      await fetchCompanyData();
    } catch (err: any) {
      alert(`Erreur création employé : ${err.message}`);
    }
  };

  const filteredPosProducts = products.filter((p) => {
    if (posCategoryFilter !== 'all' && p.categoryId !== posCategoryFilter) return false;
    if (posSearch) {
      const q = posSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28 md:pb-20">
      {/* Top Banner with Company Info */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {company?.name.charAt(0) || 'B'}
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 line-clamp-1">
                    {company?.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    <span className="capitalize">{company?.activityType}</span>
                    <span>·</span>
                    <span>{company?.city}, {company?.country}</span>
                    <span>·</span>
                    <span className="font-semibold text-emerald-700">
                      Formule {company?.subscriptionPlanId?.replace('plan_', '').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {company?.onlineStoreConfig?.enabled && (
                <button
                  onClick={() => onOpenStorefront && onOpenStorefront(company.slug)}
                  className="min-h-[40px] px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-emerald-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Boutique en ligne</span>
                </button>
              )}

              {/* Cash Register State */}
              {activeRegister ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs min-h-[40px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                  <span className="font-semibold text-emerald-800 text-[11px] sm:text-xs">
                    Caisse ouverte ({formatFCFA(activeRegister.systemCalculatedBalanceXof)})
                  </span>
                  <button
                    onClick={() => {
                      setCountedCashAmount(activeRegister.systemCalculatedBalanceXof);
                      setCloseRegisterModal(true);
                    }}
                    className="text-[11px] underline text-emerald-900 hover:text-emerald-700 ml-1 p-1"
                  >
                    Clôturer
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setOpenRegisterModal(true)}
                  className="min-h-[40px] px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Ouvrir la caisse</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Subnav (Horizontal scroll with smooth touch) */}
        <div className="border-t border-slate-100 bg-slate-50/70 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1.5 py-2 text-xs font-medium text-slate-600 min-w-max">
              <button
                onClick={() => setActiveTab('overview')}
                className={`min-h-[40px] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'overview' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Tableau de bord</span>
              </button>

              <button
                onClick={() => setActiveTab('pos')}
                className={`min-h-[40px] px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'pos' ? 'bg-emerald-700 text-white font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Caisse Tactile (POS)</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`min-h-[40px] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'products' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Produits & Prix</span>
              </button>

              <button
                onClick={() => setActiveTab('stock')}
                className={`min-h-[40px] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'stock' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Stocks & Alertes</span>
                {dashboardData?.metrics?.lowStockCount > 0 && (
                  <span className="font-mono text-[10px] text-rose-600 font-semibold">
                    [{dashboardData.metrics.lowStockCount}]
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`min-h-[40px] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'orders' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Commandes & Ventes</span>
                {dashboardData?.pendingOrdersCount > 0 && (
                  <span className="font-mono text-[10px] text-amber-600 font-semibold">
                    [{dashboardData.pendingOrdersCount}]
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('online_store')}
                className={`min-h-[40px] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'online_store' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Boutique en ligne</span>
              </button>

              <button
                onClick={() => setActiveTab('team')}
                className={`min-h-[40px] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'team' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Équipe & Rôles</span>
              </button>

              <button
                onClick={() => setActiveTab('cash')}
                className={`min-h-[40px] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'cash' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Trésorerie</span>
              </button>

              <button
                onClick={() => setActiveTab('suppliers')}
                className={`min-h-[40px] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'suppliers' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Fournisseurs</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`min-h-[40px] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'reports' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Rapports</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 sm:mt-6">
        {/* 1. OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* KPI Cards (2x2 on mobile, 4 on desktop) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-[11px] sm:text-xs text-slate-500">Ventes du jour</span>
                <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {formatFCFA(dashboardData.metrics.todaySalesXof)}
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1 block">
                  {dashboardData.metrics.todayOrdersCount} vente(s)
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-[11px] sm:text-xs text-slate-500">CA Cumulé</span>
                <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                  {formatFCFA(dashboardData.metrics.totalSalesXof)}
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1 block">
                  {dashboardData.metrics.totalOrdersCount} commandes
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-[11px] sm:text-xs text-slate-500">Articles en stock</span>
                <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {dashboardData.metrics.totalProductsCount}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1">
                  {dashboardData.metrics.lowStockCount > 0 ? (
                    <span className="text-rose-600 font-semibold">
                      {dashboardData.metrics.lowStockCount} alerte(s) rupture
                    </span>
                  ) : (
                    <span>Stocks à niveau</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-[11px] sm:text-xs text-slate-500">Base Clients</span>
                <div className="text-lg sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {dashboardData.metrics.totalCustomersCount}
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1 block">
                  Comptoir & web
                </span>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="p-4 rounded-xl bg-emerald-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm">Prêt pour les encaissements en boutique ?</h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Lancez la caisse tactile POS pour enregistrer les ventes au comptoir avec impression de ticket et décompte immédiat des stocks.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('pos')}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Ouvrir la Caisse Tactile</span>
              </button>
            </div>

            {/* Low stock alerts & recent orders split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Low stock items */}
              <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Alertes Stocks Faibles
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('stock')}
                    className="min-h-[40px] px-2 text-xs text-emerald-700 hover:underline flex items-center"
                  >
                    Gérer les stocks
                  </button>
                </div>

                {dashboardData.lowStockAlerts?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Tous vos stocks sont actuellement au-dessus du seuil d’alerte.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 mt-2">
                    {dashboardData.lowStockAlerts?.map((prod: Product) => (
                      <div key={prod.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                        <div>
                          <span className="font-semibold text-slate-800 line-clamp-1">{prod.name}</span>
                          <span className="text-[11px] text-slate-500 block">
                            SKU: {prod.sku} · Seuil: {prod.minStockAlert} {prod.unit}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-rose-600 block text-xs">
                            {prod.currentStock} {prod.unit}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedStockProd(prod);
                              setStockAdjType('in');
                              setStockAdjQty(10);
                              setStockModalOpen(true);
                            }}
                            className="min-h-[36px] text-[11px] text-emerald-700 hover:underline font-medium inline-flex items-center"
                          >
                            Réapprovisionner
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Dernières Ventes
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="min-h-[40px] px-2 text-xs text-emerald-700 hover:underline flex items-center"
                  >
                    Voir tout ({orders.length})
                  </button>
                </div>

                <div className="divide-y divide-slate-100 mt-2">
                  {dashboardData.recentOrders?.map((ord: Order) => (
                    <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900">#{ord.orderNumber}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-700 truncate max-w-[120px]">{ord.customerName}</span>
                          <span className="text-[9px] uppercase font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                            {ord.channel === 'pos' ? 'Comptoir' : 'En ligne'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {formatDateShort(ord.createdAt)} · {ord.items.length} art.
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-900 block text-xs">
                          {formatFCFA(ord.totalXof)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold capitalize ${
                            ord.orderStatus === 'completed'
                              ? 'text-emerald-700'
                              : ord.orderStatus === 'cancelled'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. POS CAISSE TACTILE (Optimized for Mobile and Tablet Touch) */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Catalog Grid */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {/* POS Search & Category Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-white p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Scanner code-barre ou chercher un article..."
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600 min-h-[42px]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar py-1">
                  <button
                    onClick={() => setPosCategoryFilter('all')}
                    className={`min-h-[38px] px-3.5 py-1.5 text-xs rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                      posCategoryFilter === 'all'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Tous
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setPosCategoryFilter(c.id)}
                      className={`min-h-[38px] px-3.5 py-1.5 text-xs rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                        posCategoryFilter === c.id
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Touch Grid: 2 columns on mobile, 3 on tablet/desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {filteredPosProducts.map((p) => {
                  const inCartItem = posCart.find((i) => i.product.id === p.id);
                  const isOutOfStock = p.currentStock <= 0;

                  return (
                    <button
                      key={p.id}
                      disabled={isOutOfStock}
                      onClick={() => addToPosCart(p)}
                      className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[140px] select-none active:scale-[0.98] ${
                        isOutOfStock
                          ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                          : inCartItem
                          ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                          : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug">
                            {p.name}
                          </h4>
                          {inCartItem && (
                            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                              x{inCartItem.quantity}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                          {p.sku}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-end justify-between">
                        <div>
                          <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 block">
                            {formatFCFA(p.priceXof)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Dispo: {p.currentStock} {p.unit}
                          </span>
                        </div>
                        <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                          +
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Col: POS Current Ticket / Cart (Desktop sticky or mobile visible) */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between h-full min-h-[460px] shadow-sm">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-bold text-sm text-slate-900">Ticket de Vente ({posCart.length})</h3>
                  </div>
                  {posCart.length > 0 && (
                    <button
                      onClick={() => setPosCart([])}
                      className="min-h-[36px] px-2 text-xs text-rose-600 hover:underline flex items-center font-medium"
                    >
                      Vider
                    </button>
                  )}
                </div>

                {/* Customer field */}
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Nom client ou table (optionnel)"
                    value={posCustomerName}
                    onChange={(e) => setPosCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-600 min-h-[40px]"
                  />
                </div>

                {/* Cart Items List */}
                <div className="divide-y divide-slate-100 mt-3 max-h-64 sm:max-h-72 overflow-y-auto">
                  {posCart.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Ticket vide. Touchez un article du catalogue pour l’ajouter.
                    </div>
                  ) : (
                    posCart.map((item) => (
                      <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs gap-1">
                        <div className="pr-1 flex-1">
                          <span className="font-semibold text-slate-800 block line-clamp-1">
                            {item.product.name}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {formatFCFA(item.product.priceXof)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                            className="min-h-[36px] min-w-[36px] bg-slate-100 active:bg-slate-200 rounded-lg flex items-center justify-center font-bold text-sm"
                            aria-label="Diminuer quantité"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs w-5 text-center font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                            className="min-h-[36px] min-w-[36px] bg-slate-100 active:bg-slate-200 rounded-lg flex items-center justify-center font-bold text-sm"
                            aria-label="Augmenter quantité"
                          >
                            +
                          </button>
                          <span className="font-mono font-bold text-slate-900 ml-1.5 w-16 text-right text-xs">
                            {formatFCFA(item.product.priceXof * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Total & Checkout */}
              <div className="pt-3 border-t border-slate-200 mt-3 space-y-3">
                <div className="flex items-center justify-between text-base font-bold text-slate-900">
                  <span>Total :</span>
                  <span className="font-mono tabular-nums text-emerald-800 text-xl">
                    {formatFCFA(posTotalXof)}
                  </span>
                </div>

                {/* Payment Method selector with touch targets */}
                <div>
                  <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                    Mode de Règlement :
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPosPaymentMethod('cod')}
                      className={`min-h-[44px] py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        posPaymentMethod === 'cod'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 active:bg-slate-100'
                      }`}
                    >
                      Espèces
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosPaymentMethod('wave')}
                      className={`min-h-[44px] py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        posPaymentMethod === 'wave'
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 active:bg-slate-100'
                      }`}
                    >
                      Wave
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosPaymentMethod('orange_money')}
                      className={`min-h-[44px] py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        posPaymentMethod === 'orange_money'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 active:bg-slate-100'
                      }`}
                    >
                      Orange Money
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={posCart.length === 0}
                  onClick={handlePosCheckout}
                  className="w-full min-h-[48px] py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Encaisser {formatFCFA(posTotalXof)}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. PRODUCTS & PRICING TAB */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Catalogue Produits ({products.length})
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProdForm({
                    name: '',
                    categoryId: categories[0]?.id || '',
                    sku: `SKU-${Date.now().toString().slice(-4)}`,
                    barcode: '',
                    description: '',
                    priceXof: 1000,
                    costPriceXof: 600,
                    currentStock: 10,
                    minStockAlert: 3,
                    unit: 'unité',
                    imageUrl: '',
                    isAvailableOnline: true,
                    isFeatured: false,
                  });
                  setProductModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau Produit</span>
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-mono">
                    <tr>
                      <th className="px-4 py-3">Produit</th>
                      <th className="px-4 py-3">SKU / Code-barre</th>
                      <th className="px-4 py-3 text-right">Prix Vente</th>
                      <th className="px-4 py-3 text-right">Coût Achat</th>
                      <th className="px-4 py-3 text-right">Stock</th>
                      <th className="px-4 py-3">Vitrine Web</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{p.description}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {p.sku}
                          {p.barcode && <span className="block text-[10px] text-slate-400">{p.barcode}</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatFCFA(p.priceXof)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">
                          {formatFCFA(p.costPriceXof)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-mono font-semibold ${
                              p.currentStock <= p.minStockAlert ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            {p.currentStock} {p.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[11px] font-semibold ${
                              p.isAvailableOnline ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {p.isAvailableOnline ? 'En ligne' : 'En magasin'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProdForm({
                                  name: p.name,
                                  categoryId: p.categoryId,
                                  sku: p.sku,
                                  barcode: p.barcode || '',
                                  description: p.description,
                                  priceXof: p.priceXof,
                                  costPriceXof: p.costPriceXof,
                                  currentStock: p.currentStock,
                                  minStockAlert: p.minStockAlert,
                                  unit: p.unit,
                                  imageUrl: p.imageUrl || '',
                                  isAvailableOnline: p.isAvailableOnline,
                                  isFeatured: p.isFeatured || false,
                                });
                                setProductModalOpen(true);
                              }}
                              className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded text-[11px]"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded text-[11px]"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. STOCKS & MOVEMENTS TAB */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            {/* Stock overview strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-xs text-slate-500">Valeur totale du stock au coût d’achat</span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {formatFCFA(
                    products.reduce((sum, p) => sum + p.costPriceXof * p.currentStock, 0)
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-xs text-slate-500">Valeur marchande potentielle (Prix Vente)</span>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  {formatFCFA(
                    products.reduce((sum, p) => sum + p.priceXof * p.currentStock, 0)
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200">
                <span className="text-xs text-slate-500">Articles sous seuil d’alerte</span>
                <div className="text-xl font-bold font-mono text-rose-600 mt-1">
                  {products.filter((p) => p.currentStock <= p.minStockAlert).length}
                </div>
              </div>
            </div>

            {/* Movements history */}
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
                Historique des Mouvements de Stock
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                {movements.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">{m.productName}</span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-600">Réf: {m.reference}</span>
                        <span>·</span>
                        <span>Par {m.createdByName}</span>
                        <span>·</span>
                        <span>{formatDateFr(m.createdAt)}</span>
                      </div>
                      {m.notes && <p className="text-[11px] text-slate-400 mt-0.5">{m.notes}</p>}
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold ${
                          m.quantity > 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Nouveau solde: {m.newStock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. ORDERS & SALES TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Commandes Reçues (POS & Vitrine Web)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mettez à jour le statut de préparation et de livraison pour informer les clients.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-600">
                {orders.length} commandes au total
              </span>
            </div>

            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">#{ord.orderNumber}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-semibold text-slate-700">{ord.customerName}</span>
                        {ord.customerPhone && <span className="text-slate-500">({ord.customerPhone})</span>}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                        {formatDateFr(ord.createdAt)} · Canal : {ord.channel === 'pos' ? 'Caisse Comptoir' : 'Boutique en ligne'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono text-sm font-bold text-slate-900 block">
                          {formatFCFA(ord.totalXof)}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">
                          Paiement : {ord.paymentMethod} ({ord.paymentStatus})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order items list */}
                  <div className="bg-slate-50 p-2.5 rounded-lg space-y-1">
                    {ord.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span>
                          {item.quantity}x {item.productName}
                        </span>
                        <span className="font-mono font-medium text-slate-700">
                          {formatFCFA(item.totalXof)}
                        </span>
                      </div>
                    ))}
                    {ord.deliveryFeeXof > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                        <span>Frais de livraison ({ord.deliveryZoneName})</span>
                        <span className="font-mono">{formatFCFA(ord.deliveryFeeXof)}</span>
                      </div>
                    )}
                  </div>

                  {/* Delivery address & notes */}
                  {ord.deliveryAddress && (
                    <div className="text-[11px] text-slate-600">
                      <strong>Adresse de livraison :</strong> {ord.deliveryAddress}
                    </div>
                  )}
                  {ord.notes && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded">
                      <strong>Note client :</strong> {ord.notes}
                    </div>
                  )}

                  {/* Order Workflow Actions */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-600">Statut actuel :</span>
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded capitalize">
                        {ord.orderStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {ord.orderStatus === 'received' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-medium"
                        >
                          Passer en préparation
                        </button>
                      )}
                      {ord.orderStatus === 'preparing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'ready')}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium"
                        >
                          Commande prête
                        </button>
                      )}
                      {ord.orderStatus === 'ready' && ord.deliveryMethod === 'delivery' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'delivering')}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium"
                        >
                          Expédier / En livraison
                        </button>
                      )}
                      {['delivering', 'ready'].includes(ord.orderStatus) && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'completed', 'paid')}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-medium"
                        >
                          Marquer Livrée & Clôturée
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. ONLINE STORE CONFIGURATION TAB */}
        {activeTab === 'online_store' && storeConfig && (
          <form onSubmit={handleSaveOnlineStoreConfig} className="max-w-3xl space-y-6">
            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Paramètres de la Boutique en Ligne Publique
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Activez et personnalisez votre page de vente accessible à vos clients.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableStore"
                    checked={storeConfig.enabled}
                    onChange={(e) => setStoreConfig({ ...storeConfig, enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <label htmlFor="enableStore" className="text-xs font-semibold text-slate-800">
                    Activer la boutique en ligne
                  </label>
                </div>
              </div>

              {storeConfigSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Paramètres de la boutique en ligne sauvegardés avec succès !</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Slogan / Titre d’accueil
                  </label>
                  <input
                    type="text"
                    value={storeConfig.tagline || ''}
                    onChange={(e) => setStoreConfig({ ...storeConfig, tagline: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horaires d’ouverture
                  </label>
                  <input
                    type="text"
                    value={storeConfig.openingHours || ''}
                    onChange={(e) => setStoreConfig({ ...storeConfig, openingHours: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description de la boutique
                </label>
                <textarea
                  rows={2}
                  value={storeConfig.description || ''}
                  onChange={(e) => setStoreConfig({ ...storeConfig, description: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numéro WhatsApp Commandes
                  </label>
                  <input
                    type="text"
                    value={storeConfig.contactWhatsapp || ''}
                    onChange={(e) => setStoreConfig({ ...storeConfig, contactWhatsapp: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Commande minimum (FCFA)
                  </label>
                  <input
                    type="number"
                    value={storeConfig.minimumOrderXof || 0}
                    onChange={(e) => setStoreConfig({ ...storeConfig, minimumOrderXof: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Delivery zones list */}
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-900 mb-2">
                  Zones & Tarifs de Livraison
                </span>
                <div className="space-y-2">
                  {storeConfig.deliveryZones?.map((z, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{z.name}</span>
                        <span className="text-slate-500 ml-2">Délai estimé : {z.estTime}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800">
                        {formatFCFA(z.feeXof)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-xs"
            >
              Enregistrer les modifications
            </button>
          </form>
        )}

        {/* 7. TEAM & ROLES TAB */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Collaborateurs & Permissions ({staffList.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attribuez les rôles : Caissier, Responsable de boutique, Gestionnaire de stock ou Employé.
                </p>
              </div>
              <button
                onClick={() => setStaffModalOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un collaborateur</span>
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-mono">
                  <tr>
                    <th className="px-4 py-3">Nom & E-mail</th>
                    <th className="px-4 py-3">Téléphone</th>
                    <th className="px-4 py-3">Rôle attribué</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">{st.fullName}</span>
                        <span className="text-[11px] text-slate-500">{st.email}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{st.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded capitalize">
                          {st.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold text-[11px]">
                        Actif
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. CASH & TREASURY TAB */}
        {activeTab === 'cash' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Statut Caisse</span>
                <div className="text-lg font-bold text-slate-900 mt-1">
                  {activeRegister ? 'Caisse Ouverte' : 'Caisse Fermée'}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {activeRegister ? `Caissier : ${activeRegister.cashierName}` : 'Aucune session active'}
                </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Solde Caisse Calculé</span>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  {formatFCFA(activeRegister?.systemCalculatedBalanceXof || 0)}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Fond initial : {formatFCFA(activeRegister?.openingBalanceXof || 0)}
                </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                <span className="text-xs text-slate-500">Opérations Rapides</span>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    disabled={!activeRegister}
                    onClick={() => { setCashMovType('out'); setCashMovementModal(true); }}
                    className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-800 text-xs font-semibold rounded-lg border border-rose-200"
                  >
                    Sortie Cash
                  </button>
                  <button
                    disabled={!activeRegister}
                    onClick={() => { setCashMovType('in'); setCashMovementModal(true); }}
                    className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200"
                  >
                    Entrée Cash
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. SUPPLIERS & PURCHASES TAB */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Fournisseurs & Réapprovisionnements
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestion des grossistes, coopératives agricoles et commandes d’achats.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliersList.map((s) => (
                <div key={s.id} className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                      <span className="text-slate-500">{s.contactPerson}</span>
                    </div>
                  </div>
                  <div className="text-slate-600 space-y-0.5">
                    <div>Téléphone : {s.phone}</div>
                    <div>E-mail : {s.email}</div>
                    <div>Adresse : {s.address}</div>
                  </div>
                  {s.notes && (
                    <p className="text-[11px] text-slate-400 bg-slate-50 p-2 rounded">
                      {s.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. REPORTS & MARGINS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Chiffre d’Affaires Total</span>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  {formatFCFA(dashboardData?.metrics?.totalSalesXof || 0)}
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Marge Brute Estimée (Ventes - Coûts)</span>
                <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                  {formatFCFA(
                    (dashboardData?.metrics?.totalSalesXof || 0) * 0.38
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Taux de marge brute moyen : ~38%
                </span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Panier Moyen</span>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  {formatFCFA(
                    dashboardData?.metrics?.totalOrdersCount
                      ? dashboardData.metrics.totalSalesXof / dashboardData.metrics.totalOrdersCount
                      : 0
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRODUCT CREATE / EDIT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <form onSubmit={handleSaveProduct} className="w-full max-w-lg bg-white rounded-xl p-6 shadow-2xl border border-slate-200 space-y-3.5 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Désignation du produit *
              </label>
              <input
                type="text"
                required
                value={prodForm.name}
                onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={prodForm.categoryId}
                  onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unité de vente
                </label>
                <input
                  type="text"
                  placeholder="unité, kg, portion, sac..."
                  value={prodForm.unit}
                  onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prix de Vente (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  value={prodForm.priceXof}
                  onChange={(e) => setProdForm({ ...prodForm, priceXof: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coût d’Achat (FCFA)
                </label>
                <input
                  type="number"
                  value={prodForm.costPriceXof}
                  onChange={(e) => setProdForm({ ...prodForm, costPriceXof: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stock Initial
                </label>
                <input
                  type="number"
                  disabled={!!editingProduct}
                  value={prodForm.currentStock}
                  onChange={(e) => setProdForm({ ...prodForm, currentStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seuil Alerte Stock Bas
                </label>
                <input
                  type="number"
                  value={prodForm.minStockAlert}
                  onChange={(e) => setProdForm({ ...prodForm, minStockAlert: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Référence / SKU
                </label>
                <input
                  type="text"
                  value={prodForm.sku}
                  onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Code-barre (EAN)
                </label>
                <input
                  type="text"
                  value={prodForm.barcode}
                  onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={prodForm.description}
                onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodForm.isAvailableOnline}
                  onChange={(e) => setProdForm({ ...prodForm, isAvailableOnline: e.target.checked })}
                  className="rounded text-emerald-700 focus:ring-emerald-600"
                />
                <span>Visible sur la boutique en ligne</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodForm.isFeatured}
                  onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })}
                  className="rounded text-emerald-700 focus:ring-emerald-600"
                />
                <span>Mettre en avant</span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-xs"
              >
                Enregistrer le produit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {stockModalOpen && selectedStockProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form onSubmit={handleStockAdjust} className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-slate-200 space-y-3.5">
            <h3 className="font-bold text-base text-slate-900">
              Mouvement de Stock : {selectedStockProd.name}
            </h3>
            <p className="text-xs text-slate-500">
              Stock actuel en rayon : <strong className="font-mono text-slate-800">{selectedStockProd.currentStock} {selectedStockProd.unit}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type d’opération
              </label>
              <select
                value={stockAdjType}
                onChange={(e) => setStockAdjType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="in">Entrée / Réception fournisseur (+)</option>
                <option value="out">Sortie manuelle / Perte / Avarie (-)</option>
                <option value="adjustment">Inventaire physique direct (=)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantité
              </label>
              <input
                type="number"
                min="1"
                required
                value={stockAdjQty}
                onChange={(e) => setStockAdjQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Référence / Bon de livraison
              </label>
              <input
                type="text"
                placeholder="BL-2026-001"
                value={stockAdjRef}
                onChange={(e) => setStockAdjRef(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStockModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg"
              >
                Valider l’opération
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OPEN CASH REGISTER MODAL */}
      {openRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Ouverture de la Session de Caisse
            </h3>
            <p className="text-xs text-slate-600">
              Veuillez compter et déclarer le fond de caisse initial en espèces (monnaie de départ).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fond de caisse initial (en FCFA)
              </label>
              <input
                type="number"
                value={openFloatAmount}
                onChange={(e) => setOpenFloatAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setOpenRegisterModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleOpenRegister}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg"
              >
                Démarrer la session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE CASH REGISTER MODAL */}
      {closeRegisterModal && activeRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Clôture et Arrêté de Caisse
            </h3>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div>Fond initial : <strong className="font-mono">{formatFCFA(activeRegister.openingBalanceXof)}</strong></div>
              <div>Entrées de caisse (Ventes espèces) : <strong className="font-mono text-emerald-700">+{formatFCFA(activeRegister.totalCashInXof)}</strong></div>
              <div>Sorties de caisse : <strong className="font-mono text-rose-600">-{formatFCFA(activeRegister.totalCashOutXof)}</strong></div>
              <div className="pt-1 border-t border-slate-200 font-bold">
                Solde théorique calculé : <span className="font-mono text-slate-900">{formatFCFA(activeRegister.systemCalculatedBalanceXof)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Espèces réellement comptées dans le tiroir (FCFA)
              </label>
              <input
                type="number"
                value={countedCashAmount}
                onChange={(e) => setCountedCashAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono"
              />
              <span className="text-[11px] font-mono mt-1 block text-slate-500">
                Écart de caisse : {formatFCFA(countedCashAmount - activeRegister.systemCalculatedBalanceXof)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / Justification de l’écart (optionnel)
              </label>
              <input
                type="text"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setCloseRegisterModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleCloseRegister}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg"
              >
                Confirmer la clôture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASH MOVEMENT MODAL */}
      {cashMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              {cashMovType === 'out' ? 'Sortie d’Espèces Caisse' : 'Apport d’Espèces Caisse'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Montant (en FCFA)
              </label>
              <input
                type="number"
                min="100"
                value={cashMovAmount}
                onChange={(e) => setCashMovAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motif obligatoire
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Achat sacs plastique / Monnaie banque / Dépannage"
                value={cashMovReason}
                onChange={(e) => setCashMovReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setCashMovementModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleCashMovement}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg"
              >
                Enregistrer le mouvement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form onSubmit={handleCreateStaff} className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-slate-200 space-y-3.5">
            <h3 className="font-bold text-base text-slate-900">
              Ajouter un Employé / Collaborateur
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom et prénom *
              </label>
              <input
                type="text"
                required
                value={staffForm.fullName}
                onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail professionnel *
                </label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rôle & Autorisations *
              </label>
              <select
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="cashier">Caissier (Encaissements POS et caisse)</option>
                <option value="store_manager">Responsable de point de vente</option>
                <option value="stock_manager">Gestionnaire de stock & achats</option>
                <option value="employee">Employé (Accès standard)</option>
                <option value="company_admin">Administrateur d’entreprise</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mot de passe temporaire *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={staffForm.password}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg"
              >
                Créer l’accès employé
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POS SALE SUCCESS TICKET POPUP */}
      {posSaleSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Vente Encaissée !</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ticket #{posSaleSuccess.orderNumber}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-left font-mono">
              <div className="flex justify-between">
                <span>Total :</span>
                <span className="font-bold text-slate-900">{formatFCFA(posSaleSuccess.totalXof)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Règlement :</span>
                <span className="uppercase">{posSaleSuccess.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Articles :</span>
                <span>{posSaleSuccess.items.length}</span>
              </div>
            </div>

            <button
              onClick={() => setPosSaleSuccess(null)}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
            >
              Nouvelle Vente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
