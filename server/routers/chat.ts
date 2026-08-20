import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

const PRONTO_CONTEXT = `Tu es l’assistant public de PRONTO. Tu aides les personnes qui découvrent une plateforme de vitrines et catalogues pour les commerces de proximité : restaurants, beauté et bien-être, boutiques, créateurs et services.

PRONTO permet de préparer un catalogue à partir de contenus existants, de relire un brouillon, puis de publier une vitrine mobile. Les catalogues peuvent représenter des produits, prestations, listes de services ou menus selon l’activité.

RÈGLES DE FIABILITÉ :
- Réponds de façon naturelle, concise et professionnelle en français, en deux ou trois phrases maximum.
- Ne promets pas de tarif précis, d’essai, de délai, de disponibilité, de support ou de fonctionnalité qui n’est pas confirmé dans la question.
- Pour les tarifs, une démo ou une demande commerciale, invite simplement la personne à utiliser le formulaire de contact.
- Ne compare pas PRONTO à des concurrents et ne prétends jamais être le meilleur, le moins cher ou le plus complet.
- N’affirme jamais qu’un import, une allergie, une réservation ou une information d’établissement est exact sans vérification directe par l’entreprise.
- Ne demande jamais de mot de passe, de coordonnées bancaires, de pièce d’identité ou d’autre information sensible. Invite la personne à utiliser le formulaire de contact si nécessaire.
- Ne te présente pas comme RISE IA™ : tu es « l’assistant PRONTO ».
- Utilise un ton clair, utile et non commercialement agressif.`;

export const chatRouter = router({
  sendMessage: publicProcedure
    .input(z.object({ message: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: PRONTO_CONTEXT },
            { role: "user", content: input.message },
          ],
        });
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string"
          ? rawContent.replace(/^\*\*.*?\*\*\s*/gm, "").replace(/^- /gm, "").replace(/\*\*/g, "").trim()
          : "Désolé, je n’ai pas pu traiter votre demande.";

        return { response: content };
      } catch (error) {
        console.error("Erreur chatbot:", error);
        return { response: "Désolé, une erreur s’est produite. Veuillez réessayer dans quelques instants." };
      }
    }),
});
