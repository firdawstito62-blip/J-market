import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.ts';
import {
  hashPassword,
  verifyPassword,
  createSession,
  validateSession,
  destroySession,
  sanitizeUser,
} from './server/auth.ts';
import {
  User,
  UserRole,
  Company,
  CompanyStatus,
  Product,
  Category,
  Order,
  StockMovement,
  CashRegister,
  CashMovement,
  Supplier,
  Purchase,
  PosPoint,
  SubscriptionPlan,
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Express Request augmentation for authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

// -------------------------------------------------------------
// Authentication & RBAC Middlewares
// -------------------------------------------------------------
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès non autorisé : jeton de session manquant.' });
  }

  const token = authHeader.split(' ')[1];
  const session = validateSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.id === session.userId);
  if (!user || user.status !== 'active') {
    return res.status(403).json({ error: 'Compte désactivé ou introuvable.' });
  }

  req.user = sanitizeUser(user);
  req.token = token;
  next();
}

// Optional auth for public storefront checkout if user is logged in
function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = validateSession(token);
    if (session) {
      const users = db.get('users');
      const user = users.find((u) => u.id === session.userId);
      if (user && user.status === 'active') {
        req.user = sanitizeUser(user);
        req.token = token;
      }
    }
  }
  next();
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Accès refusé : privilèges Super Administrateur requis.' });
  }
  next();
}

function requireCompanyAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié.' });
  }

  // Super admin can access with audit logging
  if (req.user.role === 'super_admin') {
    return next();
  }

  if (!req.user.companyId) {
    return res.status(403).json({ error: 'Aucune entreprise rattachée à cet utilisateur.' });
  }

  // Check company status
  const companies = db.get('companies');
  const company = companies.find((c) => c.id === req.user!.companyId);
  if (!company) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }

  if (company.status === 'suspended') {
    return res.status(403).json({
      error: 'Votre entreprise est actuellement suspendue. Veuillez contacter l’administration J-Market.',
      status: 'suspended',
      reason: company.statusReason,
    });
  }

  if (company.status === 'rejected') {
    return res.status(403).json({
      error: 'La demande de création de votre entreprise a été refusée.',
      status: 'rejected',
      reason: company.statusReason,
    });
  }

  if (company.status === 'pending') {
    return res.status(403).json({
      error: 'Votre compte entreprise est en cours de validation par l’administrateur J-Market.',
      status: 'pending',
    });
  }

  next();
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Veuillez saisir votre e-mail et votre mot de passe.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }

  // Check if company is suspended/rejected/pending for company staff
  let companyData: Company | null = null;
  if (user.companyId) {
    const companies = db.get('companies');
    const comp = companies.find((c) => c.id === user.companyId);
    if (comp) {
      companyData = comp;
    }
  }

  // Update last login
  user.lastLoginAt = new Date().toISOString();
  db.save();

  const token = createSession({ id: user.id, role: user.role, companyId: user.companyId });
  const safeUser = sanitizeUser(user);

  db.logAudit({
    actorUserId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    action: 'USER_LOGIN',
    targetResource: 'auth',
    targetId: user.id,
    companyId: user.companyId || null,
    details: `Connexion réussie de l’utilisateur ${user.email} (${user.role})`,
    ipAddress: req.ip,
  });

  res.json({
    token,
    user: safeUser,
    company: companyData,
  });
});

app.post('/api/auth/register-company', (req: Request, res: Response) => {
  const {
    companyName,
    tradeName,
    managerName,
    email,
    phone,
    country,
    city,
    address,
    activityType,
    password,
    acceptTerms,
  } = req.body;

  if (!companyName || !managerName || !email || !phone || !activityType || !password) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' });
  }

  if (!acceptTerms) {
    return res.status(400).json({ error: 'Vous devez accepter les conditions générales d’utilisation.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 6 caractères.' });
  }

  const users = db.get('users');
  const companies = db.get('companies');
  const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (existingUser) {
    return res.status(400).json({ error: 'Cette adresse e-mail est déjà associée à un compte.' });
  }

  const baseSlug = companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  let slug = baseSlug || 'boutique';
  let counter = 1;
  while (companies.some((c) => c.slug === slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const platformSettings = db.get('platform_settings');
  const initialStatus: CompanyStatus = platformSettings.autoApproveCompanies ? 'active' : 'pending';

  const companyId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const posId = `pos_${Date.now()}_main`;

  const newCompany: Company = {
    id: companyId,
    slug,
    name: companyName.trim(),
    tradeName: tradeName?.trim() || companyName.trim(),
    managerName: managerName.trim(),
    email: email.toLowerCase().trim(),
    phone: phone.trim(),
    country: country?.trim() || 'Sénégal',
    city: city?.trim() || 'Dakar',
    address: address?.trim() || 'Non renseignée',
    activityType,
    status: initialStatus,
    subscriptionPlanId: 'plan_starter',
    subscriptionStatus: 'trial',
    subscriptionRenewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    currency: 'XOF',
    onlineStoreConfig: {
      enabled: true,
      slug,
      tagline: `Bienvenue chez ${companyName}`,
      description: `Boutique officielle de ${companyName}. Commandez en ligne et faites-vous livrer en toute sécurité.`,
      deliveryZones: [
        { name: 'Zone Principale', feeXof: 1500, minOrderXof: 3000, estTime: '30-60 min' },
      ],
      allowPickup: true,
      openingHours: 'Lun - Sam: 08h30 - 20h00',
      contactPhone: phone.trim(),
      minimumOrderXof: 3000,
      primaryColor: '#059669',
    },
    createdAt: new Date().toISOString(),
    approvedAt: initialStatus === 'active' ? new Date().toISOString() : undefined,
  };

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: userId,
    email: email.toLowerCase().trim(),
    passwordHash: hash,
    salt,
    fullName: managerName.trim(),
    phone: phone.trim(),
    role: 'company_admin' as UserRole,
    companyId,
    posId,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  };

  const newPos: PosPoint = {
    id: posId,
    companyId,
    name: 'Point de Vente Principal',
    address: address?.trim() || 'Siège principal',
    phone: phone.trim(),
    isDefault: true,
    createdAt: new Date().toISOString(),
  };

  // Seed default category
  const defaultCategory: Category = {
    id: `cat_${Date.now()}_def`,
    companyId,
    name: 'Général',
    slug: 'general',
    displayOrder: 1,
  };

  companies.push(newCompany);
  users.push(newUser);
  db.get('pos_points').push(newPos);
  db.get('categories').push(defaultCategory);
  db.save();

  db.logAudit({
    actorUserId: userId,
    actorName: managerName,
    actorRole: 'company_admin',
    action: 'REGISTER_COMPANY',
    targetResource: 'company',
    targetId: companyId,
    companyId,
    details: `Création du compte entreprise "${companyName}" (${activityType}) - Statut initial: ${initialStatus}`,
    ipAddress: req.ip,
  });

  const token = createSession({ id: userId, role: 'company_admin', companyId });

  res.status(201).json({
    message: initialStatus === 'active'
      ? 'Compte entreprise créé avec succès !'
      : 'Compte créé avec succès. Votre demande est en attente de validation par l’administrateur.',
    token,
    user: sanitizeUser(newUser),
    company: newCompany,
    status: initialStatus,
  });
});

app.post('/api/auth/register-client', (req: Request, res: Response) => {
  const { fullName, email, phone, password, deliveryAddress, acceptTerms } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Veuillez remplir votre nom, e-mail et mot de passe.' });
  }

  if (!acceptTerms) {
    return res.status(400).json({ error: 'Veuillez accepter les conditions d’utilisation.' });
  }

  const users = db.get('users');
  const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existingUser) {
    return res.status(400).json({ error: 'Cette adresse e-mail est déjà utilisée.' });
  }

  const userId = `usr_cl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const { hash, salt } = hashPassword(password);

  const newUser = {
    id: userId,
    email: email.toLowerCase().trim(),
    passwordHash: hash,
    salt,
    fullName: fullName.trim(),
    phone: phone?.trim() || '',
    role: 'client' as UserRole,
    deliveryAddress: deliveryAddress?.trim() || '',
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  db.save();

  db.logAudit({
    actorUserId: userId,
    actorName: fullName,
    actorRole: 'client',
    action: 'REGISTER_CLIENT',
    targetResource: 'user',
    targetId: userId,
    details: `Inscription d’un nouveau client : ${email}`,
    ipAddress: req.ip,
  });

  const token = createSession({ id: userId, role: 'client' });

  res.status(201).json({
    message: 'Compte client créé avec succès !',
    token,
    user: sanitizeUser(newUser),
  });
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  let companyData: Company | null = null;
  if (req.user?.companyId) {
    const companies = db.get('companies');
    companyData = companies.find((c) => c.id === req.user!.companyId) || null;
  }

  res.json({
    user: req.user,
    company: companyData,
  });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Veuillez renseigner votre adresse e-mail.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    // For security, do not disclose whether email exists
    return res.json({
      message: 'Si cette adresse correspond à un compte, un lien de réinitialisation sécurisé a été généré.',
      simulatedNotice: 'Pour cet environnement de démonstration, vous pouvez utiliser le mot de passe provisoire ou saisir un nouveau mot de passe directement.',
    });
  }

  // Generate demo reset token
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  (user as any).resetToken = resetCode;
  db.save();

  db.logAudit({
    actorUserId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    action: 'FORGOT_PASSWORD_REQUEST',
    targetResource: 'user',
    targetId: user.id,
    details: `Demande de récupération de mot de passe pour ${email}. Code généré : ${resetCode}`,
  });

  res.json({
    message: 'Instructions de réinitialisation envoyées.',
    simulatedCode: resetCode,
    notice: `Code de vérification sécurisé : ${resetCode}`,
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Paramètres manquants.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    return res.status(400).json({ error: 'Compte introuvable.' });
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  delete (user as any).resetToken;
  db.save();

  db.logAudit({
    actorUserId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    action: 'RESET_PASSWORD_SUCCESS',
    targetResource: 'user',
    targetId: user.id,
    details: `Mot de passe réinitialisé avec succès pour ${email}`,
  });

  res.json({ message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.' });
});

app.post('/api/auth/logout', authenticate, (req: Request, res: Response) => {
  if (req.token) {
    destroySession(req.token);
  }
  res.json({ message: 'Déconnexion effectuée.' });
});

// -------------------------------------------------------------
// SUPER ADMIN ROUTES (Strictly accessible by super_admin only)
// -------------------------------------------------------------
app.get('/api/super-admin/dashboard', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
  const companies = db.get('companies');
  const users = db.get('users');
  const orders = db.get('orders');
  const plans = db.get('subscription_plans');
  const auditLogs = db.get('audit_logs');

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.status === 'active').length;
  const pendingCompanies = companies.filter((c) => c.status === 'pending').length;
  const suspendedCompanies = companies.filter((c) => c.status === 'suspended').length;
  const activeOnlineStores = companies.filter((c) => c.status === 'active' && c.onlineStoreConfig?.enabled).length;

  const totalClients = users.filter((u) => u.role === 'client').length;
  const totalEmployees = users.filter((u) => u.role !== 'client' && u.role !== 'super_admin').length;

  const totalOrders = orders.length;
  const totalGMVXof = orders.reduce((acc, curr) => acc + (curr.totalXof || 0), 0);

  // Subscriptions summary
  const subscriptionsSummary = {
    trial: companies.filter((c) => c.subscriptionStatus === 'trial').length,
    active: companies.filter((c) => c.subscriptionStatus === 'active').length,
    pending_payment: companies.filter((c) => c.subscriptionStatus === 'pending_payment').length,
    suspended: companies.filter((c) => c.subscriptionStatus === 'suspended').length,
    estimatedMonthlyRevenueXof: companies.reduce((acc, c) => {
      const plan = plans.find((p) => p.id === c.subscriptionPlanId);
      return acc + (plan?.priceMonthlyXof || 0);
    }, 0),
  };

  res.json({
    overview: {
      totalCompanies,
      activeCompanies,
      pendingCompanies,
      suspendedCompanies,
      activeOnlineStores,
      totalClients,
      totalEmployees,
      totalOrders,
      totalGMVXof,
    },
    subscriptionsSummary,
    recentPendingCompanies: companies.filter((c) => c.status === 'pending').slice(0, 5),
    recentAuditLogs: auditLogs.slice(0, 8),
  });
});

app.get('/api/super-admin/companies', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
  const { status, activityType, search } = req.query;
  let list = db.get('companies');

  if (status && status !== 'all') {
    list = list.filter((c) => c.status === status);
  }
  if (activityType && activityType !== 'all') {
    list = list.filter((c) => c.activityType === activityType);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.managerName.toLowerCase().includes(q)
    );
  }

  // Count metrics
  const products = db.get('products');
  const orders = db.get('orders');
  const users = db.get('users');

  const enriched = list.map((c) => {
    const prodCount = products.filter((p) => p.companyId === c.id).length;
    const orderCount = orders.filter((o) => o.companyId === c.id).length;
    const staffCount = users.filter((u) => u.companyId === c.id).length;
    const revenueXof = orders.filter((o) => o.companyId === c.id).reduce((s, o) => s + o.totalXof, 0);

    return {
      ...c,
      productCount: prodCount,
      orderCount: orderCount,
      staffCount: staffCount,
      revenueXof,
    };
  });

  res.json({ companies: enriched });
});

// Access detailed company data - MANDATORY AUDIT LOG ENTRY AS PER REQUIREMENTS
app.get('/api/super-admin/companies/:id/details', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const companies = db.get('companies');
  const company = companies.find((c) => c.id === id);

  if (!company) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }

  // Record required audit log for commercial data inspection
  db.logAudit({
    actorUserId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: 'super_admin',
    action: 'AUDIT_COMPANY_COMMERCIAL_DATA',
    targetResource: 'company',
    targetId: company.id,
    companyId: company.id,
    details: `Consultation encadrée des informations commerciales complètes de l’entreprise "${company.name}"`,
    ipAddress: req.ip,
  });

  const products = db.get('products').filter((p) => p.companyId === id);
  const orders = db.get('orders').filter((o) => o.companyId === id);
  const staff = db.get('users').filter((u) => u.companyId === id).map(sanitizeUser);
  const plans = db.get('subscription_plans');
  const currentPlan = plans.find((p) => p.id === company.subscriptionPlanId);

  res.json({
    company,
    productsCount: products.length,
    ordersCount: orders.length,
    recentOrders: orders.slice(-10).reverse(),
    staff,
    currentPlan,
  });
});

app.post('/api/super-admin/companies/:id/status', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!['active', 'pending', 'suspended', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }

  const companies = db.get('companies');
  const company = companies.find((c) => c.id === id);

  if (!company) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }

  const previousStatus = company.status;
  company.status = status;
  company.statusReason = reason || undefined;
  if (status === 'active' && !company.approvedAt) {
    company.approvedAt = new Date().toISOString();
  }

  db.save();

  db.logAudit({
    actorUserId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: 'super_admin',
    action: `CHANGE_COMPANY_STATUS_${status.toUpperCase()}`,
    targetResource: 'company',
    targetId: company.id,
    companyId: company.id,
    details: `Changement de statut de l’entreprise "${company.name}" : ${previousStatus} -> ${status}. Motif : ${reason || 'Décision administrative'}`,
    ipAddress: req.ip,
  });

  res.json({
    message: `Le statut de l’entreprise a été mis à jour avec succès (${status}).`,
    company,
  });
});

app.get('/api/super-admin/plans', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
  res.json({ plans: db.get('subscription_plans') });
});

app.put('/api/super-admin/plans/:id', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, priceMonthlyXof, maxProducts, maxStaff, maxPos, onlineStoreAllowed, commissionPercent, description, features } = req.body;

  const plans = db.get('subscription_plans');
  const plan = plans.find((p) => p.id === id);

  if (!plan) {
    return res.status(404).json({ error: 'Formule d’abonnement introuvable.' });
  }

  if (name !== undefined) plan.name = name;
  if (priceMonthlyXof !== undefined) plan.priceMonthlyXof = Number(priceMonthlyXof);
  if (maxProducts !== undefined) plan.maxProducts = Number(maxProducts);
  if (maxStaff !== undefined) plan.maxStaff = Number(maxStaff);
  if (maxPos !== undefined) plan.maxPos = Number(maxPos);
  if (onlineStoreAllowed !== undefined) plan.onlineStoreAllowed = Boolean(onlineStoreAllowed);
  if (commissionPercent !== undefined) plan.commissionPercent = Number(commissionPercent);
  if (description !== undefined) plan.description = description;
  if (features !== undefined) plan.features = features;

  db.save();

  db.logAudit({
    actorUserId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: 'super_admin',
    action: 'UPDATE_SUBSCRIPTION_PLAN',
    targetResource: 'subscription_plan',
    targetId: plan.id,
    details: `Mise à jour des tarifs et conditions de la formule "${plan.name}"`,
    ipAddress: req.ip,
  });

  res.json({ message: 'Formule mise à jour avec succès.', plan });
});

app.get('/api/super-admin/subscriptions', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
  const companies = db.get('companies');
  const plans = db.get('subscription_plans');

  const list = companies.map((c) => {
    const plan = plans.find((p) => p.id === c.subscriptionPlanId);
    return {
      companyId: c.id,
      companyName: c.name,
      managerName: c.managerName,
      email: c.email,
      phone: c.phone,
      planName: plan?.name || 'Inconnu',
      priceMonthlyXof: plan?.priceMonthlyXof || 0,
      subscriptionStatus: c.subscriptionStatus,
      renewsAt: c.subscriptionRenewsAt,
      isOverdue: new Date(c.subscriptionRenewsAt).getTime() < Date.now() && c.subscriptionStatus !== 'active',
    };
  });

  res.json({ subscriptions: list });
});

app.get('/api/super-admin/audit-logs', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
  const { limit = 100 } = req.query;
  const logs = db.get('audit_logs');
  res.json({ auditLogs: logs.slice(0, Number(limit)) });
});

app.get('/api/super-admin/settings', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
  res.json({ settings: db.get('platform_settings') });
});

app.put('/api/super-admin/settings', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
  const current = db.get('platform_settings');
  const { autoApproveCompanies, allowPublicRegistration, supportEmail, supportPhone, paymentGateways } = req.body;

  if (autoApproveCompanies !== undefined) current.autoApproveCompanies = Boolean(autoApproveCompanies);
  if (allowPublicRegistration !== undefined) current.allowPublicRegistration = Boolean(allowPublicRegistration);
  if (supportEmail !== undefined) current.supportEmail = supportEmail;
  if (supportPhone !== undefined) current.supportPhone = supportPhone;
  if (paymentGateways !== undefined) current.paymentGateways = paymentGateways;

  db.save();

  db.logAudit({
    actorUserId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: 'super_admin',
    action: 'UPDATE_PLATFORM_SETTINGS',
    targetResource: 'platform_settings',
    details: 'Mise à jour des paramètres généraux de la plateforme J-Market',
    ipAddress: req.ip,
  });

  res.json({ message: 'Paramètres enregistrés avec succès.', settings: current });
});

app.get('/api/super-admin/users', authenticate, requireSuperAdmin, (req: Request, res: Response) => {
  const users = db.get('users').map(sanitizeUser);
  res.json({ users });
});

// -------------------------------------------------------------
// COMPANY / BOUTIQUE WORKSPACE ROUTES (Strict Tenant Isolation)
// -------------------------------------------------------------
app.get('/api/company/dashboard', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const orders = db.get('orders').filter((o) => o.companyId === companyId);
  const products = db.get('products').filter((p) => p.companyId === companyId);
  const customers = db.get('customers').filter((c) => c.companyId === companyId);
  const registers = db.get('cash_registers').filter((r) => r.companyId === companyId && r.status === 'open');

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr));
  const todaySalesXof = todayOrders.reduce((acc, o) => acc + (o.totalXof || 0), 0);

  const totalSalesXof = orders.reduce((acc, o) => acc + (o.totalXof || 0), 0);
  const pendingOrders = orders.filter((o) => ['received', 'preparing', 'ready', 'delivering'].includes(o.orderStatus));

  // Low stock products
  const lowStockAlerts = products.filter((p) => p.currentStock <= p.minStockAlert);

  res.json({
    metrics: {
      todaySalesXof,
      todayOrdersCount: todayOrders.length,
      totalSalesXof,
      totalOrdersCount: orders.length,
      totalProductsCount: products.length,
      lowStockCount: lowStockAlerts.length,
      totalCustomersCount: customers.length,
      hasOpenRegister: registers.length > 0,
      openRegisterId: registers[0]?.id || null,
    },
    lowStockAlerts: lowStockAlerts.slice(0, 5),
    recentOrders: orders.slice(-6).reverse(),
    pendingOrdersCount: pendingOrders.length,
  });
});

app.get('/api/company/profile', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const companies = db.get('companies');
  const company = companies.find((c) => c.id === companyId);
  const plans = db.get('subscription_plans');
  const plan = plans.find((p) => p.id === company?.subscriptionPlanId);

  res.json({ company, plan });
});

app.put('/api/company/profile', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const companies = db.get('companies');
  const company = companies.find((c) => c.id === companyId);

  if (!company) {
    return res.status(404).json({ error: 'Entreprise introuvable.' });
  }

  const {
    name,
    tradeName,
    phone,
    address,
    city,
    country,
    activityType,
    onlineStoreConfig,
  } = req.body;

  if (name) company.name = name;
  if (tradeName !== undefined) company.tradeName = tradeName;
  if (phone) company.phone = phone;
  if (address) company.address = address;
  if (city) company.city = city;
  if (country) company.country = country;
  if (activityType) company.activityType = activityType;

  if (onlineStoreConfig) {
    company.onlineStoreConfig = {
      ...company.onlineStoreConfig,
      ...onlineStoreConfig,
    };
  }

  db.save();

  db.logAudit({
    actorUserId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: req.user!.role,
    action: 'UPDATE_COMPANY_PROFILE',
    targetResource: 'company',
    targetId: companyId,
    companyId,
    details: 'Mise à jour du profil et des paramètres de la boutique',
    ipAddress: req.ip,
  });

  res.json({ message: 'Profil d’entreprise mis à jour avec succès.', company });
});

// Products CRUD
app.get('/api/company/products', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const products = db.get('products').filter((p) => p.companyId === companyId);
  const categories = db.get('categories').filter((c) => c.companyId === companyId);
  res.json({ products, categories });
});

app.post('/api/company/products', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const {
    name,
    categoryId,
    sku,
    barcode,
    description,
    priceXof,
    costPriceXof,
    currentStock,
    minStockAlert,
    unit,
    imageUrl,
    isAvailableOnline,
    isFeatured,
  } = req.body;

  if (!name || priceXof === undefined) {
    return res.status(400).json({ error: 'Le nom et le prix de vente sont obligatoires.' });
  }

  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const initialStock = Number(currentStock) || 0;

  const newProduct: Product = {
    id,
    companyId,
    categoryId: categoryId || 'cat_default',
    name: name.trim(),
    slug: `${baseSlug}-${id.slice(-4)}`,
    sku: sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`,
    barcode: barcode?.trim() || '',
    description: description?.trim() || '',
    priceXof: Number(priceXof),
    costPriceXof: Number(costPriceXof) || 0,
    currentStock: initialStock,
    minStockAlert: Number(minStockAlert) || 5,
    unit: unit?.trim() || 'unité',
    imageUrl: imageUrl || '/src/assets/images/hero_jmarket_retail_1793091813856.jpg',
    isAvailableOnline: Boolean(isAvailableOnline),
    isFeatured: Boolean(isFeatured),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const products = db.get('products');
  products.push(newProduct);

  // If initial stock was entered, log movement
  if (initialStock > 0) {
    const movements = db.get('stock_movements');
    movements.push({
      id: `stk_${Date.now()}`,
      companyId,
      productId: id,
      productName: newProduct.name,
      type: 'in',
      quantity: initialStock,
      previousStock: 0,
      newStock: initialStock,
      reference: 'INIT-STOCK',
      notes: 'Stock initial à la création du produit',
      createdByUserId: req.user!.id,
      createdByName: req.user!.fullName,
      createdAt: new Date().toISOString(),
    });
  }

  db.save();

  res.status(201).json({ message: 'Produit créé avec succès.', product: newProduct });
});

app.put('/api/company/products/:id', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { id } = req.params;
  const products = db.get('products');
  const product = products.find((p) => p.id === id && p.companyId === companyId);

  if (!product) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }

  const {
    name,
    categoryId,
    sku,
    barcode,
    description,
    priceXof,
    costPriceXof,
    minStockAlert,
    unit,
    imageUrl,
    isAvailableOnline,
    isFeatured,
  } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (categoryId !== undefined) product.categoryId = categoryId;
  if (sku !== undefined) product.sku = sku.trim();
  if (barcode !== undefined) product.barcode = barcode.trim();
  if (description !== undefined) product.description = description.trim();
  if (priceXof !== undefined) product.priceXof = Number(priceXof);
  if (costPriceXof !== undefined) product.costPriceXof = Number(costPriceXof);
  if (minStockAlert !== undefined) product.minStockAlert = Number(minStockAlert);
  if (unit !== undefined) product.unit = unit.trim();
  if (imageUrl !== undefined) product.imageUrl = imageUrl;
  if (isAvailableOnline !== undefined) product.isAvailableOnline = Boolean(isAvailableOnline);
  if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
  product.updatedAt = new Date().toISOString();

  db.save();
  res.json({ message: 'Produit mis à jour avec succès.', product });
});

app.delete('/api/company/products/:id', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { id } = req.params;
  const products = db.get('products');
  const index = products.findIndex((p) => p.id === id && p.companyId === companyId);

  if (index === -1) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }

  const removed = products.splice(index, 1)[0];
  db.save();

  res.json({ message: `Le produit "${removed.name}" a été supprimé.` });
});

// Categories CRUD
app.get('/api/company/categories', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const categories = db.get('categories').filter((c) => c.companyId === companyId);
  res.json({ categories });
});

app.post('/api/company/categories', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Le nom de la catégorie est obligatoire.' });
  }

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const newCat: Category = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId,
    name: name.trim(),
    slug,
    description: description?.trim() || '',
    displayOrder: 1,
  };

  db.get('categories').push(newCat);
  db.save();

  res.status(201).json({ category: newCat });
});

// Stocks Movements
app.get('/api/company/stocks/movements', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const movements = db.get('stock_movements').filter((m) => m.companyId === companyId);
  res.json({ movements: movements.slice(-50).reverse() });
});

app.post('/api/company/stocks/adjust', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { productId, type, quantity, reference, notes } = req.body;

  const products = db.get('products');
  const product = products.find((p) => p.id === productId && p.companyId === companyId);

  if (!product) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }

  const qty = Number(quantity);
  if (!qty || qty <= 0) {
    return res.status(400).json({ error: 'La quantité doit être supérieure à zéro.' });
  }

  const prev = product.currentStock;
  let next = prev;

  if (type === 'in' || type === 'return') {
    next = prev + qty;
  } else if (type === 'out' || type === 'sale') {
    if (prev < qty) {
      return res.status(400).json({ error: `Stock insuffisant (stock actuel : ${prev}).` });
    }
    next = prev - qty;
  } else if (type === 'adjustment') {
    next = qty; // direct adjustment to new count
  }

  product.currentStock = next;
  product.updatedAt = new Date().toISOString();

  const movements = db.get('stock_movements');
  const mov: StockMovement = {
    id: `stk_${Date.now()}`,
    companyId,
    productId,
    productName: product.name,
    type,
    quantity: type === 'out' || type === 'sale' ? -qty : qty,
    previousStock: prev,
    newStock: next,
    reference: reference || 'AJUST-MANUEL',
    notes,
    createdByUserId: req.user!.id,
    createdByName: req.user!.fullName,
    createdAt: new Date().toISOString(),
  };

  movements.push(mov);
  db.save();

  res.json({ message: 'Stock mis à jour avec succès.', product, movement: mov });
});

// POS & Caisse
app.get('/api/company/pos/status', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const registers = db.get('cash_registers').filter((r) => r.companyId === companyId && r.status === 'open');
  const points = db.get('pos_points').filter((p) => p.companyId === companyId);
  res.json({
    activeRegister: registers[0] || null,
    points,
  });
});

app.post('/api/company/pos/open-register', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { posId, openingBalanceXof } = req.body;

  const registers = db.get('cash_registers');
  const existingOpen = registers.find((r) => r.companyId === companyId && r.status === 'open');
  if (existingOpen) {
    return res.status(400).json({ error: 'Une session de caisse est déjà ouverte pour cette entreprise.' });
  }

  const points = db.get('pos_points').filter((p) => p.companyId === companyId);
  const pos = points.find((p) => p.id === posId) || points[0];

  const openingFloat = Number(openingBalanceXof) || 0;
  const newRegister: CashRegister = {
    id: `csh_${Date.now()}`,
    companyId,
    posId: pos?.id || 'pos_main',
    posName: pos?.name || 'Caisse Principale',
    cashierUserId: req.user!.id,
    cashierName: req.user!.fullName,
    openedAt: new Date().toISOString(),
    openingBalanceXof: openingFloat,
    totalCashInXof: 0,
    totalCashOutXof: 0,
    systemCalculatedBalanceXof: openingFloat,
    status: 'open',
  };

  registers.push(newRegister);
  db.save();

  db.logAudit({
    actorUserId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: req.user!.role,
    action: 'OPEN_CASH_REGISTER',
    targetResource: 'cash_register',
    targetId: newRegister.id,
    companyId,
    details: `Ouverture de caisse avec un fond initial de ${openingFloat} FCFA par ${req.user!.fullName}`,
    ipAddress: req.ip,
  });

  res.json({ message: 'Session de caisse ouverte.', register: newRegister });
});

app.post('/api/company/pos/close-register', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { registerId, closingCountedBalanceXof, notes } = req.body;

  const registers = db.get('cash_registers');
  const register = registers.find((r) => r.id === registerId && r.companyId === companyId && r.status === 'open');

  if (!register) {
    return res.status(404).json({ error: 'Session de caisse introuvable ou déjà fermée.' });
  }

  const counted = Number(closingCountedBalanceXof) || 0;
  const discrepancy = counted - register.systemCalculatedBalanceXof;

  register.status = 'closed';
  register.closedAt = new Date().toISOString();
  register.closingBalanceXof = counted;
  register.discrepancyXof = discrepancy;
  register.notes = notes;

  db.save();

  db.logAudit({
    actorUserId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: req.user!.role,
    action: 'CLOSE_CASH_REGISTER',
    targetResource: 'cash_register',
    targetId: register.id,
    companyId,
    details: `Clôture de caisse : théorique ${register.systemCalculatedBalanceXof} FCFA, compté ${counted} FCFA, écart : ${discrepancy} FCFA`,
    ipAddress: req.ip,
  });

  res.json({ message: 'Caisse clôturée avec succès.', register });
});

app.post('/api/company/pos/cash-movement', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { registerId, type, amountXof, reason } = req.body;

  const registers = db.get('cash_registers');
  const register = registers.find((r) => r.id === registerId && r.companyId === companyId && r.status === 'open');

  if (!register) {
    return res.status(400).json({ error: 'Caisse ouverte introuvable.' });
  }

  const amount = Number(amountXof);
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Montant invalide.' });
  }

  if (type === 'in') {
    register.totalCashInXof += amount;
    register.systemCalculatedBalanceXof += amount;
  } else {
    register.totalCashOutXof += amount;
    register.systemCalculatedBalanceXof -= amount;
  }

  const movements = db.get('cash_movements');
  const movement: CashMovement = {
    id: `mov_${Date.now()}`,
    cashRegisterId: register.id,
    companyId,
    type,
    amountXof: amount,
    reason: reason || 'Mouvement de caisse',
    createdByUserId: req.user!.id,
    createdAt: new Date().toISOString(),
  };

  movements.push(movement);
  db.save();

  res.json({ message: 'Mouvement enregistré.', register, movement });
});

// POS Checkout
app.post('/api/company/pos/sale', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { items, paymentMethod, customerName, customerPhone } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Le panier est vide.' });
  }

  const products = db.get('products');
  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId && p.companyId === companyId);
    if (!product) {
      return res.status(400).json({ error: `Produit introuvable : ${item.productId}` });
    }
    if (product.currentStock < item.quantity) {
      return res.status(400).json({ error: `Stock insuffisant pour "${product.name}" (stock restant: ${product.currentStock})` });
    }

    const itemTotal = product.priceXof * item.quantity;
    subtotal += itemTotal;
    orderItems.push({
      productId: product.id,
      productName: product.name,
      unitPriceXof: product.priceXof,
      quantity: item.quantity,
      totalXof: itemTotal,
    });

    // Deduct stock
    product.currentStock -= item.quantity;
  }

  const companies = db.get('companies');
  const comp = companies.find((c) => c.id === companyId);

  const orderId = `ord_pos_${Date.now()}`;
  const orderNumber = `POS-${Date.now().toString().slice(-6)}`;

  const order: Order = {
    id: orderId,
    orderNumber,
    companyId,
    companyName: comp?.name || 'Boutique',
    customerName: customerName || 'Client Comptoir',
    customerPhone: customerPhone || '',
    deliveryMethod: 'pickup',
    deliveryFeeXof: 0,
    items: orderItems,
    subtotalXof: subtotal,
    totalXof: subtotal,
    paymentMethod: paymentMethod || 'cod',
    paymentStatus: 'paid',
    orderStatus: 'completed',
    channel: 'pos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.get('orders').push(order);

  // If cash and register open, update register
  if (paymentMethod === 'cod') {
    const registers = db.get('cash_registers');
    const openReg = registers.find((r) => r.companyId === companyId && r.status === 'open');
    if (openReg) {
      openReg.totalCashInXof += subtotal;
      openReg.systemCalculatedBalanceXof += subtotal;
    }
  }

  db.save();

  res.status(201).json({ message: 'Vente enregistrée avec succès.', order });
});

// Company Orders management
app.get('/api/company/orders', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { status, channel } = req.query;
  let orders = db.get('orders').filter((o) => o.companyId === companyId);

  if (status && status !== 'all') {
    orders = orders.filter((o) => o.orderStatus === status);
  }
  if (channel && channel !== 'all') {
    orders = orders.filter((o) => o.channel === channel);
  }

  res.json({ orders: orders.reverse() });
});

app.put('/api/company/orders/:id/status', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { id } = req.params;
  const { orderStatus, paymentStatus } = req.body;

  const orders = db.get('orders');
  const order = orders.find((o) => o.id === id && o.companyId === companyId);

  if (!order) {
    return res.status(404).json({ error: 'Commande introuvable.' });
  }

  if (orderStatus) order.orderStatus = orderStatus;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  order.updatedAt = new Date().toISOString();

  db.save();

  db.logAudit({
    actorUserId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: req.user!.role,
    action: 'UPDATE_ORDER_STATUS',
    targetResource: 'order',
    targetId: order.id,
    companyId,
    details: `Mise à jour commande ${order.orderNumber} : statut = ${order.orderStatus}, paiement = ${order.paymentStatus}`,
  });

  res.json({ message: 'Statut de commande mis à jour.', order });
});

// Staff management
app.get('/api/company/staff', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const users = db.get('users').filter((u) => u.companyId === companyId).map(sanitizeUser);
  const posPoints = db.get('pos_points').filter((p) => p.companyId === companyId);
  res.json({ staff: users, posPoints });
});

app.post('/api/company/staff', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { fullName, email, phone, role, posId, password } = req.body;

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' });
  }

  const validRoles: UserRole[] = ['company_admin', 'store_manager', 'cashier', 'stock_manager', 'employee'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide.' });
  }

  const users = db.get('users');
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
    return res.status(400).json({ error: 'Cette adresse e-mail est déjà utilisée.' });
  }

  const { hash, salt } = hashPassword(password);
  const newStaff = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: email.toLowerCase().trim(),
    passwordHash: hash,
    salt,
    fullName: fullName.trim(),
    phone: phone?.trim() || '',
    role,
    companyId,
    posId: posId || undefined,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  };

  users.push(newStaff);
  db.save();

  db.logAudit({
    actorUserId: req.user!.id,
    actorName: req.user!.fullName,
    actorRole: req.user!.role,
    action: 'CREATE_STAFF_MEMBER',
    targetResource: 'user',
    targetId: newStaff.id,
    companyId,
    details: `Création du compte employé "${fullName}" (${role}) par ${req.user!.fullName}`,
  });

  res.status(201).json({ message: 'Employé ajouté avec succès.', staff: sanitizeUser(newStaff) });
});

// Points of sale
app.get('/api/company/pos-points', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const points = db.get('pos_points').filter((p) => p.companyId === companyId);
  res.json({ points });
});

app.post('/api/company/pos-points', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { name, address, phone } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Le nom du point de vente est requis.' });
  }

  const newPos: PosPoint = {
    id: `pos_${Date.now()}`,
    companyId,
    name: name.trim(),
    address: address?.trim() || '',
    phone: phone?.trim() || '',
    isDefault: false,
    createdAt: new Date().toISOString(),
  };

  db.get('pos_points').push(newPos);
  db.save();

  res.status(201).json({ point: newPos });
});

// Suppliers & Purchases
app.get('/api/company/suppliers', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const suppliers = db.get('suppliers').filter((s) => s.companyId === companyId);
  const purchases = db.get('purchases').filter((p) => p.companyId === companyId);
  res.json({ suppliers, purchases });
});

app.post('/api/company/suppliers', authenticate, requireCompanyAccess, (req: Request, res: Response) => {
  const companyId = req.user!.companyId!;
  const { name, contactPerson, email, phone, address, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Le nom du fournisseur est obligatoire.' });
  }

  const supplier: Supplier = {
    id: `sup_${Date.now()}`,
    companyId,
    name: name.trim(),
    contactPerson: contactPerson?.trim() || '',
    email: email?.trim() || '',
    phone: phone?.trim() || '',
    address: address?.trim() || '',
    notes: notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  db.get('suppliers').push(supplier);
  db.save();

  res.status(201).json({ supplier });
});

// -------------------------------------------------------------
// PUBLIC MARKETPLACE & ONLINE STOREFRONT ROUTES
// -------------------------------------------------------------
app.get('/api/public/stores', (req: Request, res: Response) => {
  const { activityType, search } = req.query;
  const companies = db.get('companies').filter((c) => c.status === 'active' && c.onlineStoreConfig?.enabled);

  let results = companies;
  if (activityType && activityType !== 'all') {
    results = results.filter((c) => c.activityType === activityType);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.onlineStoreConfig?.tagline && c.onlineStoreConfig.tagline.toLowerCase().includes(q))
    );
  }

  const products = db.get('products');

  const publicStores = results.map((c) => {
    const storeProds = products.filter((p) => p.companyId === c.id && p.isAvailableOnline);
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      tradeName: c.tradeName,
      city: c.city,
      country: c.country,
      address: c.address,
      activityType: c.activityType,
      config: c.onlineStoreConfig,
      productCount: storeProds.length,
    };
  });

  res.json({ stores: publicStores });
});

app.get('/api/public/stores/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const companies = db.get('companies');
  const company = companies.find((c) => c.slug === slug || c.id === slug);

  if (!company || company.status !== 'active') {
    return res.status(404).json({ error: 'Boutique introuvable ou actuellement indisponible.' });
  }

  const products = db.get('products').filter((p) => p.companyId === company.id && p.isAvailableOnline);
  const categories = db.get('categories').filter((c) => c.companyId === company.id);

  res.json({
    store: {
      id: company.id,
      slug: company.slug,
      name: company.name,
      tradeName: company.tradeName,
      city: company.city,
      country: company.country,
      address: company.address,
      phone: company.phone,
      activityType: company.activityType,
      config: company.onlineStoreConfig,
    },
    products,
    categories,
  });
});

app.get('/api/public/products', (req: Request, res: Response) => {
  const { search, category, storeId, maxPrice } = req.query;
  const activeCompanyIds = new Set(
    db.get('companies').filter((c) => c.status === 'active' && c.onlineStoreConfig?.enabled).map((c) => c.id)
  );

  let list = db.get('products').filter((p) => p.isAvailableOnline && activeCompanyIds.has(p.companyId));
  const companies = db.get('companies');

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  if (storeId) {
    list = list.filter((p) => p.companyId === storeId);
  }
  if (maxPrice) {
    list = list.filter((p) => p.priceXof <= Number(maxPrice));
  }

  const enriched = list.map((p) => {
    const comp = companies.find((c) => c.id === p.companyId);
    return {
      ...p,
      companyName: comp?.name || 'Boutique J-Market',
      companySlug: comp?.slug || '',
      companyCity: comp?.city || '',
    };
  });

  res.json({ products: enriched });
});

// -------------------------------------------------------------
// CLIENT FINAL PORTAL ROUTES
// -------------------------------------------------------------
app.get('/api/client/orders', authenticate, (req: Request, res: Response) => {
  if (req.user!.role !== 'client') {
    // If not client, they might be accessing their own purchases
  }

  const orders = db.get('orders').filter((o) => o.customerId === req.user!.id || o.customerEmail === req.user!.email);
  res.json({ orders: orders.reverse() });
});

app.post('/api/client/orders/create', optionalAuthenticate, (req: Request, res: Response) => {
  const {
    companyId,
    items,
    deliveryMethod,
    deliveryAddress,
    deliveryZoneName,
    paymentMethod,
    customerName,
    customerPhone,
    customerEmail,
    notes,
  } = req.body;

  if (!companyId || !items || !items.length) {
    return res.status(400).json({ error: 'Informations de commande incomplètes.' });
  }

  const companies = db.get('companies');
  const company = companies.find((c) => c.id === companyId);
  if (!company || company.status !== 'active') {
    return res.status(400).json({ error: 'Boutique introuvable ou fermée.' });
  }

  const products = db.get('products');
  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId && p.companyId === companyId);
    if (!product) {
      return res.status(400).json({ error: `Produit indisponible : ${item.productId}` });
    }
    if (product.currentStock < item.quantity) {
      return res.status(400).json({ error: `Désolé, il ne reste que ${product.currentStock} unités pour "${product.name}".` });
    }

    const itemTotal = product.priceXof * item.quantity;
    subtotal += itemTotal;
    orderItems.push({
      productId: product.id,
      productName: product.name,
      unitPriceXof: product.priceXof,
      quantity: item.quantity,
      totalXof: itemTotal,
    });

    // Reduce stock
    product.currentStock -= item.quantity;
  }

  // Delivery fee calculation
  let deliveryFee = 0;
  if (deliveryMethod === 'delivery') {
    const zone = company.onlineStoreConfig?.deliveryZones?.find((z) => z.name === deliveryZoneName);
    deliveryFee = zone ? zone.feeXof : 1500;
  }

  const total = subtotal + deliveryFee;
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const orderNumber = `JM-${Date.now().toString().slice(-5)}`;

  // Payment status
  // Wave / OM simulates payment reception in demo; cod is unpaid until delivery
  const isPaidDirectly = ['wave', 'orange_money'].includes(paymentMethod);

  const order: Order = {
    id: orderId,
    orderNumber,
    companyId,
    companyName: company.name,
    customerId: req.user?.id || null,
    customerName: customerName || req.user?.fullName || 'Client',
    customerPhone: customerPhone || req.user?.phone || '',
    customerEmail: customerEmail || req.user?.email || '',
    deliveryMethod: deliveryMethod || 'delivery',
    deliveryAddress: deliveryAddress || '',
    deliveryZoneName: deliveryZoneName || '',
    deliveryFeeXof: deliveryFee,
    items: orderItems,
    subtotalXof: subtotal,
    totalXof: total,
    paymentMethod: paymentMethod || 'cod',
    paymentStatus: isPaidDirectly ? 'paid' : 'unpaid',
    orderStatus: 'received',
    channel: 'online_store',
    notes: notes?.trim() || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.get('orders').push(order);

  // Link to company customers table
  const customers = db.get('customers');
  let existingCust = customers.find((c) => c.companyId === companyId && c.email === (customerEmail || req.user?.email));
  if (!existingCust && (customerEmail || customerPhone)) {
    customers.push({
      id: `cust_${Date.now()}`,
      companyId,
      fullName: customerName || req.user?.fullName || 'Client',
      email: customerEmail || req.user?.email || '',
      phone: customerPhone || req.user?.phone || '',
      address: deliveryAddress || '',
      totalOrders: 1,
      totalSpentXof: total,
      createdAt: new Date().toISOString(),
    });
  } else if (existingCust) {
    existingCust.totalOrders += 1;
    existingCust.totalSpentXof += total;
  }

  db.save();

  db.logAudit({
    actorUserId: req.user?.id || 'guest',
    actorName: customerName || 'Client en ligne',
    actorRole: (req.user?.role as UserRole) || 'client',
    action: 'PLACE_ONLINE_ORDER',
    targetResource: 'order',
    targetId: order.id,
    companyId,
    details: `Nouvelle commande en ligne ${order.orderNumber} pour un montant total de ${total} FCFA (${order.paymentMethod})`,
  });

  res.status(201).json({
    message: 'Votre commande a été transmise à la boutique !',
    order,
  });
});

app.put('/api/client/profile', authenticate, (req: Request, res: Response) => {
  const { fullName, phone, deliveryAddress } = req.body;
  const users = db.get('users');
  const user = users.find((u) => u.id === req.user!.id);

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable.' });
  }

  if (fullName) user.fullName = fullName.trim();
  if (phone) user.phone = phone.trim();
  if (deliveryAddress !== undefined) user.deliveryAddress = deliveryAddress.trim();

  db.save();
  res.json({ message: 'Profil mis à jour.', user: sanitizeUser(user) });
});

// -------------------------------------------------------------
// VITE DEV SERVER OR PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`J-Market Server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
