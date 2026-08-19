import { eq, desc, and, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { 
  InsertUser, 
  users,
  restaurants,
  InsertRestaurant,
  Restaurant,
  menuCategories,
  MenuCategory,
  InsertMenuCategory,
  menuItems,
  MenuItem,
  InsertMenuItem,
  chatbotConfigs,
  ChatbotConfig,
  InsertChatbotConfig,
  chatbotConversations,
  InsertChatbotConversation,
  pageViews,
  InsertPageView,
  subscriptionTransactions,
  InsertSubscriptionTransaction
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: "default" });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USER FUNCTIONS =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== RESTAURANT FUNCTIONS =====

export async function createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(restaurants).values(restaurant);
  const insertedId = Number(result[0].insertId);
  
  const created = await getRestaurantById(insertedId);
  if (!created) throw new Error("Failed to retrieve created restaurant");
  
  return created;
}

export async function getRestaurantById(id: number): Promise<Restaurant | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(restaurants).where(eq(restaurants.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(restaurants).orderBy(desc(restaurants.createdAt));
}

export async function getRestaurantsByOwnerId(ownerId: number): Promise<Restaurant[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(restaurants).where(eq(restaurants.ownerId, ownerId));
}

export async function updateRestaurant(id: number, data: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(restaurants).set(data).where(eq(restaurants.id, id));
  return getRestaurantById(id);
}

export async function deleteRestaurant(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(restaurants).where(eq(restaurants.id, id));
}

// ===== MENU CATEGORY FUNCTIONS =====

export async function createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(menuCategories).values(category);
  const insertedId = Number(result[0].insertId);
  
  const created = await getMenuCategoryById(insertedId);
  if (!created) throw new Error("Failed to retrieve created category");
  
  return created;
}

export async function getMenuCategoryById(id: number): Promise<MenuCategory | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(menuCategories).where(eq(menuCategories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMenuCategoriesByRestaurantId(restaurantId: number): Promise<MenuCategory[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(menuCategories)
    .where(and(eq(menuCategories.restaurantId, restaurantId), eq(menuCategories.isActive, true)))
    .orderBy(menuCategories.displayOrder);
}

export async function updateMenuCategory(id: number, data: Partial<InsertMenuCategory>): Promise<MenuCategory | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(menuCategories).set(data).where(eq(menuCategories.id, id));
  return getMenuCategoryById(id);
}

export async function deleteMenuCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(menuCategories).where(eq(menuCategories.id, id));
}

// ===== MENU ITEM FUNCTIONS =====

export async function createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(menuItems).values(item);
  const insertedId = Number(result[0].insertId);
  
  const created = await getMenuItemById(insertedId);
  if (!created) throw new Error("Failed to retrieve created item");
  
  return created;
}

export async function getMenuItemById(id: number): Promise<MenuItem | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMenuItemsByCategoryId(categoryId: number): Promise<MenuItem[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.categoryId, categoryId), eq(menuItems.isActive, true)))
    .orderBy(menuItems.displayOrder);
}

export async function getMenuItemsByRestaurantId(restaurantId: number): Promise<MenuItem[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.isActive, true)))
    .orderBy(menuItems.displayOrder);
}

export async function updateMenuItem(id: number, data: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(menuItems).set(data).where(eq(menuItems.id, id));
  return getMenuItemById(id);
}

export async function deleteMenuItem(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(menuItems).where(eq(menuItems.id, id));
}

// ===== CHATBOT CONFIG FUNCTIONS =====

export async function getChatbotConfigByRestaurantId(restaurantId: number): Promise<ChatbotConfig> {
  const db = await getDb();
  if (!db) {
    // Return default config when DB is not available
    return {
      id: 0,
      restaurantId,
      isEnabled: true,
      tone: "warm" as const,
      customInfo: null,
      welcomeMessage: null,
      totalConversations: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const result = await db.select().from(chatbotConfigs).where(eq(chatbotConfigs.restaurantId, restaurantId)).limit(1);
  
  // Return default config if none exists
  if (result.length === 0) {
    return {
      id: 0,
      restaurantId,
      isEnabled: true,
      tone: "warm" as const,
      customInfo: null,
      welcomeMessage: null,
      totalConversations: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  return result[0];
}

export async function upsertChatbotConfig(config: InsertChatbotConfig): Promise<ChatbotConfig> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(chatbotConfigs).values(config).onDuplicateKeyUpdate({
    set: {
      isEnabled: config.isEnabled,
      tone: config.tone,
      customInfo: config.customInfo,
      welcomeMessage: config.welcomeMessage,
    },
  });

  const result = await getChatbotConfigByRestaurantId(config.restaurantId);
  if (!result) throw new Error("Failed to retrieve chatbot config");
  
  return result;
}

// ===== CHATBOT CONVERSATION FUNCTIONS =====

export async function createChatbotConversation(conversation: InsertChatbotConversation): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(chatbotConversations).values(conversation);
  
  // Increment total conversations count
  await db.update(chatbotConfigs)
    .set({ totalConversations: sql`${chatbotConfigs.totalConversations} + 1` })
    .where(eq(chatbotConfigs.restaurantId, conversation.restaurantId));
}

export async function getChatbotConversationsByRestaurantId(restaurantId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(chatbotConversations)
    .where(eq(chatbotConversations.restaurantId, restaurantId))
    .orderBy(desc(chatbotConversations.createdAt))
    .limit(limit);
}

// ===== PAGE VIEW FUNCTIONS =====

export async function createPageView(view: InsertPageView): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(pageViews).values(view);
}

export async function getPageViewsByRestaurantId(restaurantId: number, limit: number = 1000) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(pageViews)
    .where(eq(pageViews.restaurantId, restaurantId))
    .orderBy(desc(pageViews.createdAt))
    .limit(limit);
}

export async function getRestaurantAnalyticsSummary(restaurantId: number, periodStart: Date) {
  const db = await getDb();
  if (!db) {
    return { pageViewsThisMonth: 0, conversationsThisMonth: 0, totalConversations: 0 };
  }

  const [pageViewCount] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(pageViews)
    .where(and(eq(pageViews.restaurantId, restaurantId), gte(pageViews.createdAt, periodStart)));

  const [conversationCount] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(chatbotConversations)
    .where(and(eq(chatbotConversations.restaurantId, restaurantId), gte(chatbotConversations.createdAt, periodStart)));

  const config = await getChatbotConfigByRestaurantId(restaurantId);

  return {
    pageViewsThisMonth: Number(pageViewCount?.total || 0),
    conversationsThisMonth: Number(conversationCount?.total || 0),
    totalConversations: Number(config.totalConversations || 0),
  };
}

// ===== SUBSCRIPTION TRANSACTION FUNCTIONS =====

export async function createSubscriptionTransaction(transaction: InsertSubscriptionTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(subscriptionTransactions).values(transaction);
  return Number(result[0].insertId);
}

export async function getSubscriptionTransactionsByRestaurantId(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(subscriptionTransactions)
    .where(eq(subscriptionTransactions.restaurantId, restaurantId))
    .orderBy(desc(subscriptionTransactions.createdAt));
}

// ===== STATISTICS FUNCTIONS =====

export async function getGlobalStats() {
  const db = await getDb();
  if (!db) return { activeRestaurants: 0, totalRevenue: 0, totalConversations: 0 };

  const [restaurantCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(restaurants)
    .where(eq(restaurants.isActive, true));

  const [revenueSum] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(subscriptionTransactions)
    .where(eq(subscriptionTransactions.status, 'completed'));

  const [conversationCount] = await db
    .select({ total: sql<number>`COALESCE(SUM(totalConversations), 0)` })
    .from(chatbotConfigs);

  return {
    activeRestaurants: Number(restaurantCount?.count || 0),
    totalRevenue: Number(revenueSum?.total || 0),
    totalConversations: Number(conversationCount?.total || 0),
  };
}
