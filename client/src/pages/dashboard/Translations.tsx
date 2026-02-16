import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Globe, Check, X, Loader2 } from "lucide-react";

const LANGUAGES = [
  { code: "en", name: "Anglais", flag: "🇬🇧" },
  { code: "it", name: "Italien", flag: "🇮🇹" },
  { code: "de", name: "Allemand", flag: "🇩🇪" },
  { code: "es", name: "Espagnol", flag: "🇪🇸" },
] as const;

export default function Translations() {
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "it" | "de" | "es">("en");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  // Get current restaurant
  const { data: restaurants } = trpc.restaurant.getMyRestaurants.useQuery();
  const restaurant = restaurants?.[0]; // Assuming single restaurant per user for now

  // Get translations
  const { data: translations, refetch } = trpc.translations.getTranslations.useQuery(
    {
      restaurantId: restaurant?.id || 0,
      language: selectedLanguage,
    },
    {
      enabled: !!restaurant?.id,
    }
  );

  // Auto-translate mutation
  const autoTranslateMutation = trpc.translations.translateAll.useMutation({
    onSuccess: () => {
      toast.success("Traduction automatique terminée");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la traduction");
    },
  });

  // Update translation mutation
  const updateTranslationMutation = trpc.translations.updateTranslation.useMutation({
    onSuccess: () => {
      toast.success("Traduction mise à jour");
      setEditingId(null);
      refetch();
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const handleAutoTranslate = () => {
    if (!restaurant) return;
    autoTranslateMutation.mutate({
      restaurantId: restaurant.id,
      targetLanguage: selectedLanguage,
    });
  };

  const handleEdit = (translation: any) => {
    setEditingId(translation.id);
    setEditText(translation.translatedText);
  };

  const handleSave = (translationId: number) => {
    updateTranslationMutation.mutate({
      translationId,
      translatedText: editText,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  if (!restaurant) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  // Check subscription
  if (restaurant.subscriptionTier === "menu") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Traductions
            </CardTitle>
            <CardDescription>
              Fonctionnalité disponible à partir du forfait PRO (29€/mois)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Traduisez automatiquement votre menu en 4 langues (anglais, italien, allemand, espagnol)
              et corrigez manuellement les traductions si nécessaire.
            </p>
            <Button>Passer au forfait PRO</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Traductions</h1>
        <p className="text-muted-foreground">
          Gérez les traductions de votre menu en plusieurs langues
        </p>
      </div>

      {/* Language selector */}
      <Card>
        <CardHeader>
          <CardTitle>Langue cible</CardTitle>
          <CardDescription>Sélectionnez la langue à traduire</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {LANGUAGES.map((lang) => (
              <Button
                key={lang.code}
                variant={selectedLanguage === lang.code ? "default" : "outline"}
                onClick={() => setSelectedLanguage(lang.code as any)}
                className="gap-2"
              >
                <span className="text-lg">{lang.flag}</span>
                {lang.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-translate button */}
      <Card>
        <CardHeader>
          <CardTitle>Traduction automatique</CardTitle>
          <CardDescription>
            Traduisez automatiquement tout votre contenu en {LANGUAGES.find((l) => l.code === selectedLanguage)?.name.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAutoTranslate}
            disabled={autoTranslateMutation.isPending}
            className="gap-2"
          >
            {autoTranslateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Traduction en cours...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                Traduire automatiquement
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            La traduction automatique utilise l'IA pour traduire votre contenu. Vous pouvez ensuite corriger manuellement les traductions ci-dessous.
          </p>
        </CardContent>
      </Card>

      {/* Translations list */}
      <Card>
        <CardHeader>
          <CardTitle>Traductions existantes</CardTitle>
          <CardDescription>
            {translations?.length || 0} traduction(s) en {LANGUAGES.find((l) => l.code === selectedLanguage)?.name.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!translations || translations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune traduction disponible. Cliquez sur "Traduire automatiquement" pour commencer.
            </p>
          ) : (
            <div className="space-y-4">
              {translations.map((translation) => (
                <div key={translation.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{translation.entityType}</Badge>
                        <Badge variant="outline">{translation.field}</Badge>
                        {translation.isAutoTranslated && (
                          <Badge variant="secondary">Auto</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Original :</strong> {translation.originalText}
                      </p>
                      {editingId === translation.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="w-full"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(translation.id)}
                              disabled={updateTranslationMutation.isPending}
                              className="gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Enregistrer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              className="gap-1"
                            >
                              <X className="h-3 w-3" />
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm">
                            <strong>Traduction :</strong> {translation.translatedText}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(translation)}
                            className="mt-2"
                          >
                            Modifier
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
