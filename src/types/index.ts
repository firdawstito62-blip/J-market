/**
 * Shared Type Definitions for J-Market SaaS Platform
 */

export type UserRole = 
  | 'super_admin'
  | 'company_admin'
  | 'store_manager'
  | 'cashier'
  | 'stock_manager'
  | 'employee'
  | 'client';

export type CompanyStatus = 'active' | 'pending' | 'suspended' | 'rejected';

export type ActivityType = 
  | 'boutique'
  | 'alimentation'
  | 'superette'
  | 'restaurant'
  | 'fast_food'
  | 'autre';

export type SubscriptionStatus = 'trial' | 'active' | 'pending_payment' | 'expired' | 'suspended';

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivering' | 'completed' | 'cancelled';

export type PaymentMethod = 'cod' | 'wave' | 'orange_money' | 'mtn_momo' | 'card';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type DeliveryMethod = 'pickup' | 'delivery';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  companyId?: string | null;
  posId?: string | null;
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  createdAt: string;
  lastLoginAt?: string;
  deliveryAddress?: string;
}

export interface DeliveryZone {
  name: string;
  feeXof: number;
  minOrderXof: number;
  estTime: string;
}

export interface OnlineStoreConfig {
  enabled: boolean;
  slug: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  deliveryZones: DeliveryZone[];
  allowPickup: boolean;
  openingHours: string;
  contactWhatsapp?: string;
  contactPhone?: string;
  minimumOrderXof: number;
  primaryColor?: string;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  tradeName?: string;
  managerName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  activityType: ActivityType;
  status: CompanyStatus;
  statusReason?: string;
  subscriptionPlanId: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionRenewsAt: string;
  currency: string;
  onlineStoreConfig: OnlineStoreConfig;
  createdAt: string;
  approvedAt?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthlyXof: number;
  maxProducts: number;
  maxStaff: number;
  maxPos: number;
  onlineStoreAllowed: boolean;
  commissionPercent: number;
  description: string;
  features: string[];
}

export interface PosPoint {
  id: string;
  companyId: string;
  name: string;
  address: string;
  phone: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
}

export interface Product {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  description: string;
  priceXof: number;
  costPriceXof: number;
  currentStock: number;
  minStockAlert: number;
  unit: string; // e.g. "unité", "kg", "portion", "bouteille"
  imageUrl?: string;
  isAvailableOnline: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'sale' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference: string;
  notes?: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unitPriceXof: number;
  quantity: number;
  totalXof: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  companyId: string;
  companyName: string;
  posId?: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  deliveryZoneName?: string;
  deliveryFeeXof: number;
  items: OrderItem[];
  subtotalXof: number;
  totalXof: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes?: string;
  channel: 'pos' | 'online_store';
  createdAt: string;
  updatedAt: string;
}

export interface CashRegister {
  id: string;
  companyId: string;
  posId: string;
  posName: string;
  cashierUserId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingBalanceXof: number;
  closingBalanceXof?: number;
  totalCashInXof: number;
  totalCashOutXof: number;
  systemCalculatedBalanceXof: number;
  discrepancyXof?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface CashMovement {
  id: string;
  cashRegisterId: string;
  companyId: string;
  type: 'in' | 'out';
  amountXof: number;
  reason: string;
  createdByUserId: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  companyId?: string | null;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpentXof: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  unitCostXof: number;
  quantity: number;
  totalXof: number;
}

export interface Purchase {
  id: string;
  companyId: string;
  supplierId: string;
  supplierName: string;
  purchaseNumber: string;
  items: PurchaseItem[];
  totalAmountXof: number;
  status: 'pending' | 'received' | 'cancelled';
  receivedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetResource: string;
  targetId?: string;
  companyId?: string | null;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface PaymentGatewayConfig {
  provider: 'wave' | 'orange_money' | 'mtn_momo' | 'stripe';
  name: string;
  isConfigured: boolean;
  statusNotice: string;
  supportedCountries: string[];
}

export interface PlatformSettings {
  autoApproveCompanies: boolean;
  allowPublicRegistration: boolean;
  defaultCurrency: string;
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  paymentGateways: PaymentGatewayConfig[];
}
