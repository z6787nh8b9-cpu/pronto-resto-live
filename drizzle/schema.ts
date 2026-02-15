import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

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
 * Restaurants table - core multi-tenant entity
 */
export const restaurants = mysqlTable("restaurants", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // Reference to users table
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
 */
export const advertisements = mysqlTable("advertisements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  linkUrl: text("linkUrl").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
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
