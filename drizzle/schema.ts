import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, index, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "restaurateur"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Restaurant owners table for Google/Facebook OAuth and local email authentication.
 * It is separate from the legacy compatibility account table.
 */
export const restaurantOwners = mysqlTable("restaurant_owners", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatarUrl"),
  provider: mysqlEnum("provider", ["google", "facebook", "email"]).notNull(), // OAuth provider or email/password
  providerId: varchar("providerId", { length: 255 }), // ID from OAuth provider (nullable for email accounts)
  passwordHash: varchar("passwordHash", { length: 255 }), // Bcrypt hash for email/password accounts
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type RestaurantOwner = typeof restaurantOwners.$inferSelect;
export type InsertRestaurantOwner = typeof restaurantOwners.$inferInsert;

/**
 * Restaurants table - core multi-tenant entity
 */
export const restaurants = mysqlTable("restaurants", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId"), // Reference to restaurant_owners table (nullable until owner accepts invitation)
  slug: varchar("slug", { length: 100 }).notNull().unique(), // Subdomain identifier
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Contact information
  whatsapp: varchar("whatsapp", { length: 20 }),
  reservationUrl: text("reservationUrl"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  
  // Visual customization
  logoUrl: text("logoUrl"),
  heroImageUrl: text("heroImageUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#7D3A31"),
  accentColor: varchar("accentColor", { length: 7 }).default("#FF9999"),
  fontFamily: varchar("fontFamily", { length: 100 }).default("Playfair Display"),
  
  // Theme (PREMIUM uniquement pour choix multiple, sinon pronto-service par défaut)
  theme: mysqlEnum("theme", ["pronto-service", "moderne-soho", "beach-boheme", "day-night", "marble-rome"]).default("pronto-service").notNull(),
  
  // Subscription (19€ MENU / 29€ PRO / 39€ PREMIUM)
  subscriptionTier: mysqlEnum("subscriptionTier", ["menu", "pro", "premium"]).default("menu").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "trial", "expired", "cancelled"]).default("trial").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  showAds: boolean("showAds").default(true).notNull(), // Publicités externes (forfait MENU uniquement)
  featuresEnabled: json("featuresEnabled").$type<{events?: boolean; reservations?: boolean; translations?: boolean}>().default({events: true, reservations: true, translations: true}), // Toggle ON/OFF des fonctionnalités
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = typeof restaurants.$inferInsert;

/**
 * Generic multi-sector business core.
 * Existing restaurants are preserved and receive a matching business through
 * legacyRestaurantId during the additive migration.
 */
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  legacyRestaurantId: int("legacyRestaurantId").unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  vertical: mysqlEnum("vertical", ["restaurant", "beauty", "retail", "service", "events", "other"]).default("other").notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived", "suspended"]).default("draft").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["menu", "pro", "premium"]).default("menu").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "trial", "expired", "cancelled"]).default("trial").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/** Public identity and visual settings for a business. */
export const businessProfiles = mysqlTable("business_profiles", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().unique(),
  displayName: varchar("displayName", { length: 255 }),
  shortDescription: text("shortDescription"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  whatsapp: varchar("whatsapp", { length: 32 }),
  address: text("address"),
  logoUrl: text("logoUrl"),
  heroImageUrl: text("heroImageUrl"),
  primaryColor: varchar("primaryColor", { length: 16 }).default("#7D3A31"),
  accentColor: varchar("accentColor", { length: 16 }).default("#FF9999"),
  fontFamily: varchar("fontFamily", { length: 100 }).default("Playfair Display"),
  locale: varchar("locale", { length: 10 }).default("fr").notNull(),
  socialLinks: json("socialLinks").$type<Record<string, string>>(),
  seoTitle: varchar("seoTitle", { length: 255 }),
  seoDescription: text("seoDescription"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = typeof businessProfiles.$inferInsert;

/**
 * Temporary principal-based membership layer. It supports legacy owner/admin
 * identities now and will later be backed by the unified account table.
 */
export const businessMembers = mysqlTable("business_members", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  principalType: mysqlEnum("principalType", ["restaurant_owner", "admin_account"]).notNull(),
  principalId: int("principalId").notNull(),
  role: mysqlEnum("role", ["owner", "administrator", "editor", "publisher", "analyst", "support"]).default("editor").notNull(),
  status: mysqlEnum("status", ["active", "invited", "suspended"]).default("active").notNull(),
  invitedByPrincipalId: int("invitedByPrincipalId"),
  joinedAt: timestamp("joinedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("business_members_principal_unique").on(table.businessId, table.principalType, table.principalId),
  index("business_members_business_idx").on(table.businessId),
]);

export type BusinessMember = typeof businessMembers.$inferSelect;
export type InsertBusinessMember = typeof businessMembers.$inferInsert;

/** Publishable business content: menus, services, products, price lists or portfolios. */
export const catalogs = mysqlTable("catalogs", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  legacyRestaurantId: int("legacyRestaurantId"),
  slug: varchar("slug", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["menu", "services", "products", "price_list", "portfolio", "events"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  source: mysqlEnum("source", ["manual", "legacy_migration", "csv_import", "document_import", "image_import"]).default("manual").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("catalogs_business_slug_unique").on(table.businessId, table.slug),
  index("catalogs_business_status_idx").on(table.businessId, table.status),
]);

export type Catalog = typeof catalogs.$inferSelect;
export type InsertCatalog = typeof catalogs.$inferInsert;

/** Logical grouping within a catalog: category, range, treatment family or collection. */
export const catalogCollections = mysqlTable("catalog_collections", {
  id: int("id").autoincrement().primaryKey(),
  catalogId: int("catalogId").notNull(),
  legacyMenuCategoryId: int("legacyMenuCategoryId").unique(),
  slug: varchar("slug", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  displayOrder: int("displayOrder").default(0).notNull(),
  status: mysqlEnum("status", ["active", "hidden", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("catalog_collections_catalog_slug_unique").on(table.catalogId, table.slug),
  index("catalog_collections_catalog_order_idx").on(table.catalogId, table.displayOrder),
]);

export type CatalogCollection = typeof catalogCollections.$inferSelect;
export type InsertCatalogCollection = typeof catalogCollections.$inferInsert;

/** Generic catalog item capable of representing a dish, product, service or package. */
export const catalogItems = mysqlTable("catalog_items", {
  id: int("id").autoincrement().primaryKey(),
  catalogId: int("catalogId").notNull(),
  collectionId: int("collectionId"),
  legacyMenuItemId: int("legacyMenuItemId").unique(),
  itemType: mysqlEnum("itemType", ["product", "service", "package", "event"]).default("product").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceType: mysqlEnum("priceType", ["fixed", "from", "range", "quote", "free"]).default("fixed").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  priceMax: decimal("priceMax", { precision: 10, scale: 2 }),
  priceLabel: varchar("priceLabel", { length: 100 }),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  durationMinutes: int("durationMinutes"),
  imageUrl: text("imageUrl"),
  attributes: json("attributes").$type<Record<string, unknown>>(),
  displayOrder: int("displayOrder").default(0).notNull(),
  status: mysqlEnum("status", ["active", "hidden", "archived"]).default("active").notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("catalog_items_catalog_collection_order_idx").on(table.catalogId, table.collectionId, table.displayOrder),
  index("catalog_items_legacy_menu_item_idx").on(table.legacyMenuItemId),
]);

export type CatalogItem = typeof catalogItems.$inferSelect;
export type InsertCatalogItem = typeof catalogItems.$inferInsert;

/**
 * Controlled import lifecycle. Analysis only creates a draft; catalog data is
 * changed exclusively after an explicit apply operation by an authorized user.
 */
export const importJobs = mysqlTable("import_jobs", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  targetCatalogId: int("targetCatalogId"),
  sourceType: mysqlEnum("sourceType", ["csv", "pdf", "image"]).notNull(),
  sourceFileName: varchar("sourceFileName", { length: 255 }).notNull(),
  sourceMimeType: varchar("sourceMimeType", { length: 120 }).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  status: mysqlEnum("status", ["uploaded", "analyzing", "review_required", "applying", "applied", "failed"]).default("uploaded").notNull(),
  draft: json("draft").$type<Record<string, unknown>>(),
  validationErrors: json("validationErrors").$type<Array<{ path: string; message: string }>>(),
  createdByPrincipalType: mysqlEnum("createdByPrincipalType", ["restaurant_owner", "admin_account"]).notNull(),
  createdByPrincipalId: int("createdByPrincipalId").notNull(),
  appliedAt: timestamp("appliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("import_jobs_business_status_idx").on(table.businessId, table.status),
  index("import_jobs_target_catalog_idx").on(table.targetCatalogId),
]);

export type ImportJob = typeof importJobs.$inferSelect;
export type InsertImportJob = typeof importJobs.$inferInsert;

/** Per-row traceability makes CSV corrections and AI review auditable. */
export const importJobRows = mysqlTable("import_job_rows", {
  id: int("id").autoincrement().primaryKey(),
  importJobId: int("importJobId").notNull(),
  rowNumber: int("rowNumber").notNull(),
  rawData: json("rawData").$type<Record<string, unknown>>(),
  normalizedData: json("normalizedData").$type<Record<string, unknown>>(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  status: mysqlEnum("status", ["accepted", "needs_review", "rejected"]).default("needs_review").notNull(),
  validationErrors: json("validationErrors").$type<Array<{ path: string; message: string }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("import_job_rows_job_row_unique").on(table.importJobId, table.rowNumber),
  index("import_job_rows_job_status_idx").on(table.importJobId, table.status),
]);

export type ImportJobRow = typeof importJobRows.$inferSelect;
export type InsertImportJobRow = typeof importJobRows.$inferInsert;

/**
 * Menu categories
 */
export const menuCategories = mysqlTable("menuCategories", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  emoji: varchar("emoji", { length: 10 }).default("🍴"), // Emoji pour la catégorie (tous les plans)
  imageUrl: text("imageUrl"), // Image pour les catégories (formule Premium)
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = typeof menuCategories.$inferInsert;

/**
 * Menu items
 */
export const menuItems = mysqlTable("menuItems", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  restaurantId: int("restaurantId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  
  // Dietary information
  isVegetarian: boolean("isVegetarian").default(false).notNull(),
  isVegan: boolean("isVegan").default(false).notNull(),
  isGlutenFree: boolean("isGlutenFree").default(false).notNull(),
  allergens: json("allergens").$type<string[]>().default([]),
  ingredients: text("ingredients"), // Liste des ingrédients
  nutritionalInfo: json("nutritionalInfo").$type<{calories?: number; protein?: number; carbs?: number; fat?: number}>(), // Infos nutritionnelles
  
  // Display
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

/**
 * Chatbot configuration per restaurant
 */
export const chatbotConfigs = mysqlTable("chatbotConfigs", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull().unique(),
  
  // Configuration
  isEnabled: boolean("isEnabled").default(true).notNull(),
  tone: mysqlEnum("tone", ["formal", "warm", "casual"]).default("warm").notNull(),
  customInfo: text("customInfo"), // Additional context for the AI
  welcomeMessage: text("welcomeMessage"),
  
  // Statistics
  totalConversations: int("totalConversations").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatbotConfig = typeof chatbotConfigs.$inferSelect;
export type InsertChatbotConfig = typeof chatbotConfigs.$inferInsert;

/**
 * Chatbot conversation history
 */
export const chatbotConversations = mysqlTable("chatbotConversations", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  sessionId: varchar("sessionId", { length: 100 }).notNull(),
  
  // Message data
  userMessage: text("userMessage").notNull(),
  aiResponse: text("aiResponse").notNull(),
  
  // Metadata
  userIp: varchar("userIp", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertChatbotConversation = typeof chatbotConversations.$inferInsert;

/**
 * Page views analytics
 */
export const pageViews = mysqlTable("pageViews", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  
  // Visitor data
  visitorIp: varchar("visitorIp", { length: 45 }),
  userAgent: text("userAgent"),
  referer: text("referer"),
  
  // Page data
  path: varchar("path", { length: 500 }).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;

/**
 * Subscription transactions
 */
export const subscriptionTransactions = mysqlTable("subscriptionTransactions", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  
  // Transaction details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  plan: mysqlEnum("plan", ["basic", "premium"]).notNull(),
  
  // Payment provider
  stripePaymentId: varchar("stripePaymentId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionTransaction = typeof subscriptionTransactions.$inferSelect;
export type InsertSubscriptionTransaction = typeof subscriptionTransactions.$inferInsert;

/**
 * Advertisements table - External ads managed by Super Admin
 * Displayed only on MENU tier (19€/month)
 * 
 * Formats disponibles :
 * - pastille : Petit badge discret
 * - footer : Bannière en bas de page
 * - fullpage : Arrière-plan pleine page
 * - popup : Modal temporaire
 * - dish_item : Intégré dans le menu (vert pesto avec mention "Partenariat" dorée + couronne)
 */
export const advertisements = mysqlTable("advertisements", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic info
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Format et contenu
  format: mysqlEnum("format", ["pastille", "footer", "fullpage", "popup", "dish_item"]).notNull(),
  imageUrl: text("imageUrl"), // Image principale (optionnelle pour certains formats)
  linkUrl: text("linkUrl"), // Lien de destination (optionnel)
  
  // Contenu JSON flexible selon le format
  // pastille: { text, icon, position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }
  // footer: { text, backgroundColor, textColor }
  // fullpage: { overlayOpacity, position: "center" | "top" | "bottom" }
  // popup: { text, buttonText, displayDelay, displayDuration }
  // dish_item: { name, description, price, partnerName, partnerLogo }
  content: json("content").$type<{
    text?: string;
    icon?: string;
    position?: string;
    backgroundColor?: string;
    textColor?: string;
    overlayOpacity?: number;
    buttonText?: string;
    displayDelay?: number;
    displayDuration?: number;
    name?: string;
    price?: string;
    partnerName?: string;
    partnerLogo?: string;
  }>(),
  
  // Ciblage
  targetPage: mysqlEnum("targetPage", ["landing", "restaurant_page", "menu", "all"]).default("all").notNull(),
  
  // Affichage
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  
  // Planification
  startDate: timestamp("startDate"), // Date de début d'affichage (optionnel)
  endDate: timestamp("endDate"), // Date de fin d'affichage (optionnel)
  
  // Tailles indiquées (pour référence)
  // pastille: 80x80px
  // footer: 100% x 60px
  // fullpage: 100% x 100%
  // popup: 400x300px
  // dish_item: Taille identique aux plats du menu
  recommendedWidth: int("recommendedWidth"), // Largeur recommandée en pixels
  recommendedHeight: int("recommendedHeight"), // Hauteur recommandée en pixels
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = typeof advertisements.$inferInsert;


/**
 * Translations table - stores translations for menu items, categories, and restaurant info
 */
export const translations = mysqlTable("translations", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(), // Reference to restaurants table
  entityType: mysqlEnum("entityType", ["restaurant", "category", "item"]).notNull(), // Type d'entité traduite
  entityId: int("entityId").notNull(), // ID de l'entité (restaurant, category, ou item)
  field: varchar("field", { length: 100 }).notNull(), // Champ traduit (name, description, etc.)
  language: mysqlEnum("language", ["fr", "en", "it", "de", "es"]).notNull(), // Langue cible
  originalText: text("originalText").notNull(), // Texte original (français)
  translatedText: text("translatedText").notNull(), // Texte traduit
  isAutoTranslated: boolean("isAutoTranslated").default(true).notNull(), // Traduit automatiquement ou manuellement corrigé
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = typeof translations.$inferInsert;

/**
 * Opening hours table - PREMIUM feature
 */
export const openingHours = mysqlTable("opening_hours", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  openTime: varchar("openTime", { length: 5 }), // Format: "HH:MM" (e.g., "09:00")
  closeTime: varchar("closeTime", { length: 5 }), // Format: "HH:MM" (e.g., "22:00")
  isClosed: boolean("isClosed").default(false).notNull(), // true if restaurant is closed this day
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OpeningHour = typeof openingHours.$inferSelect;
export type InsertOpeningHour = typeof openingHours.$inferInsert;

/**
 * Reservation zones table - PREMIUM feature
 * Allows restaurants to define different zones (e.g., terrace, indoor, bar)
 */
export const reservationZones = mysqlTable("reservation_zones", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Terrasse", "Salle principale"
  capacity: int("capacity").notNull(), // Maximum number of people
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReservationZone = typeof reservationZones.$inferSelect;
export type InsertReservationZone = typeof reservationZones.$inferInsert;

/**
 * Reservation settings table - PREMIUM feature
 * Global settings for the reservation system per restaurant
 */
export const reservationSettings = mysqlTable("reservation_settings", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull().unique(),
  
  // Time settings
  slotDuration: int("slotDuration").default(30).notNull(), // Duration of each time slot in minutes
  advanceBookingDays: int("advanceBookingDays").default(30).notNull(), // How many days in advance can customers book
  minAdvanceHours: int("minAdvanceHours").default(2).notNull(), // Minimum hours in advance required
  
  // Capacity settings
  defaultTableSize: int("defaultTableSize").default(4).notNull(), // Default table size
  maxPartySize: int("maxPartySize").default(12).notNull(), // Maximum party size
  
  // Notifications
  notifyByEmail: boolean("notifyByEmail").default(true).notNull(),
  notifyByWhatsApp: boolean("notifyByWhatsApp").default(true).notNull(),
  autoConfirm: boolean("autoConfirm").default(false).notNull(), // Auto-confirm or require manual approval
  
  // Messages
  confirmationMessage: text("confirmationMessage"), // Custom confirmation message
  cancellationPolicy: text("cancellationPolicy"), // Cancellation policy text
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReservationSetting = typeof reservationSettings.$inferSelect;
export type InsertReservationSetting = typeof reservationSettings.$inferInsert;

/**
 * Reservations table - PREMIUM feature
 */
export const reservations = mysqlTable("reservations", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  zoneId: int("zoneId"), // Optional: specific zone requested
  
  // Customer information
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  
  // Reservation details
  reservationDate: timestamp("reservationDate").notNull(), // Date and time of reservation
  partySize: int("partySize").notNull(), // Number of people
  specialRequests: text("specialRequests"), // Special requests or notes
  
  // Status
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed", "no_show"]).default("pending").notNull(),
  
  // Confirmation
  confirmationToken: varchar("confirmationToken", { length: 100 }), // Token for email confirmation
  confirmedAt: timestamp("confirmedAt"),
  cancelledAt: timestamp("cancelledAt"),
  cancellationReason: text("cancellationReason"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;

/**
 * Events table - PREMIUM feature
 * Allows restaurants to create and manage events
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  
  // Event details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("imageUrl"), // Event cover image
  
  // Date and time
  eventDate: timestamp("eventDate").notNull(), // Date and time of the event
  duration: int("duration").default(120).notNull(), // Duration in minutes
  
  // Capacity
  maxAttendees: int("maxAttendees").notNull(), // Maximum number of attendees
  currentAttendees: int("currentAttendees").default(0).notNull(), // Current number of registrations
  
  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00").notNull(), // Event price (0 for free events)
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  
  // Status
  status: mysqlEnum("status", ["draft", "published", "cancelled", "completed"]).default("draft").notNull(),
  isVisible: boolean("isVisible").default(true).notNull(), // Show/hide on public page
  
  // Registration settings
  requiresApproval: boolean("requiresApproval").default(false).notNull(), // Auto-approve or manual approval
  registrationDeadline: timestamp("registrationDeadline"), // Last date to register
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Event registrations table - PREMIUM feature
 * Tracks customer registrations for events
 */
export const eventRegistrations = mysqlTable("event_registrations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  restaurantId: int("restaurantId").notNull(),
  
  // Customer information
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  
  // Registration details
  numberOfPeople: int("numberOfPeople").default(1).notNull(), // Number of people in this registration
  specialRequests: text("specialRequests"), // Special requests or dietary restrictions
  
  // Status
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "attended", "no_show"]).default("pending").notNull(),
  
  // Payment (for paid events)
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "refunded"]).default("pending").notNull(),
  paymentAmount: decimal("paymentAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  
  // Confirmation
  confirmationToken: varchar("confirmationToken", { length: 100 }), // Token for email confirmation
  confirmedAt: timestamp("confirmedAt"),
  cancelledAt: timestamp("cancelledAt"),
  cancellationReason: text("cancellationReason"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = typeof eventRegistrations.$inferInsert;

/**
 * Gallery photos table (PREMIUM feature)
 */
export const galleryPhotos = mysqlTable("gallery_photos", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  caption: text("caption"),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type InsertGalleryPhoto = typeof galleryPhotos.$inferInsert;

/**
 * Invitations table - manages restaurant owner invitations
 * Allows Super Admin to invite restaurant owners via unique links
 */
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurantId").notNull(), // Restaurant to associate with
  token: varchar("token", { length: 255 }).notNull().unique(), // Unique invitation token (UUID)
  
  // Status
  status: mysqlEnum("status", ["pending", "accepted", "expired"]).default("pending").notNull(),
  acceptedBy: int("acceptedBy"), // User ID who accepted the invitation
  acceptedAt: timestamp("acceptedAt"),
  
  // Expiration (24 hours from creation)
  expiresAt: timestamp("expiresAt").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

/**
 * Chatbot requests table - manages call requests and issue reports from landing page chatbot
 * Allows visitors to request callbacks or report issues, with notifications to Super Admin
 */
export const chatbotRequests = mysqlTable("chatbot_requests", {
  id: int("id").autoincrement().primaryKey(),
  
  // Request type
  type: mysqlEnum("type", ["call_request", "issue_report"]).notNull(),
  
  // Contact information
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  
  // Message content
  message: text("message").notNull(),
  
  // Status tracking
  status: mysqlEnum("status", ["pending", "contacted", "resolved", "dismissed"]).default("pending").notNull(),
  
  // Admin notes
  adminNotes: text("adminNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatbotRequest = typeof chatbotRequests.$inferSelect;
export type InsertChatbotRequest = typeof chatbotRequests.$inferInsert;

/**
 * Admin invitations table - For inviting super administrators via unique link
 * No email required - anyone with the link can accept and become admin
 */
export const adminInvitations = mysqlTable("admin_invitations", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  usedBy: varchar("usedBy", { length: 320 }), // Email of the admin who used this invitation
  createdBy: int("createdBy").notNull(), // ID of the admin who created the invitation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminInvitation = typeof adminInvitations.$inferSelect;
export type InsertAdminInvitation = typeof adminInvitations.$inferInsert;

/**
 * Local PRONTO Super Admin invitations. Raw tokens are never persisted and
 * acceptance is bound to the email selected by the inviting Super Admin.
 */
export const localAdminInvitations = mysqlTable("local_admin_invitations", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "revoked", "expired"]).notNull().default("pending"),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  acceptedByAdminId: int("acceptedByAdminId"),
  createdByAdminId: int("createdByAdminId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("local_admin_invitations_email_idx").on(table.email, table.status),
  index("local_admin_invitations_expiry_idx").on(table.expiresAt),
]);

export type LocalAdminInvitation = typeof localAdminInvitations.$inferSelect;

/**
 * Admin accounts table - For admins who joined via invitation link
 * Uses simple email/password authentication (no OAuth)
 * Separate from the legacy compatibility table to support independent authentication.
 */
export const adminAccounts = mysqlTable("admin_accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(), // Bcrypt hashed password
  avatarUrl: text("avatarUrl"),
  invitationToken: varchar("invitationToken", { length: 64 }), // Token used to create this account (nullable for legacy admins)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type AdminAccount = typeof adminAccounts.$inferSelect;
export type InsertAdminAccount = typeof adminAccounts.$inferInsert;

/**
 * Security events are intentionally sparse: no password, raw token, session ID,
 * email address or raw IP address is persisted in this table.
 */
export const securityEvents = mysqlTable("security_events", {
  id: int("id").autoincrement().primaryKey(),
  principalType: mysqlEnum("principalType", ["admin", "owner", "system"]).notNull(),
  principalId: int("principalId"),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  outcome: mysqlEnum("outcome", ["success", "failure", "info"]).notNull(),
  ipHash: varchar("ipHash", { length: 64 }),
  route: varchar("route", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("security_events_principal_idx").on(table.principalType, table.principalId, table.createdAt),
  index("security_events_event_idx").on(table.eventType, table.createdAt),
]);

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type InsertSecurityEvent = typeof securityEvents.$inferInsert;

/** Password recovery tokens are stored only as hashes and expire after a short window. */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("password_reset_owner_idx").on(table.ownerId, table.createdAt),
  index("password_reset_expiry_idx").on(table.expiresAt),
]);

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

/** One lightweight onboarding record describes the setup progress of an enterprise workspace. */
export const businessOnboarding = mysqlTable("business_onboarding", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull().unique(),
  industry: varchar("industry", { length: 100 }),
  primaryGoal: varchar("primaryGoal", { length: 120 }),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  completedSteps: json("completedSteps").$type<string[]>().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("business_onboarding_status_idx").on(table.status)]);

/** Metadata-only media library. File bytes remain in object storage, never in TiDB. */
export const mediaAssets = mysqlTable("media_assets", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  uploadedByType: mysqlEnum("uploadedByType", ["admin", "owner", "system"]).notNull(),
  uploadedById: int("uploadedById"),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 127 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
  url: text("url").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  archivedAt: timestamp("archivedAt"),
}, (table) => [
  index("media_assets_business_idx").on(table.businessId, table.createdAt),
  index("media_assets_uploader_idx").on(table.uploadedByType, table.uploadedById),
]);

export type MediaAsset = typeof mediaAssets.$inferSelect;
