import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

interface ReservationsProps {
  restaurantId: number;
}

export default function Reservations({ restaurantId }: ReservationsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Réservations</h2>
        <p className="text-muted-foreground">
          Gérez les zones, paramètres et réservations de votre restaurant
        </p>
      </div>

      <Tabs defaultValue="zones" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="zones">
            <Users className="w-4 h-4 mr-2" />
            Zones
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="bookings">
            <Calendar className="w-4 h-4 mr-2" />
            Réservations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zones">
          <ZonesTab restaurantId={restaurantId} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab restaurantId={restaurantId} />
        </TabsContent>

        <TabsContent value="bookings">
          <BookingsTab restaurantId={restaurantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Zones Tab Component
function ZonesTab({ restaurantId }: { restaurantId: number }) {
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneCapacity, setNewZoneCapacity] = useState("");

  const { data: zones, refetch } = trpc.reservations.getZones.useQuery({ restaurantId });
  const createZone = trpc.reservations.createZone.useMutation();
  const deleteZone = trpc.reservations.deleteZone.useMutation();
  const updateZone = trpc.reservations.updateZone.useMutation();

  const handleCreateZone = async () => {
    if (!newZoneName || !newZoneCapacity) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await createZone.mutateAsync({
        restaurantId,
        name: newZoneName,
        capacity: parseInt(newZoneCapacity),
      });
      toast.success("Zone créée avec succès");
      setNewZoneName("");
      setNewZoneCapacity("");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la création de la zone");
    }
  };

  const handleDeleteZone = async (id: number) => {
    try {
      await deleteZone.mutateAsync({ id });
      toast.success("Zone supprimée");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleZone = async (id: number, isActive: boolean) => {
    try {
      await updateZone.mutateAsync({ id, isActive: !isActive });
      toast.success(isActive ? "Zone désactivée" : "Zone activée");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ajouter une zone</CardTitle>
          <CardDescription>
            Créez différentes zones pour votre restaurant (terrasse, salle principale, bar...)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="zoneName">Nom de la zone</Label>
              <Input
                id="zoneName"
                placeholder="ex: Terrasse"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoneCapacity">Capacité (personnes)</Label>
              <Input
                id="zoneCapacity"
                type="number"
                placeholder="ex: 40"
                value={newZoneCapacity}
                onChange={(e) => setNewZoneCapacity(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateZone} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zones existantes</CardTitle>
        </CardHeader>
        <CardContent>
          {!zones || zones.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune zone créée. Ajoutez votre première zone ci-dessus.
            </p>
          ) : (
            <div className="space-y-3">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{zone.name}</h3>
                      {!zone.isActive && <Badge variant="secondary">Désactivée</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Capacité : {zone.capacity} personnes
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`zone-${zone.id}`} className="text-sm">
                        {zone.isActive ? "Activée" : "Désactivée"}
                      </Label>
                      <Switch
                        id={`zone-${zone.id}`}
                        checked={zone.isActive}
                        onCheckedChange={() => handleToggleZone(zone.id, zone.isActive)}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteZone(zone.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

// Settings Tab Component
function SettingsTab({ restaurantId }: { restaurantId: number }) {
  const { data: settings, refetch } = trpc.reservations.getSettings.useQuery({ restaurantId });
  const updateSettings = trpc.reservations.updateSettings.useMutation();

  const [formData, setFormData] = useState({
    slotDuration: settings?.slotDuration || 30,
    advanceBookingDays: settings?.advanceBookingDays || 30,
    minAdvanceHours: settings?.minAdvanceHours || 2,
    defaultTableSize: settings?.defaultTableSize || 4,
    maxPartySize: settings?.maxPartySize || 12,
    notifyByEmail: settings?.notifyByEmail ?? true,
    notifyByWhatsApp: settings?.notifyByWhatsApp ?? true,
    autoConfirm: settings?.autoConfirm ?? false,
    confirmationMessage: settings?.confirmationMessage || "",
    cancellationPolicy: settings?.cancellationPolicy || "",
  });

  // Update form when settings load
  useState(() => {
    if (settings) {
      setFormData({
        slotDuration: settings.slotDuration,
        advanceBookingDays: settings.advanceBookingDays,
        minAdvanceHours: settings.minAdvanceHours,
        defaultTableSize: settings.defaultTableSize,
        maxPartySize: settings.maxPartySize,
        notifyByEmail: settings.notifyByEmail,
        notifyByWhatsApp: settings.notifyByWhatsApp,
        autoConfirm: settings.autoConfirm,
        confirmationMessage: settings.confirmationMessage || "",
        cancellationPolicy: settings.cancellationPolicy || "",
      });
    }
  });

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        restaurantId,
        ...formData,
      });
      toast.success("Paramètres enregistrés");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de réservation</CardTitle>
          <CardDescription>
            Configurez les règles de réservation pour votre restaurant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slotDuration">Durée des créneaux (minutes)</Label>
              <Input
                id="slotDuration"
                type="number"
                value={formData.slotDuration}
                onChange={(e) =>
                  setFormData({ ...formData, slotDuration: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advanceBookingDays">Réservation à l'avance (jours)</Label>
              <Input
                id="advanceBookingDays"
                type="number"
                value={formData.advanceBookingDays}
                onChange={(e) =>
                  setFormData({ ...formData, advanceBookingDays: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minAdvanceHours">Délai minimum (heures)</Label>
              <Input
                id="minAdvanceHours"
                type="number"
                value={formData.minAdvanceHours}
                onChange={(e) =>
                  setFormData({ ...formData, minAdvanceHours: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultTableSize">Taille de table par défaut</Label>
              <Input
                id="defaultTableSize"
                type="number"
                value={formData.defaultTableSize}
                onChange={(e) =>
                  setFormData({ ...formData, defaultTableSize: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPartySize">Taille de groupe maximum</Label>
              <Input
                id="maxPartySize"
                type="number"
                value={formData.maxPartySize}
                onChange={(e) =>
                  setFormData({ ...formData, maxPartySize: parseInt(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifyByEmail">Notifications par email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les nouvelles réservations par email
                </p>
              </div>
              <Switch
                id="notifyByEmail"
                checked={formData.notifyByEmail}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifyByEmail: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifyByWhatsApp">Notifications par WhatsApp</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les nouvelles réservations par WhatsApp
                </p>
              </div>
              <Switch
                id="notifyByWhatsApp"
                checked={formData.notifyByWhatsApp}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifyByWhatsApp: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoConfirm">Confirmation automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Confirmer automatiquement les réservations sans validation manuelle
                </p>
              </div>
              <Switch
                id="autoConfirm"
                checked={formData.autoConfirm}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, autoConfirm: checked })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmationMessage">Message de confirmation</Label>
            <Textarea
              id="confirmationMessage"
              placeholder="Message envoyé au client après confirmation..."
              value={formData.confirmationMessage}
              onChange={(e) =>
                setFormData({ ...formData, confirmationMessage: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellationPolicy">Politique d'annulation</Label>
            <Textarea
              id="cancellationPolicy"
              placeholder="Conditions d'annulation..."
              value={formData.cancellationPolicy}
              onChange={(e) =>
                setFormData({ ...formData, cancellationPolicy: e.target.value })
              }
              rows={3}
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Enregistrer les paramètres
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Bookings Tab Component
function BookingsTab({ restaurantId }: { restaurantId: number }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: reservations, refetch } = trpc.reservations.getByRestaurant.useQuery({
    restaurantId,
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });

  const updateStatus = trpc.reservations.updateStatus.useMutation();

  const handleUpdateStatus = async (
    id: number,
    status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
  ) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success("Statut mis à jour");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
      no_show: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmée",
      cancelled: "Annulée",
      completed: "Terminée",
      no_show: "Absent",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Liste des réservations</CardTitle>
          <CardDescription>Gérez toutes les réservations de votre établissement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Filtrer par statut</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                Toutes
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                En attente
              </Button>
              <Button
                variant={statusFilter === "confirmed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("confirmed")}
              >
                Confirmées
              </Button>
            </div>
          </div>

          {!reservations || reservations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune réservation pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{reservation.customerName}</h3>
                      <p className="text-sm text-muted-foreground">{reservation.customerEmail}</p>
                      <p className="text-sm text-muted-foreground">{reservation.customerPhone}</p>
                    </div>
                    {getStatusBadge(reservation.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date : </span>
                      {new Date(reservation.reservationDate).toLocaleDateString("fr-FR")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Heure : </span>
                      {new Date(reservation.reservationDate).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Personnes : </span>
                      {reservation.partySize}
                    </div>
                  </div>

                  {reservation.specialRequests && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Demandes spéciales : </span>
                      {reservation.specialRequests}
                    </div>
                  )}

                  {reservation.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(reservation.id, "confirmed")}
                      >
                        Confirmer
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(reservation.id, "cancelled")}
                      >
                        Annuler
                      </Button>
                    </div>
                  )}

                  {reservation.status === "confirmed" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(reservation.id, "completed")}
                      >
                        Marquer comme terminée
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(reservation.id, "no_show")}
                      >
                        Client absent
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
