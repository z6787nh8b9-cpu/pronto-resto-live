import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Lock } from "lucide-react";

const DAYS = [
  { id: 1, name: "Lundi" },
  { id: 2, name: "Mardi" },
  { id: 3, name: "Mercredi" },
  { id: 4, name: "Jeudi" },
  { id: 5, name: "Vendredi" },
  { id: 6, name: "Samedi" },
  { id: 0, name: "Dimanche" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return [
    { value: `${hour}:00`, label: `${hour}:00` },
    { value: `${hour}:30`, label: `${hour}:30` },
  ];
}).flat();

type DayHours = {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
};

export default function OpeningHours() {
  const [hours, setHours] = useState<DayHours[]>(
    DAYS.map((day) => ({
      dayOfWeek: day.id,
      openTime: "09:00",
      closeTime: "22:00",
      isClosed: false,
    }))
  );

  // Get current restaurant
  const { data: restaurants } = trpc.restaurant.getMyRestaurants.useQuery();
  const restaurant = restaurants?.[0];

  // Get existing opening hours
  const { data: existingHours, refetch } = trpc.openingHours.getOpeningHours.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id }
  );

  // Update local state when data is loaded
  useEffect(() => {
    if (existingHours && existingHours.length > 0) {
      setHours(
        DAYS.map((day) => {
          const existing = existingHours.find((h) => h.dayOfWeek === day.id);
          return existing
            ? {
                dayOfWeek: day.id,
                openTime: existing.openTime,
                closeTime: existing.closeTime,
                isClosed: existing.isClosed,
              }
            : {
                dayOfWeek: day.id,
                openTime: "09:00",
                closeTime: "22:00",
                isClosed: false,
              };
        })
      );
    }
  }, [existingHours]);

  // Save mutation
  const saveMutation = trpc.openingHours.batchSetOpeningHours.useMutation({
    onSuccess: () => {
      toast.success("Horaires enregistrés");
      refetch();
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const handleToggleClosed = (dayOfWeek: number, isClosed: boolean) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, isClosed } : h))
    );
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
  };

  const handleSave = () => {
    if (!restaurant) return;
    saveMutation.mutate({
      restaurantId: restaurant.id,
      hours,
    });
  };

  if (!restaurant) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  // Check subscription
  if (restaurant.subscriptionTier !== "premium") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-yellow-600" />
              Horaires d'ouverture
            </CardTitle>
            <CardDescription>
              Fonctionnalité disponible uniquement avec le forfait PREMIUM (39€/mois)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Affichez vos horaires d'ouverture sur votre page d'accueil et permettez à vos clients
              de savoir quand vous êtes ouvert.
            </p>
            <Button>Passer au forfait PREMIUM</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Horaires d'ouverture</h1>
        <p className="text-muted-foreground">
          Configurez vos horaires d'ouverture pour chaque jour de la semaine
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horaires hebdomadaires
          </CardTitle>
          <CardDescription>
            Définissez vos heures d'ouverture et de fermeture pour chaque jour
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DAYS.map((day) => {
            const dayHours = hours.find((h) => h.dayOfWeek === day.id);
            if (!dayHours) return null;

            return (
              <div
                key={day.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg"
              >
                <div className="w-32">
                  <Label className="font-semibold">{day.name}</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={!dayHours.isClosed}
                    onCheckedChange={(checked) => handleToggleClosed(day.id, !checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {dayHours.isClosed ? "Fermé" : "Ouvert"}
                  </span>
                </div>

                {!dayHours.isClosed && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">De</Label>
                      <Select
                        value={dayHours.openTime || "09:00"}
                        onValueChange={(value) =>
                          handleTimeChange(day.id, "openTime", value)
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURS.map((hour) => (
                            <SelectItem key={hour.value} value={hour.value}>
                              {hour.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-sm">à</Label>
                      <Select
                        value={dayHours.closeTime || "22:00"}
                        onValueChange={(value) =>
                          handleTimeChange(day.id, "closeTime", value)
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURS.map((hour) => (
                            <SelectItem key={hour.value} value={hour.value}>
                              {hour.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer les horaires"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
