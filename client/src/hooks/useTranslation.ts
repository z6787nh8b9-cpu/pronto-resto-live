import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import type { LanguageCode } from "@/components/LanguageSelector";

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
  const { data: translationsData } = trpc.translations.getTranslations.useQuery(
    {
      restaurantId: restaurantId!,
      language: currentLanguage,
    },
    {
      enabled: !!restaurantId && currentLanguage !== "fr", // Don't fetch for French (original)
    }
  );

  useEffect(() => {
    if (translationsData) {
      setTranslations(translationsData);
    }
  }, [translationsData]);

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
  };
}
