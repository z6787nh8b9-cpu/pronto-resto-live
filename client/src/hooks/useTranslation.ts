import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import type { LanguageCode } from "@/components/LanguageSelector";
import { toast } from "sonner";

interface Translation {
  id: number;
  restaurantId: number;
  entityType: "restaurant" | "category" | "item";
  entityId: number;
  field: string;
  language: LanguageCode;
  originalText: string;
  translatedText: string;
  isAutoTranslated: boolean;
}

export function useTranslation(restaurantId: number | undefined) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("fr");
  const [translations, setTranslations] = useState<Translation[]>([]);

  // Fetch translations when language changes
  const { data: translationsData, refetch } = trpc.translations.getTranslations.useQuery(
    {
      restaurantId: restaurantId!,
      language: currentLanguage,
    },
    {
      enabled: !!restaurantId && currentLanguage !== "fr", // Don't fetch for French (original)
    }
  );

  // Auto-translate mutation
  const autoTranslateMutation = trpc.translations.autoTranslatePublic.useMutation();

  // Update translations when data changes
  useEffect(() => {
    if (translationsData) {
      setTranslations(translationsData);
    } else if (currentLanguage !== "fr") {
      // No translations found, trigger auto-translation
      if (restaurantId && !autoTranslateMutation.isPending) {
        autoTranslateMutation.mutate(
          {
            restaurantId,
            targetLanguage: currentLanguage as "en" | "it" | "de" | "es",
          },
          {
            onSuccess: (data) => {
              if (!data.alreadyTranslated && data.translationsCount > 0) {
                toast.success(`${data.translationsCount} éléments traduits`);
              }
              // Refetch translations after auto-translation
              setTimeout(() => refetch(), 1000);
            },
            onError: () => {
              toast.error("Erreur lors de la traduction");
            },
          }
        );
      }
    }
  }, [translationsData, currentLanguage, restaurantId]);

  // Helper function to translate a specific entity field
  const translate = (
    entityType: "restaurant" | "category" | "item",
    entityId: number,
    field: string,
    originalText: string
  ): string => {
    // If French, return original
    if (currentLanguage === "fr") {
      return originalText;
    }

    // Find translation
    const translation = translations.find(
      (t) =>
        t.entityType === entityType &&
        t.entityId === entityId &&
        t.field === field
    );

    return translation?.translatedText || originalText;
  };

  return {
    currentLanguage,
    setCurrentLanguage,
    translate,
    isTranslating: autoTranslateMutation.isPending,
  };
}
