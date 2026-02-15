import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: "menu" | "pro" | "premium";
  requiredTier: "pro" | "premium";
  featureName: string;
}

export function UpgradeModal({ isOpen, onClose, currentTier, requiredTier, featureName }: UpgradeModalProps) {
  const tierInfo = {
    menu: {
      name: "MENU",
      price: "19€",
      color: "bg-gray-500",
    },
    pro: {
      name: "PRO",
      price: "29€",
      color: "bg-blue-500",
      features: [
        "Traductions automatiques (5 langues)",
        "Page d'accueil personnalisée",
        "Pas de publicités",
        "Support prioritaire",
      ],
    },
    premium: {
      name: "PREMIUM",
      price: "39€",
      color: "bg-gradient-to-r from-amber-500 to-yellow-500",
      features: [
        "Toutes les fonctionnalités PRO",
        "Système de réservations multi-zones",
        "Gestion des événements",
        "Horaires d'ouverture",
        "Dashboard avancé",
        "Support VIP",
      ],
    },
  };

  const required = tierInfo[requiredTier];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-full ${required.color} bg-opacity-10`}>
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Fonctionnalité {required.name}</DialogTitle>
              <DialogDescription>Passez à l'offre {required.name} pour débloquer cette fonctionnalité</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-900">Fonctionnalité verrouillée</span>
            </div>
            <p className="text-sm text-amber-800">
              <strong>{featureName}</strong> est disponible uniquement avec l'offre {required.name} ou supérieure.
            </p>
          </div>

          <div className={`p-6 rounded-lg text-white ${required.color}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">{required.name}</h3>
                <p className="text-white/90">Offre {required.name.toLowerCase()}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{required.price}</div>
                <div className="text-sm text-white/90">/mois</div>
              </div>
            </div>

            <div className="space-y-2">
              {required.features?.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={onClose}>
              Passer à l'offre {required.name}
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Peut-être plus tard
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Contactez le support pour effectuer la mise à niveau de votre abonnement
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
