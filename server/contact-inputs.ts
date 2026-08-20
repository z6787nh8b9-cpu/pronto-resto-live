import { z } from "zod";

export const whatsappInputSchema = z.string().trim().max(32).refine(
  (value) => {
    if (!value) return true;
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  },
  "Le numéro WhatsApp doit contenir entre 8 et 15 chiffres.",
).transform((value) => value ? value.replace(/\D/g, "") : undefined);
