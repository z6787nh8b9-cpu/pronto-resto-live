import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, User, Mail, Phone, Users } from "lucide-react";
import { toast } from "sonner";

interface EventRegistrationFlowProps {
  event: any;
  restaurantId: number;
  restaurantName: string;
  onClose?: () => void;
}

export function EventRegistrationFlow({ event, restaurantId, restaurantName, onClose }: EventRegistrationFlowProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("1");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const registerMutation = trpc.events.registerForEvent.useMutation({
    onSuccess: () => {
      toast.success("Inscription confirmée !");
      setIsSuccess(true);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'inscription");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail || !customerPhone) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    registerMutation.mutate({
      eventId: event.id,
      restaurantId,
      customerName,
      customerEmail,
      customerPhone,
      numberOfPeople: parseInt(numberOfPeople),
      specialRequests,
    });
  };

  const availableSpots = event.maxAttendees - event.currentAttendees;
  const isFull = availableSpots <= 0;

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold">Inscription confirmée !</h3>
        <p className="text-muted-foreground">
          Un email de confirmation a été envoyé à <strong>{customerEmail}</strong>
        </p>
        {event.requiresApproval ? (
          <p className="text-orange-600">
            Votre inscription est en attente de validation par l’entreprise.
          </p>
        ) : (
          <p className="text-green-600 font-semibold">Votre inscription est confirmée automatiquement.</p>
        )}
        {onClose && (
          <Button onClick={onClose} className="mt-4">
            Fermer
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isFull ? (
        <div className="text-center py-8">
          <p className="text-lg font-semibold text-destructive">Événement complet</p>
          <p className="text-muted-foreground mt-2">
            Malheureusement, toutes les places pour cet événement sont déjà réservées.
          </p>
          {onClose && (
            <Button onClick={onClose} variant="outline" className="mt-4">
              Fermer
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">{event.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span>Places disponibles</span>
              <span className="font-semibold">
                {availableSpots} / {event.maxAttendees}
              </span>
            </div>
            {parseFloat(event.price) > 0 && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span>Prix par personne</span>
                <span className="font-semibold">{event.price}€</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom complet <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jean Dupont"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jean.dupont@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Téléphone <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfPeople">
                Nombre de personnes <span className="text-red-500">*</span>
              </Label>
              <Select value={numberOfPeople} onValueChange={setNumberOfPeople}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: Math.min(availableSpots, 10) }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? "personne" : "personnes"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requests">Demandes spéciales (optionnel)</Label>
              <Textarea
                id="requests"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Allergies, régime alimentaire, besoins spécifiques..."
                rows={3}
              />
            </div>

            {parseFloat(event.price) > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold mb-2">Montant total</h4>
                <p className="text-2xl font-bold">{(parseFloat(event.price) * parseInt(numberOfPeople)).toFixed(2)}€</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Le paiement sera effectué sur place lors de l'événement
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Annuler
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Inscription en cours..." : "Confirmer l'inscription"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
