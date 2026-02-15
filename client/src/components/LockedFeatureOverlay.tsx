import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LockedFeatureOverlayProps {
  featureName: string;
  tier: "pro" | "premium";
  restaurantName: string;
  children: React.ReactNode;
}

export function LockedFeatureOverlay({ featureName, tier, restaurantName, children }: LockedFeatureOverlayProps) {
  const tierLabel = tier === "pro" ? "PRO" : "PREMIUM";
  const whatsappNumber = "0749710723";
  const whatsappMessage = `PRONTO ${restaurantName}, passage au forfait ${tierLabel}`;
  const whatsappUrl = `https://wa.me/33${whatsappNumber.slice(1)}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="relative min-h-[600px]">
      {/* Contenu flouté */}
      <div className="blur-sm pointer-events-none opacity-40">
        {children}
      </div>

      {/* Overlay avec cadenas et CTA - Centré fixe */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="max-w-md mx-4 border-2 border-amber-500/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 via-orange-700 to-amber-800 shadow-2xl ring-4 ring-amber-500/20">
              <Lock className="h-10 w-10 text-amber-50 drop-shadow-lg" strokeWidth={2.5} />
            </div>
            <CardTitle className="text-2xl">Fonctionnalité {tierLabel}</CardTitle>
            <CardDescription className="text-base">
              {featureName} est disponible uniquement avec le forfait {tierLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Avantages du forfait {tierLabel} :</p>
              <ul className="space-y-1 text-muted-foreground">
                {tier === "pro" ? (
                  <>
                    <li>✓ Traductions automatiques multilingues</li>
                    <li>✓ Chatbot IA avancé</li>
                    <li>✓ Sans publicités</li>
                    <li>✓ Support prioritaire</li>
                  </>
                ) : (
                  <>
                    <li>✓ Toutes les fonctionnalités PRO</li>
                    <li>✓ Système de réservations en ligne</li>
                    <li>✓ Gestion d'événements</li>
                    <li>✓ Horaires d'ouverture personnalisés</li>
                    <li>✓ Personnalisation visuelle complète</li>
                    <li>✓ Galerie photos</li>
                  </>
                )}
              </ul>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
              onClick={() => window.open(whatsappUrl, "_blank")}
            >
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Passer au forfait {tierLabel} via WhatsApp
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
