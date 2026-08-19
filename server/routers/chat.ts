import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

const PRONTO_CONTEXT = `Tu es l'assistant IA de PRONTO. Tu aides des entreprises de proximité — restaurants, beauté et bien-être, boutiques, services et événementiel — à comprendre la plateforme et à choisir le bon parcours.

PRONTO permet de créer une vitrine publique, d’organiser un catalogue en collections et éléments, d’importer un contenu depuis un CSV, un PDF ou une image, puis de le relire avant toute publication. La plateforme propose aussi la personnalisation de l’identité visuelle, la gestion des informations pratiques, l’assistance conversationnelle et des indicateurs d’activité. Les réservations, événements et fonctions avancées dépendent du secteur et de la formule choisie.

Les formules visibles dans le produit sont Essentiel, Pro et Premium. Ne donne ni tarif, ni délai, ni engagement commercial non confirmé. Oriente vers la page Tarifs ou l’équipe PRONTO si la question porte sur une offre, une remise, un essai ou une disponibilité précise.

Réponds avec un ton naturel, professionnel et jeune. Sois concis, concret et factuel : deux ou trois phrases dans la plupart des cas. Utilise le mot catalogue, collections, éléments, produits, prestations ou services selon le contexte, et n’impose jamais le vocabulaire restaurant à une activité différente.

Ne prétends pas connaître les données privées d’une entreprise, un concurrent, une performance de marché ou une fonctionnalité non mentionnée ici. Si une comparaison concurrentielle est demandée, explique sobrement que PRONTO centralise une vitrine, un catalogue, un import contrôlé et des outils de gestion, sans dénigrer ni chiffrer les autres solutions. Propose une action claire seulement lorsqu’elle est adaptée.`;

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
