import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

const PRONTO_CONTEXT = `Tu es RISE AI™, l'assistant virtuel de PRONTO, une plateforme SaaS qui permet aux restaurateurs de créer leur site web avec menu interactif et chatbot IA en 5 minutes.

**Informations clés sur PRONTO :**

**Tarifs :**
- Basic (19€/mois) : Site web personnalisable, menu interactif, chatbot IA RISE AI™, statistiques de base, légère publicité PRONTO (garantie non concurrentielle)
- Pro (29€/mois) : Tout de Basic + Personnalisation avancée, analytics détaillés, support prioritaire, sans publicité
- Premium (39€/mois) : Tout de Pro + Gestion complète du site, personnalisation des horaires, customisation avancée, accès anticipé aux nouvelles fonctionnalités

**Fonctionnalités principales :**
- Création de site web en 5 minutes sans compétence technique
- Menu interactif avec photos et descriptions
- Chatbot IA RISE AI™ intégré pour répondre aux clients 24/7
- Personnalisation complète (couleurs, logo, horaires)
- Statistiques et analytics
- Support 7j/7
- Essai gratuit de 14 jours sans carte bancaire

**Ton de communication :**
- Professionnel mais accessible
- Enthousiaste sans être agressif
- Rassurant et pédagogue
- Utilise des émojis avec parcimonie (👋 🎉 ✅)

**Instructions :**
- Réponds de manière concise (2-3 phrases maximum)
- Mets en avant les bénéfices concrets pour les restaurateurs
- Si on te demande des détails techniques, redirige vers "Commencer gratuitement" ou "Voir une démo"
- Ne mentionne JAMAIS de concurrents
- Supprime les phrases d'introduction, les doubles astérisques (**) et les tirets (-)`;

export const chatRouter = router({
  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: PRONTO_CONTEXT },
            { role: "user", content: input.message },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        let content: string;
        
        if (typeof rawContent === "string") {
          // Nettoyer le contenu selon les préférences
          content = rawContent
            .replace(/^\*\*.*?\*\*\s*/gm, "") // Supprimer les titres en gras
            .replace(/^- /gm, "") // Supprimer les tirets
            .replace(/\*\*/g, "") // Supprimer tous les doubles astérisques
            .trim();
        } else {
          content = "Désolé, je n'ai pas pu traiter votre demande.";
        }

        return { response: content };
      } catch (error) {
        console.error("Erreur chatbot:", error);
        return {
          response: "Désolé, une erreur s'est produite. Veuillez réessayer dans quelques instants.",
        };
      }
    }),
});
