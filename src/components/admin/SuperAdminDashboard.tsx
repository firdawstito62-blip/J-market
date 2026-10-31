import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Company, SubscriptionPlan, AuditLog, PlatformSettings } from '../../types/index.ts';
import { apiFetch } from '../../lib/api.ts';
import { formatFCFA, formatDateFr, formatDateShort } from '../../lib/currency.ts';
import {
  ShieldAlert,
  Building2,
  Users,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
  Eye,
  Sliders,
  FileText,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Search,
  Lock,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'pending' | 'plans' | 'subscriptions' | 'audit' | 'settings'>('overview');

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');

  // Modal inspection & audit state
  const [inspectCompanyId, setInspectCompanyId] = useState<string | null>(null);
  const [inspectedCompanyData, setInspectedCompanyData] = useState<any>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState<'active' | 'suspended' | 'rejected'>('active');
  const [statusReason, setStatusReason] = useState('');

  // Plan editing modal
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dash, comps, plns, subs, logs, setts] = await Promise.all([
        apiFetch('/api/super-admin/dashboard'),
        apiFetch('/api/super-admin/companies'),
        apiFetch('/api/super-admin/plans'),
        apiFetch('/api/super-admin/subscriptions'),
        apiFetch('/api/super-admin/audit-logs'),
        apiFetch('/api/super-admin/settings'),
      ]);

      setDashboardData(dash);
      setCompanies(comps.companies || []);
      setPlans(plns.plans || []);
      setSubscriptions(subs.subscriptions || []);
      setAuditLogs(logs.auditLogs || []);
      setSettings(setts.settings || null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleInspectCompany = async (companyId: string) => {
    setInspectCompanyId(companyId);
    setInspectLoading(true);
    try {
      const data = await apiFetch(`/api/super-admin/companies/${companyId}/details`);
      setInspectedCompanyData(data);
      // Refresh audit logs since the backend logged the inspection
      const logs = await apiFetch('/api/super-admin/audit-logs');
      setAuditLogs(logs.auditLogs || []);
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
      setInspectCompanyId(null);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleOpenStatusModal = (comp: any, status: 'active' | 'suspended' | 'rejected') => {
    setSelectedCompany(comp);
    setTargetStatus(status);
    setStatusReason('');
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedCompany) return;
    try {
      await apiFetch(`/api/super-admin/companies/${selectedCompany.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason,
        }),
      });
      setStatusModalOpen(false);
      setSelectedCompany(null);
      await fetchDashboard();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      await apiFetch(`/api/super-admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingPlan),
      });
      setEditingPlan(null);
      await fetchDashboard();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await apiFetch('/api/super-admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      alert('Paramètres généraux enregistrés.');
      await fetchDashboard();
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (activityFilter !== 'all' && c.activityType !== activityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.managerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCompanies = companies.filter((c) => c.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16">
      {/* Top Admin Security Notice */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-2.5 text-xs flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-slate-200">
            Console d’Administration Centrale J-Market
          </span>
          <span className="text-slate-600">/</span>
          <span>Accès Super-Administrateur Sécurisé</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400">
            Session : {user?.email}
          </span>
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Main Admin Nav */}
      <div className="border-b border-slate-800 bg-slate-900/90 sticky top-16 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 text-xs font-medium no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:bg-slate-800/50'
              }`}
            >
              Tableau de bord global
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center ${
                activeTab === 'companies'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:bg-slate-800/50'
              }`}
            >
              Entreprises ({companies.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:bg-slate-800/50'
              }`}
            >
              <span>Demandes en attente</span>
              {pendingCompanies.length > 0 && (
                <span className="font-mono text-[10px] text-amber-300">
                  [{pendingCompanies.length}]
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center ${
                activeTab === 'plans'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:bg-slate-800/50'
              }`}
            >
              Formules & Tarifs
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center ${
                activeTab === 'subscriptions'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:bg-slate-800/50'
              }`}
            >
              Suivi Abonnements & Impayés
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center ${
                activeTab === 'audit'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:bg-slate-800/50'
              }`}
            >
              Journaux d’Audit & Sécurité
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:bg-slate-800/50'
              }`}
            >
              Paramètres Généraux
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-950 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* Top Metric Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-xs text-slate-400">Total Entreprises</span>
                <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                  {dashboardData.overview.totalCompanies}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                  <span className="text-emerald-400 font-semibold">{dashboardData.overview.activeCompanies} actives</span>
                  <span>·</span>
                  <span className="text-amber-400">{dashboardData.overview.pendingCompanies} en attente</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-xs text-slate-400">Boutiques en ligne ouvertes</span>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                  {dashboardData.overview.activeOnlineStores}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Vitrine web & livraison activées
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-xs text-slate-400">Comptes Clients & Employés</span>
                <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                  {dashboardData.overview.totalClients + dashboardData.overview.totalEmployees}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                  <span>{dashboardData.overview.totalClients} clients</span>
                  <span>·</span>
                  <span>{dashboardData.overview.totalEmployees} staff</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <span className="text-xs text-slate-400">Volume Total des Ventes (GMV)</span>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                  {formatFCFA(dashboardData.overview.totalGMVXof)}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {dashboardData.overview.totalOrders} commandes enregistrées
                </div>
              </div>
            </div>

            {/* Pending Requests Alert Box */}
            {dashboardData.overview.pendingCompanies > 0 && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-semibold text-sm text-amber-100">
                      {dashboardData.overview.pendingCompanies} demande(s) de création d’entreprise en attente
                    </h3>
                    <p className="text-xs text-amber-300/80 mt-0.5">
                      Vérifiez les informations légales et professionnelles avant validation.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('pending')}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors"
                >
                  Examiner les demandes
                </button>
              </div>
            )}

            {/* Quick Two Column: Subscriptions & Recent Audits */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Breakdown */}
              <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/80">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Modèle Économique & Abonnements
                  </h3>
                  <span className="text-xs font-mono text-emerald-400">
                    MRR estimé : {formatFCFA(dashboardData.subscriptionsSummary?.estimatedMonthlyRevenueXof)}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Essai gratuit</span>
                    <span className="text-lg font-bold font-mono text-white mt-1 block">
                      {dashboardData.subscriptionsSummary?.trial}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Actifs</span>
                    <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
                      {dashboardData.subscriptionsSummary?.active}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">En attente</span>
                    <span className="text-lg font-bold font-mono text-amber-400 mt-1 block">
                      {dashboardData.subscriptionsSummary?.pending_payment}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Suspendus</span>
                    <span className="text-lg font-bold font-mono text-rose-400 mt-1 block">
                      {dashboardData.subscriptionsSummary?.suspended}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Audit events snapshot */}
              <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/80">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Derniers Événements d’Audit & Sécurité
                  </h3>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Voir tout
                  </button>
                </div>
                <div className="divide-y divide-slate-700/60 mt-3 text-xs">
                  {auditLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{log.action}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400">{log.actorName}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {log.details}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {formatDateShort(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. COMPANIES LIST TAB */}
        {activeTab === 'companies' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Rechercher une entreprise, ville, gérant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="pending">En attente</option>
                  <option value="suspended">Suspendu</option>
                  <option value="rejected">Refusé</option>
                </select>

                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
                >
                  <option value="all">Toutes activités</option>
                  <option value="alimentation">Alimentation</option>
                  <option value="superette">Supérette</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="fast_food">Fast-food</option>
                  <option value="boutique">Boutique</option>
                </select>
              </div>
            </div>

            {/* Companies Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Entreprise</th>
                      <th className="px-4 py-3">Activité & Ville</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Produits</th>
                      <th className="px-4 py-3 text-right">Ventes GMV</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredCompanies.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-100">{c.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Gérant : {c.managerName} · {c.phone}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize text-slate-200">{c.activityType}</span>
                          <span className="text-slate-500"> · </span>
                          <span className="text-slate-400">{c.city}, {c.country}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-semibold text-[11px] ${
                              c.status === 'active'
                                ? 'text-emerald-400'
                                : c.status === 'pending'
                                ? 'text-amber-400'
                                : c.status === 'suspended'
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {c.status === 'active' && 'Actif'}
                            {c.status === 'pending' && 'En attente'}
                            {c.status === 'suspended' && 'Suspendu'}
                            {c.status === 'rejected' && 'Refusé'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-300">
                          {c.productCount}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-400 font-medium">
                          {formatFCFA(c.revenueXof)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect commercial details (Triggers strict audit log) */}
                            <button
                              onClick={() => handleInspectCompany(c.id)}
                              title="Consulter les données commerciales (Accès audité)"
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3 text-emerald-400" />
                              <span>Détails</span>
                            </button>

                            {/* Status Change Controls */}
                            {c.status === 'pending' && (
                              <button
                                onClick={() => handleOpenStatusModal(c, 'active')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors"
                              >
                                Valider
                              </button>
                            )}

                            {c.status === 'active' && (
                              <button
                                onClick={() => handleOpenStatusModal(c, 'suspended')}
                                className="px-2 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded text-[11px] transition-colors"
                              >
                                Suspendre
                              </button>
                            )}

                            {c.status === 'suspended' && (
                              <button
                                onClick={() => handleOpenStatusModal(c, 'active')}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] transition-colors"
                              >
                                Réactiver
                              </button>
                            )}
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

        {/* 3. PENDING REQUESTS TAB */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <h3 className="font-semibold text-sm text-slate-100">
                Demandes d’inscription d’entreprises en attente de vérification
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                L’administrateur général doit contrôler la conformité de l’activité commerciale avant de donner accès à l’espace professionnel et à la vitrine publique.
              </p>
            </div>

            {pendingCompanies.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs">
                Aucune nouvelle demande d’entreprise en attente. Tout est à jour !
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingCompanies.map((c) => (
                  <div key={c.id} className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-base text-slate-100">{c.name}</h4>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {c.activityType.toUpperCase()} · {c.city}, {c.country}
                          </span>
                        </div>
                        <span className="text-xs text-amber-400 font-mono font-medium">
                          En attente
                        </span>
                      </div>

                      <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                        <div><strong className="text-slate-400">Responsable :</strong> {c.managerName}</div>
                        <div><strong className="text-slate-400">E-mail pro :</strong> {c.email}</div>
                        <div><strong className="text-slate-400">Téléphone :</strong> {c.phone}</div>
                        <div><strong className="text-slate-400">Adresse :</strong> {c.address}</div>
                        <div><strong className="text-slate-400">Date de demande :</strong> {formatDateFr(c.createdAt)}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => handleInspectCompany(c.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                      >
                        Vérifier dossier
                      </button>
                      <button
                        onClick={() => handleOpenStatusModal(c, 'rejected')}
                        className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs rounded-lg transition-colors ml-auto"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => handleOpenStatusModal(c, 'active')}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                      >
                        Accepter & Activer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. PLANS & PRICING TAB */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-100">
                  Configuration des Formules d’Abonnement
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Définissez les tarifs mensuels en FCFA, les quotas (produits, points de vente, staff) et les commissions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((p) => (
                <div key={p.id} className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base text-white">{p.name}</h4>
                      <span className="font-mono text-xs text-slate-400">
                        {p.commissionPercent}% com.
                      </span>
                    </div>

                    <div className="mt-3">
                      <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                        {formatFCFA(p.priceMonthlyXof)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">/ mois</span>
                    </div>

                    <p className="text-xs text-slate-400 mt-3">{p.description}</p>

                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                      <div>Max produits : <strong className="font-mono">{p.maxProducts}</strong></div>
                      <div>Max points de vente : <strong className="font-mono">{p.maxPos}</strong></div>
                      <div>Max utilisateurs/staff : <strong className="font-mono">{p.maxStaff}</strong></div>
                      <div>Boutique en ligne : <strong>{p.onlineStoreAllowed ? 'Inclus' : 'Non'}</strong></div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60">
                      <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                        Fonctionnalités :
                      </span>
                      <ul className="space-y-1 text-xs text-slate-400">
                        {p.features?.map((f, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400">✓</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditingPlan(p)}
                    className="w-full mt-6 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Modifier la formule & tarifs
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. SUBSCRIPTIONS & ARREARS TAB */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <h3 className="font-semibold text-sm text-slate-100">
                Suivi des Abonnements des Entreprises
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Visualisez l’état des renouvellements, paiements mensuels et éventuels impayés.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono">
                  <tr>
                    <th className="px-4 py-3">Entreprise</th>
                    <th className="px-4 py-3">Formule</th>
                    <th className="px-4 py-3 text-right">Montant / Mois</th>
                    <th className="px-4 py-3">Statut Abonnement</th>
                    <th className="px-4 py-3">Échéance</th>
                    <th className="px-4 py-3">Alerte Impayé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {subscriptions.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {s.companyName}
                        <span className="text-[11px] text-slate-400 block font-normal">
                          {s.email} · {s.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{s.planName}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-400">
                        {formatFCFA(s.priceMonthlyXof)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-semibold text-[11px] ${
                            s.subscriptionStatus === 'active'
                              ? 'text-emerald-400'
                              : s.subscriptionStatus === 'trial'
                              ? 'text-sky-400'
                              : s.subscriptionStatus === 'pending_payment'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {s.subscriptionStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {formatDateShort(s.renewsAt)}
                      </td>
                      <td className="px-4 py-3">
                        {s.isOverdue ? (
                          <span className="text-rose-400 font-semibold text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Impayé détecté
                          </span>
                        ) : (
                          <span className="text-slate-500">À jour</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. AUDIT LOGS TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Journaux d’Audit & Événements de Sécurité</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chaque action critique, consultation de données commerciales et changement de statut est horodaté et inaltérable.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {auditLogs.length} événements enregistrés
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono">
                    <tr>
                      <th className="px-4 py-3">Date & Heure</th>
                      <th className="px-4 py-3">Acteur</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Ressource</th>
                      <th className="px-4 py-3">Détails de l’opération</th>
                      <th className="px-4 py-3">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                          {formatDateFr(log.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-200 block">{log.actorName}</span>
                          <span className="text-[10px] text-slate-400 capitalize">{log.actorRole}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11px] text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 capitalize">
                          {log.targetResource}
                        </td>
                        <td className="px-4 py-3 text-slate-300 max-w-md">
                          {log.details}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 7. SETTINGS TAB */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-semibold text-sm text-slate-100">
                Politique d’Inscription et Validation
              </h3>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <span className="font-semibold text-xs text-slate-200 block">
                    Validation Automatique des Nouvelles Entreprises
                  </span>
                  <span className="text-xs text-slate-400">
                    Si désactivé, tout compte d’entreprise créé sera en attente d’approbation manuelle du Super Admin.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoApproveCompanies}
                  onChange={(e) =>
                    setSettings({ ...settings, autoApproveCompanies: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <span className="font-semibold text-xs text-slate-200 block">
                    Autoriser les Nouvelles Inscriptions Publiques
                  </span>
                  <span className="text-xs text-slate-400">
                    Permet aux nouvelles boutiques et commerces de créer leur compte depuis la page d’accueil.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowPublicRegistration}
                  onChange={(e) =>
                    setSettings({ ...settings, allowPublicRegistration: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail de Support Plateforme
                  </label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Téléphone Support / Assistance
                  </label>
                  <input
                    type="text"
                    value={settings.supportPhone}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Money Gateways Status */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-semibold text-sm text-slate-100">
                État des Passerelles de Paiement Mobile Money & Banques
              </h3>
              <p className="text-xs text-slate-400">
                Conformément aux règles de sécurité, les paiements marchands ne sont activés qu’avec des identifiants réels certifiés.
              </p>

              <div className="space-y-3">
                {settings.paymentGateways?.map((gw, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{gw.name}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            gw.isConfigured
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {gw.isConfigured ? 'Prêt en production' : 'Configuration requise'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{gw.statusNotice}</p>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Pays supportés : {gw.supportedCountries?.join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              Enregistrer les paramètres généraux
            </button>
          </form>
        )}
      </div>

      {/* INSPECT COMPANY MODAL (WITH MANDATORY AUDIT TRAIL LOGGING) */}
      {inspectCompanyId && inspectedCompanyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono text-emerald-400">
                  CONSULTATION ENCADRÉE PAR AUDIT DE SÉCURITÉ
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {inspectedCompanyData.company.name}
                </h3>
              </div>
              <button
                onClick={() => { setInspectCompanyId(null); setInspectedCompanyData(null); }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">Gérant</span>
                <span className="font-semibold text-white mt-1 block">{inspectedCompanyData.company.managerName}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">E-mail</span>
                <span className="font-semibold text-white mt-1 block truncate">{inspectedCompanyData.company.email}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">Téléphone</span>
                <span className="font-semibold text-white mt-1 block">{inspectedCompanyData.company.phone}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 block">Statut</span>
                <span className="font-semibold text-emerald-400 mt-1 block capitalize">{inspectedCompanyData.company.status}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 block font-semibold mb-1">
                Note de Sécurité et Confidentialité :
              </span>
              <p className="text-slate-300">
                Les mots de passe des employés et dirigeants sont strictement chiffrés par fonction cryptographique et ne sont jamais visibles en clair par l’administrateur général. Cette consultation a été consignée dans le journal d’audit officiel.
              </p>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-xs text-slate-300 uppercase font-mono tracking-wider mb-2">
                Équipe & Utilisateurs enregistrés ({inspectedCompanyData.staff?.length || 0})
              </h4>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg bg-slate-950">
                {inspectedCompanyData.staff?.map((u: any) => (
                  <div key={u.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-white">{u.fullName}</span>
                      <span className="text-slate-400 text-[11px] block">{u.email}</span>
                    </div>
                    <span className="font-mono text-emerald-400 text-[11px] bg-slate-900 px-2 py-0.5 rounded">
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-xs text-slate-300 uppercase font-mono tracking-wider mb-2">
                Dernières Commandes Commerciales ({inspectedCompanyData.recentOrders?.length || 0})
              </h4>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg bg-slate-950 max-h-48 overflow-y-auto">
                {inspectedCompanyData.recentOrders?.map((o: any) => (
                  <div key={o.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-200">#{o.orderNumber}</span>
                      <span className="text-slate-500 ml-2">{o.customerName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-400 font-semibold">{formatFCFA(o.totalXof)}</span>
                      <span className="text-[10px] text-slate-400 block capitalize">{o.orderStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => { setInspectCompanyId(null); setInspectedCompanyData(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg"
              >
                Fermer la consultation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE STATUS MODAL */}
      {statusModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 text-slate-100">
            <h3 className="text-base font-bold text-white mb-2">
              {targetStatus === 'active' && 'Valider ou Réactiver le compte'}
              {targetStatus === 'suspended' && 'Suspendre le compte entreprise'}
              {targetStatus === 'rejected' && 'Refuser la création du compte'}
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Entreprise concernée : <strong className="text-white">{selectedCompany.name}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Motif de la décision (consigné dans l’audit et notifié à l’entreprise)
                </label>
                <textarea
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Ex: Validation légale effectuée / Documents fiscaux manquants / Non-respect des conditions"
                  className="w-full p-2.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className={`px-4 py-2 text-xs font-semibold rounded-lg text-white shadow-sm ${
                  targetStatus === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-700 hover:bg-rose-600'
                }`}
              >
                Confirmer l’action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <form onSubmit={handleSavePlan} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">
              Modifier la formule : {editingPlan.name}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Prix Mensuel (en FCFA / XOF)
              </label>
              <input
                type="number"
                value={editingPlan.priceMonthlyXof}
                onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthlyXof: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Limite Produits
                </label>
                <input
                  type="number"
                  value={editingPlan.maxProducts}
                  onChange={(e) => setEditingPlan({ ...editingPlan, maxProducts: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Commission (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editingPlan.commissionPercent}
                  onChange={(e) => setEditingPlan({ ...editingPlan, commissionPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Max Points de Vente
                </label>
                <input
                  type="number"
                  value={editingPlan.maxPos}
                  onChange={(e) => setEditingPlan({ ...editingPlan, maxPos: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Max Utilisateurs
                </label>
                <input
                  type="number"
                  value={editingPlan.maxStaff}
                  onChange={(e) => setEditingPlan({ ...editingPlan, maxStaff: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="onlineStoreAllowed"
                checked={editingPlan.onlineStoreAllowed}
                onChange={(e) => setEditingPlan({ ...editingPlan, onlineStoreAllowed: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="onlineStoreAllowed" className="text-xs text-slate-300">
                Autoriser la boutique en ligne publique
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
