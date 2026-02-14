import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { restaurantProcedure } from "../_core/tenantMiddleware";
import {
  getRestaurantBySlug,
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
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return await getRestaurantBySlug(input.slug);
    }),

  // Get restaurant menu
  getMenu: restaurantProcedure
    .input(z.object({ restaurantId: z.number() }))
    .query(async ({ input }) => {
      const categories = await getMenuCategoriesByRestaurantId(input.restaurantId);
      const items = await getMenuItemsByRestaurantId(input.restaurantId);

      return {
        categories,
        items,
      };
    }),

  // Chatbot interaction
  chat: publicProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        sessionId: z.string(),
        message: z.string(),
        userIp: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
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
        userIp: input.userIp,
        userAgent: input.userAgent,
      });

      return {
        message: aiResponse,
      };
    }),

  // Track page view
  trackPageView: publicProcedure
    .input(
      z.object({
        restaurantId: z.number(),
        path: z.string(),
        visitorIp: z.string().optional(),
        userAgent: z.string().optional(),
        referer: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createPageView(input);
      return { success: true };
    }),
});
