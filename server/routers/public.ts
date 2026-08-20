import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";

export const publicVenueChatSchema = z.object({
  restaurantId: z.number().int().positive(),
  sessionId: z.string().trim().min(8).max(128),
  message: z.string().trim().min(1).max(800),
});

export const publicContactFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(40),
  message: z.string().trim().max(2_000).optional(),
  source: z.enum(["HEADER", "HERO", "FOOTER"]),
  recaptchaToken: z.string().min(1),
});

export const publicPageViewSchema = z.object({
  restaurantId: z.number().int().positive(),
  path: z.string().trim().min(1).max(2_048),
});
import { advertisements, restaurants } from "../../drizzle/schema";
import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import {
  getMenuCategoriesByRestaurantId,
  getMenuItemsByRestaurantId,
  getChatbotConfigByRestaurantId,
  createChatbotConversation,
  createPageView,
} from "../db";
import { invokeLLM } from "../_core/llm";

export const publicRouter = router({
  // Get restaurant by slug
  getRestaurant: publicProcedure
    .input(z.object({ slug: z.string().trim().min(2).max(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [restaurant] = await db.select({
        id: restaurants.id,
        slug: restaurants.slug,
        name: restaurants.name,
        description: restaurants.description,
        whatsapp: restaurants.whatsapp,
        reservationUrl: restaurants.reservationUrl,
        email: restaurants.email,
        phone: restaurants.phone,
        address: restaurants.address,
        logoUrl: restaurants.logoUrl,
        heroImageUrl: restaurants.heroImageUrl,
        primaryColor: restaurants.primaryColor,
        accentColor: restaurants.accentColor,
        fontFamily: restaurants.fontFamily,
        theme: restaurants.theme,
        subscriptionTier: restaurants.subscriptionTier,
        showAds: restaurants.showAds,
        featuresEnabled: restaurants.featuresEnabled,
      }).from(restaurants).where(and(
        eq(restaurants.slug, input.slug),
        eq(restaurants.isActive, true),
      )).limit(1);
      return restaurant;
    }),

  // Get restaurant menu
  getMenu: publicProcedure
    .input(z.object({ restaurantId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [restaurant] = await db.select({ id: restaurants.id }).from(restaurants).where(and(
        eq(restaurants.id, input.restaurantId),
        eq(restaurants.isActive, true),
      )).limit(1);
      if (!restaurant) return { categories: [], items: [] };
      const categories = await getMenuCategoriesByRestaurantId(input.restaurantId);
      const items = await getMenuItemsByRestaurantId(input.restaurantId);

      return {
        categories,
        items,
      };
    }),

  // Chatbot interaction
  chat: publicProcedure
    .input(publicVenueChatSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [restaurant] = await db.select({ id: restaurants.id }).from(restaurants).where(and(
        eq(restaurants.id, input.restaurantId),
        eq(restaurants.isActive, true),
      )).limit(1);
      if (!restaurant) throw new Error("Restaurant unavailable");

      // Get restaurant and chatbot config
      const config = await getChatbotConfigByRestaurantId(input.restaurantId);

      if (!config || !config.isEnabled) {
        throw new Error("Chatbot is not enabled for this restaurant");
      }

      // Get menu data for context
      const categories = await getMenuCategoriesByRestaurantId(input.restaurantId);
      const items = await getMenuItemsByRestaurantId(input.restaurantId);

      // Build context for AI
      const featuredItems = items.filter((item) => item.isFeatured);
      const featuredContext = featuredItems.length > 0
        ? `\n\n⭐ NOS SPÉCIALITÉS (plats favoris à recommander en priorité):\n${featuredItems
            .map(
              (item) =>
                `- ${item.name}: ${item.price}€${item.description ? ` - ${item.description}` : ""}${
                  item.isVegetarian ? " (Végétarien)" : ""
                }${item.isVegan ? " (Vegan)" : ""}`
            )
            .join("\n")}\n`
        : "";

      const menuContext = categories
        .map((cat) => {
          const catItems = items.filter((item) => item.categoryId === cat.id);
          const itemsList = catItems
            .map(
              (item) =>
                `- ${item.isFeatured ? "⭐ " : ""}${item.name}: ${item.price}€${item.description ? ` - ${item.description}` : ""}${
                  item.isVegetarian ? " (Végétarien)" : ""
                }${item.isVegan ? " (Vegan)" : ""}`
            )
            .join("\n");
          return `\n${cat.name}:\n${itemsList}`;
        })
        .join("\n");

      const systemPrompt = `Tu es RISE AI™, l'assistant virtuel de ce restaurant. Tu es ${
        config.tone === "formal" ? "formel et professionnel" : config.tone === "warm" ? "chaleureux et accueillant" : "décontracté et amical"
      }.

${config.customInfo ? `Informations sur le restaurant:\n${config.customInfo}\n` : ""}${featuredContext}

Menu du restaurant:
${menuContext}

Instructions:
- Réponds de manière concise et utile
- Aide les clients à choisir des plats
- Recommande en priorité les plats marqués d'une étoile ⭐ (nos spécialités)
- Fournis des informations sur les allergènes si demandé
- Propose des recommandations personnalisées
- Ne réponds qu'aux questions liées au restaurant et au menu
- Si on te demande quelque chose en dehors de ton domaine, redirige poliment vers le personnel du restaurant`;

      // Call AI
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.message },
        ],
      });

      const messageContent = response.choices[0]?.message?.content;
      const aiResponse = typeof messageContent === 'string' ? messageContent : "Désolé, je n'ai pas pu traiter votre demande.";

      // Save conversation
      await createChatbotConversation({
        restaurantId: input.restaurantId,
        sessionId: input.sessionId,
        userMessage: input.message,
        aiResponse,
        userIp: ctx.req.ip,
        userAgent: ctx.req.get("user-agent")?.slice(0, 512),
      });

      return {
        message: aiResponse,
      };
    }),

  // Track page view
  trackPageView: publicProcedure
    .input(publicPageViewSchema)
    .mutation(async ({ input, ctx }) => {
      await createPageView({
        ...input,
        visitorIp: ctx.req.ip,
        userAgent: ctx.req.get("user-agent")?.slice(0, 512),
        referer: ctx.req.get("referer")?.slice(0, 2_048),
      });
      return { success: true };
    }),

  // Get active advertisements (for MENU tier restaurants)
  getActiveAdvertisements: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const now = new Date();

    const ads = await db
      .select()
      .from(advertisements)
      .where(and(
        eq(advertisements.isActive, true),
        or(isNull(advertisements.startDate), lte(advertisements.startDate, now)),
        or(isNull(advertisements.endDate), gte(advertisements.endDate, now)),
      ))
      .orderBy(advertisements.displayOrder);

    return ads;
  }),

  // Submit contact form for free trial
  submitContactForm: publicProcedure
    .input(publicContactFormSchema)
    .mutation(async ({ input }) => {
      // Verify reCAPTCHA token server-side
      const { verifyRecaptcha } = await import("../_core/recaptcha");
      const isValid = await verifyRecaptcha(input.recaptchaToken, "submit_contact_form");
      
      if (!isValid) {
        throw new Error("reCAPTCHA validation failed. Please try again.");
      }

      const { notifyOwner } = await import("../_core/notification");

      const content = `
Nouvelle demande d'essai gratuit

**Source:** ${input.source}
**Nom:** ${input.name}
**Email:** ${input.email}
**Téléphone:** ${input.phone}
${input.message ? `**Message:** ${input.message}` : ""}
      `;

      await notifyOwner({
        title: `ESSAI GRATUIT - ${input.source}`,
        content,
      });

      return { success: true };
    }),
});
