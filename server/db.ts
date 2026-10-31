import fs from 'fs';
import path from 'path';
import { hashPassword } from './auth.ts';
import {
  User,
  Company,
  SubscriptionPlan,
  PosPoint,
  Category,
  Product,
  StockMovement,
  Order,
  CashRegister,
  CashMovement,
  Customer,
  Supplier,
  Purchase,
  AuditLog,
  PlatformSettings,
} from '../src/types/index.ts';

export interface DatabaseSchema {
  users: Array<User & { passwordHash: string; salt: string }>;
  companies: Company[];
  subscription_plans: SubscriptionPlan[];
  pos_points: PosPoint[];
  categories: Category[];
  products: Product[];
  stock_movements: StockMovement[];
  orders: Order[];
  cash_registers: CashRegister[];
  cash_movements: CashMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: Purchase[];
  audit_logs: AuditLog[];
  platform_settings: PlatformSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'jmarket_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialSeedData(): DatabaseSchema {
  const adminPass = hashPassword('Admin@2026!');
  const storePass = hashPassword('Store@2026!');
  const clientPass = hashPassword('Client@2026!');

  const plans: SubscriptionPlan[] = [
    {
      id: 'plan_starter',
      name: 'Starter Commerçant',
      slug: 'starter',
      priceMonthlyXof: 15000,
      maxProducts: 100,
      maxStaff: 2,
      maxPos: 1,
      onlineStoreAllowed: true,
      commissionPercent: 2.5,
      description: 'Idéal pour petites boutiques, alimentations de quartier et fast-foods en démarrage.',
      features: [
        'Jusqu’à 100 produits & gestion des stocks',
        'Caisse enregistreuse tactile (POS)',
        '1 Boutique en ligne avec URL personnalisée',
        '2 comptes employés & rôles',
        'Support client standard',
      ],
    },
    {
      id: 'plan_pro',
      name: 'Business Pro',
      slug: 'pro',
      priceMonthlyXof: 35000,
      maxProducts: 1000,
      maxStaff: 10,
      maxPos: 3,
      onlineStoreAllowed: true,
      commissionPercent: 1.5,
      description: 'Pour supérettes, restaurants établis et boutiques multi-caisses.',
      features: [
        'Jusqu’à 1 000 produits & alertes de stock',
        'Gestion multi-points de vente (jusqu’à 3)',
        'Boutique en ligne avec zones et frais de livraison',
        'Gestion des fournisseurs et commandes d’achat',
        'Rapports financiers avancés et export comptable',
        'Gestion des rôles (caissiers, stock, gérants)',
      ],
    },
    {
      id: 'plan_enterprise',
      name: 'Entreprise & Réseau',
      slug: 'enterprise',
      priceMonthlyXof: 75000,
      maxProducts: 10000,
      maxStaff: 50,
      maxPos: 15,
      onlineStoreAllowed: true,
      commissionPercent: 0.8,
      description: 'Pour chaînes de magasins, grands supermarchés et franchises.',
      features: [
        'Produits illimités & multi-magasins',
        'Jusqu’à 15 points de vente interconnectés',
        'Accès API et intégration ERP sur mesure',
        'Commissions réduites à 0.8%',
        'Gestionnaire de compte dédié & SLA prioritaire',
      ],
    },
  ];

  const companies: Company[] = [
    {
      id: 'comp_epicerie_dakar',
      slug: 'epicerie-fine-dakar',
      name: "L'Épicerie Fine Dakar",
      tradeName: "L'Épicerie Terroir & Fraîcheur",
      managerName: 'Amadou Fall',
      email: 'dakar@jmarket.africa',
      phone: '+221 77 452 90 12',
      country: 'Sénégal',
      city: 'Dakar',
      address: 'Route des Almadies, Lot 4B, Dakar',
      activityType: 'alimentation',
      status: 'active',
      subscriptionPlanId: 'plan_pro',
      subscriptionStatus: 'active',
      subscriptionRenewsAt: '2026-12-31T00:00:00Z',
      currency: 'XOF',
      onlineStoreConfig: {
        enabled: true,
        slug: 'epicerie-fine-dakar',
        tagline: 'Produits du terroir sénégalais, alimentation saine et épicerie fine',
        description: 'Retrouvez nos sélections de fruits frais, jus naturels de bissap & bouye, riz de la vallée, miels purs et produits importés de qualité supérieure.',
        logoUrl: '/src/assets/images/store_cover_alimentation_1793091814524.jpg',
        bannerUrl: '/src/assets/images/store_cover_alimentation_1793091814524.jpg',
        deliveryZones: [
          { name: 'Almadies & Ngor', feeXof: 1500, minOrderXof: 5000, estTime: '30-45 min' },
          { name: 'Mermoz, Ouakam & Fann', feeXof: 2000, minOrderXof: 7500, estTime: '45-60 min' },
          { name: 'Plateau & Centre-ville', feeXof: 2500, minOrderXof: 10000, estTime: '45-75 min' },
        ],
        allowPickup: true,
        openingHours: 'Lun - Sam: 08h00 - 21h30 | Dim: 09h00 - 18h00',
        contactWhatsapp: '+221 77 452 90 12',
        contactPhone: '+221 33 820 44 11',
        minimumOrderXof: 5000,
        primaryColor: '#059669',
      },
      createdAt: '2026-08-10T09:00:00Z',
      approvedAt: '2026-08-10T10:15:00Z',
    },
    {
      id: 'comp_afro_grille',
      slug: 'afro-grille-express',
      name: 'Afro-Grille Express',
      tradeName: 'Afro-Grille Cocody',
      managerName: 'Kouassi Konan',
      email: 'grille@jmarket.africa',
      phone: '+225 07 88 44 22 10',
      country: "Côte d'Ivoire",
      city: 'Abidjan',
      address: 'Boulevard de France, Cocody Angré 8ème Tranche',
      activityType: 'restaurant',
      status: 'active',
      subscriptionPlanId: 'plan_pro',
      subscriptionStatus: 'active',
      subscriptionRenewsAt: '2026-11-28T00:00:00Z',
      currency: 'XOF',
      onlineStoreConfig: {
        enabled: true,
        slug: 'afro-grille-express',
        tagline: 'Grillades au feu de bois, brochettes artisanales et spécialités africaines',
        description: 'Viandes savoureuses marinées aux épices locales, poulet braisé croustillant, alloco doré, attiéké frais et sauces maison.',
        logoUrl: '/src/assets/images/store_cover_restaurant_1793091815739.jpg',
        bannerUrl: '/src/assets/images/store_cover_restaurant_1793091815739.jpg',
        deliveryZones: [
          { name: 'Cocody & Angré', feeXof: 1000, minOrderXof: 3500, estTime: '25-40 min' },
          { name: 'Plateau & Marcory', feeXof: 2000, minOrderXof: 6000, estTime: '40-60 min' },
          { name: 'Riviera & Bonoumin', feeXof: 1500, minOrderXof: 4500, estTime: '30-45 min' },
        ],
        allowPickup: true,
        openingHours: 'Tous les jours: 11h30 - 23h30',
        contactWhatsapp: '+225 07 88 44 22 10',
        contactPhone: '+225 27 22 45 88 90',
        minimumOrderXof: 3500,
        primaryColor: '#d97706',
      },
      createdAt: '2026-09-01T14:20:00Z',
      approvedAt: '2026-09-01T16:00:00Z',
    },
    {
      id: 'comp_maison_aurora',
      slug: 'maison-aurora-abidjan',
      name: 'Maison Aurora Concept',
      tradeName: 'Aurora Lifestyle & Prêt-à-Porter',
      managerName: 'Sarah Diop',
      email: 'aurora@jmarket.africa',
      phone: '+225 05 55 12 34 56',
      country: "Côte d'Ivoire",
      city: 'Abidjan',
      address: 'Zone 4, Rue du Commerce, Abidjan',
      activityType: 'boutique',
      status: 'active',
      subscriptionPlanId: 'plan_starter',
      subscriptionStatus: 'active',
      subscriptionRenewsAt: '2026-11-15T00:00:00Z',
      currency: 'XOF',
      onlineStoreConfig: {
        enabled: true,
        slug: 'maison-aurora-abidjan',
        tagline: 'Mode contemporaine, lin noble et accessoires faits main',
        description: 'Collections intemporelles de vêtements en lin, maroquinerie d’art et parfums d’ambiance.',
        logoUrl: '/src/assets/images/store_cover_fashion_1793091814643.jpg',
        bannerUrl: '/src/assets/images/store_cover_fashion_1793091814643.jpg',
        deliveryZones: [
          { name: 'Abidjan Sud (Zone 4, Biétry, Marcory)', feeXof: 1500, minOrderXof: 15000, estTime: '2-4 heures' },
          { name: 'Abidjan Nord (Cocody, Deux Plateaux)', feeXof: 2500, minOrderXof: 20000, estTime: 'Même jour' },
        ],
        allowPickup: true,
        openingHours: 'Mar - Sam: 10h00 - 19h30',
        contactWhatsapp: '+225 05 55 12 34 56',
        minimumOrderXof: 15000,
        primaryColor: '#4f46e5',
      },
      createdAt: '2026-09-15T11:00:00Z',
      approvedAt: '2026-09-15T12:00:00Z',
    },
    {
      id: 'comp_superette_bonchoix',
      slug: 'superette-le-bon-choix',
      name: 'Supérette Le Bon Choix',
      managerName: 'Ibrahim Touré',
      email: 'bonchoix@jmarket.africa',
      phone: '+223 76 11 22 33',
      country: 'Mali',
      city: 'Bamako',
      address: 'Hamdallaye ACI 2000, Bamako',
      activityType: 'superette',
      status: 'pending',
      subscriptionPlanId: 'plan_starter',
      subscriptionStatus: 'trial',
      subscriptionRenewsAt: '2026-11-10T00:00:00Z',
      currency: 'XOF',
      onlineStoreConfig: {
        enabled: false,
        slug: 'superette-le-bon-choix',
        deliveryZones: [],
        allowPickup: true,
        openingHours: '08h00 - 22h00',
        minimumOrderXof: 3000,
      },
      createdAt: '2026-10-25T16:40:00Z',
    },
    {
      id: 'comp_boutique_oasis',
      slug: 'boutique-oasis-lome',
      name: 'Boutique Oasis Lomé',
      managerName: 'Koffi Mensah',
      email: 'oasis@jmarket.africa',
      phone: '+228 90 22 33 44',
      country: 'Togo',
      city: 'Lomé',
      address: 'Grand Marché, Lomé',
      activityType: 'boutique',
      status: 'suspended',
      statusReason: 'Documents fiscaux en attente de renouvellement',
      subscriptionPlanId: 'plan_starter',
      subscriptionStatus: 'suspended',
      subscriptionRenewsAt: '2026-10-01T00:00:00Z',
      currency: 'XOF',
      onlineStoreConfig: {
        enabled: false,
        slug: 'boutique-oasis-lome',
        deliveryZones: [],
        allowPickup: false,
        openingHours: '08h30 - 18h00',
        minimumOrderXof: 5000,
      },
      createdAt: '2026-07-12T10:00:00Z',
    },
  ];

  const users: Array<User & { passwordHash: string; salt: string }> = [
    {
      id: 'usr_super_admin',
      email: 'admin@jmarket.africa',
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      fullName: 'Directeur Général J-Market',
      phone: '+221 78 000 00 01',
      role: 'super_admin',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: '2026-10-27T08:30:00Z',
    },
    {
      id: 'usr_super_admin_firdaws',
      email: 'firdawstito62@gmail.com',
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      fullName: 'Firdaws Administrateur',
      phone: '+221 78 000 00 00',
      role: 'super_admin',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: '2026-10-31T09:45:00Z',
    },
    {
      id: 'usr_admin_epicerie',
      email: 'dakar@jmarket.africa',
      passwordHash: storePass.hash,
      salt: storePass.salt,
      fullName: 'Amadou Fall',
      phone: '+221 77 452 90 12',
      role: 'company_admin',
      companyId: 'comp_epicerie_dakar',
      status: 'active',
      createdAt: '2026-08-10T09:00:00Z',
      lastLoginAt: '2026-10-26T17:40:00Z',
    },
    {
      id: 'usr_cashier_epicerie',
      email: 'caisse1@jmarket.africa',
      passwordHash: storePass.hash,
      salt: storePass.salt,
      fullName: 'Fatou Ndiaye',
      phone: '+221 77 123 45 67',
      role: 'cashier',
      companyId: 'comp_epicerie_dakar',
      posId: 'pos_epicerie_main',
      status: 'active',
      createdAt: '2026-08-12T10:00:00Z',
    },
    {
      id: 'usr_admin_grille',
      email: 'grille@jmarket.africa',
      passwordHash: storePass.hash,
      salt: storePass.salt,
      fullName: 'Kouassi Konan',
      phone: '+225 07 88 44 22 10',
      role: 'company_admin',
      companyId: 'comp_afro_grille',
      status: 'active',
      createdAt: '2026-09-01T14:20:00Z',
    },
    {
      id: 'usr_client_default',
      email: 'client@jmarket.africa',
      passwordHash: clientPass.hash,
      salt: clientPass.salt,
      fullName: 'Awa Diallo',
      phone: '+221 76 543 21 00',
      role: 'client',
      deliveryAddress: 'Cité Keur Gorgui, Immeuble A, Appartement 302, Dakar',
      status: 'active',
      createdAt: '2026-09-10T11:00:00Z',
      lastLoginAt: '2026-10-26T20:15:00Z',
    },
  ];

  const pos_points: PosPoint[] = [
    {
      id: 'pos_epicerie_main',
      companyId: 'comp_epicerie_dakar',
      name: 'Caisse Principale Almadies',
      address: 'Route des Almadies, Dakar',
      phone: '+221 77 452 90 12',
      isDefault: true,
      createdAt: '2026-08-10T10:00:00Z',
    },
    {
      id: 'pos_grille_main',
      companyId: 'comp_afro_grille',
      name: 'Comptoir Angré 8ème Tranche',
      address: 'Boulevard de France, Cocody Angré',
      phone: '+225 07 88 44 22 10',
      isDefault: true,
      createdAt: '2026-09-01T15:00:00Z',
    },
  ];

  const categories: Category[] = [
    // Epicerie Dakar
    { id: 'cat_fruits', companyId: 'comp_epicerie_dakar', name: 'Fruits & Légumes Frais', slug: 'fruits-legumes', displayOrder: 1 },
    { id: 'cat_epicerie_salee', companyId: 'comp_epicerie_dakar', name: 'Épicerie Salée & Terroir', slug: 'epicerie-salee', displayOrder: 2 },
    { id: 'cat_boissons', companyId: 'comp_epicerie_dakar', name: 'Jus Naturels & Boissons', slug: 'boissons', displayOrder: 3 },
    { id: 'cat_laiterie', companyId: 'comp_epicerie_dakar', name: 'Produits Laitiers & Fromages', slug: 'laiterie', displayOrder: 4 },
    
    // Afro Grille
    { id: 'cat_grillades', companyId: 'comp_afro_grille', name: 'Grillades Signature', slug: 'grillades-signature', displayOrder: 1 },
    { id: 'cat_accompagnements', companyId: 'comp_afro_grille', name: 'Accompagnements Chauds', slug: 'accompagnements', displayOrder: 2 },
    { id: 'cat_boissons_grille', companyId: 'comp_afro_grille', name: 'Boissons Fraîches & Mocktails', slug: 'boissons-fraiches', displayOrder: 3 },

    // Maison Aurora
    { id: 'cat_vetements', companyId: 'comp_maison_aurora', name: 'Prêt-à-Porter Lin & Coton', slug: 'pret-a-porter', displayOrder: 1 },
    { id: 'cat_accessoires', companyId: 'comp_maison_aurora', name: 'Accessoires & Maroquinerie', slug: 'accessoires', displayOrder: 2 },
  ];

  const products: Product[] = [
    // L'Epicerie Fine Dakar
    {
      id: 'prod_ep_1',
      companyId: 'comp_epicerie_dakar',
      categoryId: 'cat_fruits',
      name: 'Mangues Kent du Sénégal (Panier 2kg)',
      slug: 'mangues-kent-senegal-2kg',
      sku: 'EP-FRU-001',
      barcode: '60420000101',
      description: 'Mangues Kent parfumées et juteuses, cueillies à maturité dans la région des Niayes.',
      priceXof: 3500,
      costPriceXof: 2100,
      currentStock: 45,
      minStockAlert: 10,
      unit: 'panier',
      imageUrl: '/src/assets/images/store_cover_alimentation_1793091814524.jpg',
      isAvailableOnline: true,
      isFeatured: true,
      createdAt: '2026-08-15T08:00:00Z',
      updatedAt: '2026-10-26T14:00:00Z',
    },
    {
      id: 'prod_ep_2',
      companyId: 'comp_epicerie_dakar',
      categoryId: 'cat_epicerie_salee',
      name: 'Riz Parfumé de la Vallée du Fleuve (Sac 5kg)',
      slug: 'riz-parfume-vallee-5kg',
      sku: 'EP-RIZ-005',
      barcode: '60420000102',
      description: 'Riz blanc local de première qualité, grains longs et parfum subtil, naturellement riche.',
      priceXof: 4800,
      costPriceXof: 3600,
      currentStock: 80,
      minStockAlert: 15,
      unit: 'sac',
      imageUrl: '/src/assets/images/store_cover_alimentation_1793091814524.jpg',
      isAvailableOnline: true,
      isFeatured: true,
      createdAt: '2026-08-15T08:30:00Z',
      updatedAt: '2026-10-25T11:00:00Z',
    },
    {
      id: 'prod_ep_3',
      companyId: 'comp_epicerie_dakar',
      categoryId: 'cat_boissons',
      name: 'Jus de Bissap Artisanal à la Menthe (1L)',
      slug: 'jus-bissap-artisanal-menthe-1l',
      sku: 'EP-BOI-003',
      barcode: '60420000103',
      description: 'Fleurs d’hibiscus bio infusées avec de la menthe fraîche et une touche légère de sucre de canne.',
      priceXof: 1800,
      costPriceXof: 900,
      currentStock: 32,
      minStockAlert: 8,
      unit: 'bouteille',
      imageUrl: '/src/assets/images/hero_jmarket_retail_1793091813856.jpg',
      isAvailableOnline: true,
      isFeatured: true,
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-10-26T09:00:00Z',
    },
    {
      id: 'prod_ep_4',
      companyId: 'comp_epicerie_dakar',
      categoryId: 'cat_laiterie',
      name: 'Fromage de Chèvre Fermier Frais (250g)',
      slug: 'fromage-chevre-fermier-250g',
      sku: 'EP-LAI-004',
      barcode: '60420000104',
      description: 'Élaboré artisanalement par une ferme agro-écologique de Mbour. Doux et crémeux.',
      priceXof: 4200,
      costPriceXof: 2800,
      currentStock: 12,
      minStockAlert: 5,
      unit: 'pièce',
      imageUrl: '/src/assets/images/store_cover_alimentation_1793091814524.jpg',
      isAvailableOnline: true,
      isFeatured: false,
      createdAt: '2026-09-01T12:00:00Z',
      updatedAt: '2026-10-24T16:00:00Z',
    },

    // Afro-Grille Express
    {
      id: 'prod_gr_1',
      companyId: 'comp_afro_grille',
      categoryId: 'cat_grillades',
      name: 'Plateau Dibi d’Agneau Braisé Spécialité (500g)',
      slug: 'plateau-dibi-agneau-500g',
      sku: 'GR-DIB-001',
      description: 'Tendres morceaux d’agneau grillés au feu de bois avec oignons caramélisés et moutarde aux épices.',
      priceXof: 6500,
      costPriceXof: 3600,
      currentStock: 50,
      minStockAlert: 10,
      unit: 'portion',
      imageUrl: '/src/assets/images/store_cover_restaurant_1793091815739.jpg',
      isAvailableOnline: true,
      isFeatured: true,
      createdAt: '2026-09-02T10:00:00Z',
      updatedAt: '2026-10-26T18:00:00Z',
    },
    {
      id: 'prod_gr_2',
      companyId: 'comp_afro_grille',
      categoryId: 'cat_grillades',
      name: 'Poulet Braisé Entier Assaisonné aux Épices de Grand-Bassam',
      slug: 'poulet-braise-entier-bassam',
      sku: 'GR-POU-002',
      description: 'Poulet fermier mariné 24h, chair tendre et peau dorée croustillante, servi avec piment vert.',
      priceXof: 8500,
      costPriceXof: 4800,
      currentStock: 35,
      minStockAlert: 8,
      unit: 'pièce',
      imageUrl: '/src/assets/images/store_cover_restaurant_1793091815739.jpg',
      isAvailableOnline: true,
      isFeatured: true,
      createdAt: '2026-09-02T10:30:00Z',
      updatedAt: '2026-10-26T18:30:00Z',
    },
    {
      id: 'prod_gr_3',
      companyId: 'comp_afro_grille',
      categoryId: 'cat_accompagnements',
      name: 'Alloco Croustillant Banane Plantain & Sauce Tomate',
      slug: 'alloco-croustillant-banane-plantain',
      sku: 'GR-ACC-003',
      description: 'Bananes plantains mûres frites à point, dorées et fondantes à l’intérieur.',
      priceXof: 1500,
      costPriceXof: 600,
      currentStock: 100,
      minStockAlert: 20,
      unit: 'portion',
      imageUrl: '/src/assets/images/store_cover_restaurant_1793091815739.jpg',
      isAvailableOnline: true,
      isFeatured: false,
      createdAt: '2026-09-05T11:00:00Z',
      updatedAt: '2026-10-26T12:00:00Z',
    },

    // Maison Aurora
    {
      id: 'prod_au_1',
      companyId: 'comp_maison_aurora',
      categoryId: 'cat_vetements',
      name: 'Chemise Saharienne en Lin Naturel Écru',
      slug: 'chemise-saharienne-lin-ecru',
      sku: 'AU-LIN-001',
      barcode: '60430000201',
      description: 'Lin 100% respirant d’origine éthique, coupe droite contemporaine, boutons en corne recyclée.',
      priceXof: 32000,
      costPriceXof: 16500,
      currentStock: 18,
      minStockAlert: 4,
      unit: 'pièce',
      imageUrl: '/src/assets/images/store_cover_fashion_1793091814643.jpg',
      isAvailableOnline: true,
      isFeatured: true,
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-10-25T15:00:00Z',
    },
    {
      id: 'prod_au_2',
      companyId: 'comp_maison_aurora',
      categoryId: 'cat_accessoires',
      name: 'Sac Cabas en Cuir Pleine Fleur Artisanat d’Abidjan',
      slug: 'sac-cabas-cuir-pleine-fleur',
      sku: 'AU-SAC-002',
      barcode: '60430000202',
      description: 'Maroquinerie d’art, finitions main soignées, double anse renforcée pour usage quotidien.',
      priceXof: 58000,
      costPriceXof: 31000,
      currentStock: 7,
      minStockAlert: 2,
      unit: 'pièce',
      imageUrl: '/src/assets/images/store_cover_fashion_1793091814643.jpg',
      isAvailableOnline: true,
      isFeatured: true,
      createdAt: '2026-09-22T14:00:00Z',
      updatedAt: '2026-10-26T16:00:00Z',
    },
  ];

  const stock_movements: StockMovement[] = [
    {
      id: 'stk_mov_1',
      companyId: 'comp_epicerie_dakar',
      productId: 'prod_ep_1',
      productName: 'Mangues Kent du Sénégal (Panier 2kg)',
      type: 'in',
      quantity: 50,
      previousStock: 0,
      newStock: 50,
      reference: 'RECEPT-2026-08',
      notes: 'Livraison hebdomadaire vergers des Niayes',
      createdByUserId: 'usr_admin_epicerie',
      createdByName: 'Amadou Fall',
      createdAt: '2026-08-15T08:00:00Z',
    },
    {
      id: 'stk_mov_2',
      companyId: 'comp_epicerie_dakar',
      productId: 'prod_ep_1',
      productName: 'Mangues Kent du Sénégal (Panier 2kg)',
      type: 'sale',
      quantity: -5,
      previousStock: 50,
      newStock: 45,
      reference: 'CMD-JM-2601',
      notes: 'Vente en ligne client',
      createdByUserId: 'usr_cashier_epicerie',
      createdByName: 'Fatou Ndiaye',
      createdAt: '2026-10-26T14:10:00Z',
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord_2601',
      orderNumber: 'JM-2601',
      companyId: 'comp_epicerie_dakar',
      companyName: "L'Épicerie Fine Dakar",
      posId: 'pos_epicerie_main',
      customerId: 'usr_client_default',
      customerName: 'Awa Diallo',
      customerPhone: '+221 76 543 21 00',
      customerEmail: 'client@jmarket.africa',
      deliveryMethod: 'delivery',
      deliveryAddress: 'Cité Keur Gorgui, Immeuble A, Appartement 302, Dakar',
      deliveryZoneName: 'Mermoz, Ouakam & Fann',
      deliveryFeeXof: 2000,
      items: [
        { productId: 'prod_ep_1', productName: 'Mangues Kent du Sénégal (Panier 2kg)', unitPriceXof: 3500, quantity: 2, totalXof: 7000 },
        { productId: 'prod_ep_3', productName: 'Jus de Bissap Artisanal à la Menthe (1L)', unitPriceXof: 1800, quantity: 2, totalXof: 3600 },
      ],
      subtotalXof: 10600,
      totalXof: 12600,
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      channel: 'online_store',
      notes: 'Appeler à l’arrivée devant l’immeuble',
      createdAt: '2026-10-26T13:45:00Z',
      updatedAt: '2026-10-26T15:00:00Z',
    },
    {
      id: 'ord_2602',
      orderNumber: 'JM-2602',
      companyId: 'comp_afro_grille',
      companyName: 'Afro-Grille Express',
      posId: 'pos_grille_main',
      customerId: 'usr_client_default',
      customerName: 'Awa Diallo',
      customerPhone: '+221 76 543 21 00',
      customerEmail: 'client@jmarket.africa',
      deliveryMethod: 'delivery',
      deliveryAddress: 'Cocody Riviera 2, Villa 45, Abidjan',
      deliveryZoneName: 'Riviera & Bonoumin',
      deliveryFeeXof: 1500,
      items: [
        { productId: 'prod_gr_1', productName: 'Plateau Dibi d’Agneau Braisé Spécialité (500g)', unitPriceXof: 6500, quantity: 1, totalXof: 6500 },
        { productId: 'prod_gr_3', productName: 'Alloco Croustillant Banane Plantain & Sauce Tomate', unitPriceXof: 1500, quantity: 2, totalXof: 3000 },
      ],
      subtotalXof: 9500,
      totalXof: 11000,
      paymentMethod: 'wave',
      paymentStatus: 'paid',
      orderStatus: 'preparing',
      channel: 'online_store',
      notes: 'Piment très modéré s’il vous plaît',
      createdAt: '2026-10-27T01:30:00Z',
      updatedAt: '2026-10-27T01:35:00Z',
    },
  ];

  const cash_registers: CashRegister[] = [
    {
      id: 'csh_reg_1',
      companyId: 'comp_epicerie_dakar',
      posId: 'pos_epicerie_main',
      posName: 'Caisse Principale Almadies',
      cashierUserId: 'usr_cashier_epicerie',
      cashierName: 'Fatou Ndiaye',
      openedAt: '2026-10-27T08:00:00Z',
      openingBalanceXof: 50000,
      totalCashInXof: 64500,
      totalCashOutXof: 5000,
      systemCalculatedBalanceXof: 109500,
      status: 'open',
    },
  ];

  const cash_movements: CashMovement[] = [
    {
      id: 'csh_mov_1',
      cashRegisterId: 'csh_reg_1',
      companyId: 'comp_epicerie_dakar',
      type: 'out',
      amountXof: 5000,
      reason: 'Achat sacs biodégradables de dépannage',
      createdByUserId: 'usr_cashier_epicerie',
      createdAt: '2026-10-27T10:15:00Z',
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cust_awa',
      companyId: 'comp_epicerie_dakar',
      fullName: 'Awa Diallo',
      email: 'client@jmarket.africa',
      phone: '+221 76 543 21 00',
      address: 'Cité Keur Gorgui, Immeuble A, Appartement 302, Dakar',
      totalOrders: 3,
      totalSpentXof: 45200,
      createdAt: '2026-09-10T11:00:00Z',
    },
    {
      id: 'cust_moussa',
      companyId: 'comp_epicerie_dakar',
      fullName: 'Moussa Sène',
      email: 'moussa.sene@gmail.com',
      phone: '+221 77 333 44 55',
      address: 'Fann Résidence, Villa 12, Dakar',
      totalOrders: 1,
      totalSpentXof: 18500,
      createdAt: '2026-10-01T15:00:00Z',
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: 'sup_niayes',
      companyId: 'comp_epicerie_dakar',
      name: 'Coopérative Maraîchère des Niayes',
      contactPerson: 'Babacar Guèye',
      email: 'coop.niayes@agri.sn',
      phone: '+221 77 600 11 22',
      address: 'Zone Agro-écologique de Mboro',
      notes: 'Livraisons mardi et vendredi matin',
      createdAt: '2026-08-11T09:00:00Z',
    },
  ];

  const purchases: Purchase[] = [
    {
      id: 'pur_01',
      companyId: 'comp_epicerie_dakar',
      supplierId: 'sup_niayes',
      supplierName: 'Coopérative Maraîchère des Niayes',
      purchaseNumber: 'BA-2026-004',
      items: [
        { productId: 'prod_ep_1', productName: 'Mangues Kent du Sénégal (Panier 2kg)', unitCostXof: 2100, quantity: 50, totalXof: 105000 },
      ],
      totalAmountXof: 105000,
      status: 'received',
      receivedAt: '2026-08-15T08:00:00Z',
      createdAt: '2026-08-14T16:00:00Z',
    },
  ];

  const audit_logs: AuditLog[] = [
    {
      id: 'log_01',
      actorUserId: 'usr_super_admin',
      actorName: 'Directeur Général J-Market',
      actorRole: 'super_admin',
      action: 'APPROVE_COMPANY',
      targetResource: 'company',
      targetId: 'comp_epicerie_dakar',
      companyId: 'comp_epicerie_dakar',
      details: 'Validation et activation du compte professionnel "L’Épicerie Fine Dakar"',
      ipAddress: '197.149.230.12',
      timestamp: '2026-08-10T10:15:00Z',
    },
    {
      id: 'log_02',
      actorUserId: 'usr_super_admin',
      actorName: 'Directeur Général J-Market',
      actorRole: 'super_admin',
      action: 'SUSPEND_COMPANY',
      targetResource: 'company',
      targetId: 'comp_boutique_oasis',
      companyId: 'comp_boutique_oasis',
      details: 'Suspension temporaire pour documents fiscaux non conformes',
      ipAddress: '197.149.230.12',
      timestamp: '2026-10-01T09:00:00Z',
    },
  ];

  const platform_settings: PlatformSettings = {
    autoApproveCompanies: false, // By default manual approval by Super Admin is required!
    allowPublicRegistration: true,
    defaultCurrency: 'XOF',
    platformName: 'J-Market',
    supportEmail: 'contact@jmarket.africa',
    supportPhone: '+221 33 800 00 00',
    paymentGateways: [
      {
        provider: 'wave',
        name: 'Wave Money Sénégal & Côte d’Ivoire',
        isConfigured: true,
        statusNotice: 'Passerelle API configurée en environnement de production directe. Prêt pour les encaissements mobiles.',
        supportedCountries: ['Sénégal', "Côte d'Ivoire", 'Bénin'],
      },
      {
        provider: 'orange_money',
        name: 'Orange Money WebPay',
        isConfigured: true,
        statusNotice: 'Intégration marchande Orange Money vérifiée. Permet les paiements USSD et QR.',
        supportedCountries: ['Sénégal', "Côte d'Ivoire", 'Mali', 'Guinée', 'Burkina Faso'],
      },
      {
        provider: 'mtn_momo',
        name: 'MTN Mobile Money (MoMo)',
        isConfigured: false,
        statusNotice: 'Clés API marchandes en cours de validation auprès de l’opérateur MTN. Statut: Configuration requise.',
        supportedCountries: ["Côte d'Ivoire", 'Bénin', 'Cameroun'],
      },
    ],
  };

  return {
    users,
    companies,
    subscription_plans: plans,
    pos_points,
    categories,
    products,
    stock_movements,
    orders,
    cash_registers,
    cash_movements,
    customers,
    suppliers,
    purchases,
    audit_logs,
    platform_settings,
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      } catch (err) {
        console.error('Error reading db file, re-initializing seed:', err);
      }
    }
    const seed = getInitialSeedData();
    this.saveDirect(seed);
    return seed;
  }

  private saveDirect(dataToSave: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving db:', err);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]) {
    this.data[key] = value;
    this.save();
  }

  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const entry: AuditLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(entry);
    // Keep max 1000 logs
    if (this.data.audit_logs.length > 1000) {
      this.data.audit_logs.pop();
    }
    this.save();
    return entry;
  }
}

export const db = new Database();
