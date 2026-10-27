import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ActivityType } from '../../types/index.ts';
import { X, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { apiFetch } from '../../lib/api.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register_company' | 'register_client';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccess,
}) => {
  const { login, registerCompany, registerClient, quickLoginAs } = useAuth();
  const [tab, setTab] = useState<'login' | 'register_company' | 'register_client' | 'forgot_password'>(
    initialTab
  );

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Company registration state
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [country, setCountry] = useState('Sénégal');
  const [city, setCity] = useState('Dakar');
  const [address, setAddress] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('alimentation');
  const [compPassword, setCompPassword] = useState('');
  const [compPasswordConfirm, setCompPasswordConfirm] = useState('');
  const [acceptTermsComp, setAcceptTermsComp] = useState(false);

  // Client registration state
  const [clientFullName, setClientFullName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientPasswordConfirm, setClientPasswordConfirm] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [acceptTermsClient, setAcceptTermsClient] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [simulatedCode, setSimulatedCode] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Échec de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (compPassword !== compPasswordConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!acceptTermsComp) {
      setError('Veuillez accepter les conditions d’utilisation.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerCompany({
        companyName,
        tradeName,
        managerName,
        email: compEmail,
        phone: compPhone,
        country,
        city,
        address,
        activityType,
        password: compPassword,
        acceptTerms: acceptTermsComp,
      });

      if (res.status === 'pending') {
        setSuccessNotice('Votre compte a été enregistré ! Il est actuellement en attente de validation par l’administrateur général J-Market.');
      } else {
        setSuccessNotice('Votre compte professionnel a été créé et activé immédiatement !');
      }
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (clientPassword !== clientPasswordConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!acceptTermsClient) {
      setError('Veuillez accepter les conditions d’utilisation.');
      return;
    }

    setLoading(true);
    try {
      await registerClient({
        fullName: clientFullName,
        email: clientEmail,
        phone: clientPhone,
        password: clientPassword,
        deliveryAddress: clientAddress,
        acceptTerms: acceptTermsClient,
      });

      setSuccessNotice('Votre compte client a été créé avec succès !');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l’inscription client');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (forgotStep === 1) {
        const res = await apiFetch('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email: forgotEmail }),
        });
        if (res.simulatedCode) {
          setSimulatedCode(res.simulatedCode);
          setForgotCode(res.simulatedCode);
        }
        setSuccessNotice(res.message);
        setForgotStep(2);
      } else {
        await apiFetch('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({
            email: forgotEmail,
            code: forgotCode,
            newPassword,
          }),
        });
        setSuccessNotice('Votre mot de passe a été mis à jour avec succès. Veuillez vous connecter.');
        setTimeout(() => {
          setTab('login');
          setForgotStep(1);
          setSuccessNotice(null);
        }, 1800);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (preset: 'super_admin' | 'epicerie' | 'grille' | 'client') => {
    setLoading(true);
    setError(null);
    try {
      await quickLoginAs(preset);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erreur compte démo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-700 flex items-center justify-center text-white font-bold text-sm">
              J
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {tab === 'login' && 'Connexion à J-Market'}
              {tab === 'register_company' && 'Créer mon compte professionnel'}
              {tab === 'register_client' && 'Créer mon compte client'}
              {tab === 'forgot_password' && 'Récupération du mot de passe'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-600">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              tab === 'login'
                ? 'border-emerald-700 text-emerald-800 bg-white font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Se connecter
          </button>
          <button
            onClick={() => { setTab('register_company'); setError(null); }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              tab === 'register_company'
                ? 'border-emerald-700 text-emerald-800 bg-white font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Compte Professionnel
          </button>
          <button
            onClick={() => { setTab('register_client'); setError(null); }}
            className={`flex-1 py-3 text-center transition-colors border-b-2 ${
              tab === 'register_client'
                ? 'border-emerald-700 text-emerald-800 bg-white font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Compte Client
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* 1. LOGIN TAB */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => { setTab('forgot_password'); setError(null); }}
                    className="text-xs text-emerald-700 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick test accounts panel */}
              <div className="pt-4 border-t border-slate-200 mt-6">
                <span className="block text-xs font-medium text-slate-500 mb-2">
                  Comptes de test préconfigurés (Connexion 1-clic) :
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('super_admin')}
                    className="text-left p-2 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-white text-xs transition-all"
                  >
                    <span className="font-semibold block text-slate-900">Super Admin</span>
                    <span className="text-[11px] text-slate-500">Direction J-Market</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('epicerie')}
                    className="text-left p-2 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-white text-xs transition-all"
                  >
                    <span className="font-semibold block text-slate-900">Épicerie Dakar</span>
                    <span className="text-[11px] text-slate-500">Alimentation & Stock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('grille')}
                    className="text-left p-2 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-white text-xs transition-all"
                  >
                    <span className="font-semibold block text-slate-900">Afro-Grille Express</span>
                    <span className="text-[11px] text-slate-500">Restaurant Abidjan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('client')}
                    className="text-left p-2 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-white text-xs transition-all"
                  >
                    <span className="font-semibold block text-slate-900">Client Final</span>
                    <span className="text-[11px] text-slate-500">Awa Diallo</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. REGISTER COMPANY TAB */}
          {tab === 'register_company' && (
            <form onSubmit={handleRegisterCompany} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom de l’entreprise / boutique *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Marché Central"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom commercial / Enseigne
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Marché Central Express"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom et prénom du responsable *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mamadou Diallo"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type d’activité *
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as ActivityType)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="alimentation">Alimentation générale</option>
                    <option value="superette">Supérette</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="fast_food">Fast-food & Snack</option>
                    <option value="boutique">Boutique (Mode, Beauté, Déco)</option>
                    <option value="autre">Autre commerce</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse e-mail professionnelle *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contact@commerce.com"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numéro de téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+221 77 000 00 00"
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pays *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sénégal"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ville *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dakar"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse physique
                  </label>
                  <input
                    type="text"
                    placeholder="Quartier, Rue, N°"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 caractères"
                    value={compPassword}
                    onChange={(e) => setCompPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Confirmation"
                    value={compPasswordConfirm}
                    onChange={(e) => setCompPasswordConfirm(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={acceptTermsComp}
                    onChange={(e) => setAcceptTermsComp(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>
                    J’accepte les{' '}
                    <span className="font-semibold text-slate-800">
                      Conditions Générales d’Utilisation
                    </span>{' '}
                    et la politique de confidentialité de la plateforme J-Market.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? 'Création de votre espace...' : 'Créer mon compte professionnel'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 3. REGISTER CLIENT TAB */}
          {tab === 'register_client' && (
            <form onSubmit={handleRegisterClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom et prénom complet *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Awa Diop"
                  value={clientFullName}
                  onChange={(e) => setClientFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse e-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="awa.diop@gmail.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    placeholder="+221 77 123 45 67"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse de livraison (facultative lors de l’inscription)
                </label>
                <input
                  type="text"
                  placeholder="Quartier, Résidence, Appartement..."
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={clientPasswordConfirm}
                    onChange={(e) => setClientPasswordConfirm(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={acceptTermsClient}
                    onChange={(e) => setAcceptTermsClient(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>
                    J’accepte les conditions d’utilisation de J-Market pour commander auprès des commerces enregistrés.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? 'Création de votre compte...' : 'Créer mon compte client'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* 4. FORGOT PASSWORD TAB */}
          {tab === 'forgot_password' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-slate-700 text-xs mb-2">
                <KeyRound className="w-4 h-4 text-emerald-700" />
                <span>
                  {forgotStep === 1
                    ? 'Saisissez votre e-mail pour recevoir le code de réinitialisation sécurisé.'
                    : 'Saisissez le code de vérification reçu et votre nouveau mot de passe.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="nom@exemple.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {forgotStep === 2 && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Code de réinitialisation (6 chiffres)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123456"
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    {simulatedCode && (
                      <span className="text-[11px] text-emerald-700 mt-1 block">
                        Code de test généré : {simulatedCode}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Nouveau mot de passe sécurisé"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setForgotStep(1); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-lg"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-lg transition-colors shadow-sm disabled:opacity-60"
                >
                  {loading
                    ? 'Traitement...'
                    : forgotStep === 1
                    ? 'Recevoir le code'
                    : 'Valider le nouveau mot de passe'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
