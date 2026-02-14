/**
 * Liste complète des allergènes selon la réglementation européenne (INCO)
 */
export const ALLERGENS = [
  { value: "gluten", label: "Gluten (blé, seigle, orge, avoine)" },
  { value: "crustaceans", label: "Crustacés" },
  { value: "eggs", label: "Œufs" },
  { value: "fish", label: "Poissons" },
  { value: "peanuts", label: "Arachides" },
  { value: "soybeans", label: "Soja" },
  { value: "milk", label: "Lait" },
  { value: "nuts", label: "Fruits à coque (amandes, noisettes, noix, etc.)" },
  { value: "celery", label: "Céleri" },
  { value: "mustard", label: "Moutarde" },
  { value: "sesame", label: "Graines de sésame" },
  { value: "sulphites", label: "Anhydride sulfureux et sulfites" },
  { value: "lupin", label: "Lupin" },
  { value: "molluscs", label: "Mollusques" },
] as const;

export type AllergenValue = typeof ALLERGENS[number]["value"];
