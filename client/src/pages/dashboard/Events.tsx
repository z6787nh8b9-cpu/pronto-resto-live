import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Users, Calendar, Clock, Euro, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ImageUploader } from "@/components/ImageUploader";

interface EventsProps {
  restaurantId: number;
}

export default function Events({ restaurantId }: EventsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventImageUrl, setEventImageUrl] = useState("");

  const { data: events, refetch } = trpc.events.getEvents.useQuery({ restaurantId });

  const createMutation = trpc.events.createEvent.useMutation({
    onSuccess: () => {
      toast.success("Événement créé");
      setIsCreateDialogOpen(false);
      refetch();
    },
  });

  const updateMutation = trpc.events.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("Événement modifié");
      setIsEditDialogOpen(false);
      refetch();
    },
  });

  const deleteMutation = trpc.events.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("Événement supprimé");
      refetch();
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const eventDate = `${formData.get("eventDate")}T${formData.get("eventTime")}:00`;
    const registrationDeadline = formData.get("registrationDeadline")
      ? `${formData.get("registrationDeadline")}T23:59:59`
      : undefined;

    createMutation.mutate({
      restaurantId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      imageUrl: eventImageUrl || undefined,
      eventDate,
      duration: parseInt(formData.get("duration") as string),
      maxAttendees: parseInt(formData.get("maxAttendees") as string),
      price: parseFloat(formData.get("price") as string) || 0,
      requiresApproval: formData.get("requiresApproval") === "on",
      registrationDeadline,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const formData = new FormData(e.currentTarget);
    
    const eventDate = `${formData.get("eventDate")}T${formData.get("eventTime")}:00`;
    const registrationDeadline = formData.get("registrationDeadline")
      ? `${formData.get("registrationDeadline")}T23:59:59`
      : undefined;

    updateMutation.mutate({
      eventId: selectedEvent.id,
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        imageUrl: eventImageUrl || selectedEvent.imageUrl,
        eventDate,
        duration: parseInt(formData.get("duration") as string),
        maxAttendees: parseInt(formData.get("maxAttendees") as string),
        price: parseFloat(formData.get("price") as string) || 0,
        requiresApproval: formData.get("requiresApproval") === "on",
        registrationDeadline,
      },
    });
  };

  const handleDelete = (eventId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      deleteMutation.mutate({ eventId });
    }
  };

  const handleToggleStatus = (eventId: number, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    updateMutation.mutate({
      eventId,
      data: { status: newStatus as any },
    });
  };

  const handleToggleVisibility = (eventId: number, currentVisibility: boolean) => {
    updateMutation.mutate({
      eventId,
      data: { isVisible: !currentVisibility },
    });
  };

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setEventImageUrl(event.imageUrl || "");
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      published: { variant: "default", label: "Publié" },
      cancelled: { variant: "destructive", label: "Annulé" },
      completed: { variant: "outline", label: "Terminé" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Événements</CardTitle>
              <CardDescription>Créez et gérez vos événements spéciaux</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel événement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {event.imageUrl && (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(event.status)}
                            {!event.isVisible && (
                              <Badge variant="outline">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Masqué
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(event.eventDate), "d MMM yyyy", { locale: fr })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(event.eventDate), "HH:mm", { locale: fr })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {event.currentAttendees}/{event.maxAttendees}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Euro className="h-4 w-4 text-muted-foreground" />
                            <span>{parseFloat(event.price) > 0 ? `${event.price}€` : "Gratuit"}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(event.id, event.status)}
                          >
                            {event.status === "published" ? "Dépublier" : "Publier"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleVisibility(event.id, event.isVisible)}
                          >
                            {event.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditEvent(event)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(event.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun événement créé. Créez votre premier événement ci-dessus.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvel événement</DialogTitle>
            <DialogDescription>Créez un événement spécial pour votre restaurant</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'événement *</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" name="description" rows={4} required />
              </div>
              <ImageUploader
                label="Image de l'événement"
                currentImageUrl={eventImageUrl}
                onUploadComplete={setEventImageUrl}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Date *</Label>
                  <Input id="eventDate" name="eventDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTime">Heure *</Label>
                  <Input id="eventTime" name="eventTime" type="time" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (minutes) *</Label>
                  <Input id="duration" name="duration" type="number" defaultValue="120" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Capacité maximale *</Label>
                  <Input id="maxAttendees" name="maxAttendees" type="number" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (€)</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">Date limite d'inscription</Label>
                  <Input id="registrationDeadline" name="registrationDeadline" type="date" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="requiresApproval">Approbation manuelle</Label>
                  <p className="text-sm text-muted-foreground">
                    Les inscriptions nécessitent votre validation
                  </p>
                </div>
                <Switch id="requiresApproval" name="requiresApproval" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer l'événement</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'événement</DialogTitle>
            <DialogDescription>Modifiez les détails de votre événement</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Titre de l'événement *</Label>
                  <Input id="edit-title" name="title" defaultValue={selectedEvent.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description *</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    rows={4}
                    defaultValue={selectedEvent.description}
                    required
                  />
                </div>
                <ImageUploader
                  label="Image de l'événement"
                  currentImageUrl={eventImageUrl}
                  onUploadComplete={setEventImageUrl}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-eventDate">Date *</Label>
                    <Input
                      id="edit-eventDate"
                      name="eventDate"
                      type="date"
                      defaultValue={format(new Date(selectedEvent.eventDate), "yyyy-MM-dd")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-eventTime">Heure *</Label>
                    <Input
                      id="edit-eventTime"
                      name="eventTime"
                      type="time"
                      defaultValue={format(new Date(selectedEvent.eventDate), "HH:mm")}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-duration">Durée (minutes) *</Label>
                    <Input
                      id="edit-duration"
                      name="duration"
                      type="number"
                      defaultValue={selectedEvent.duration}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-maxAttendees">Capacité maximale *</Label>
                    <Input
                      id="edit-maxAttendees"
                      name="maxAttendees"
                      type="number"
                      defaultValue={selectedEvent.maxAttendees}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Prix (€)</Label>
                    <Input
                      id="edit-price"
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={selectedEvent.price}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-registrationDeadline">Date limite d'inscription</Label>
                    <Input
                      id="edit-registrationDeadline"
                      name="registrationDeadline"
                      type="date"
                      defaultValue={
                        selectedEvent.registrationDeadline
                          ? format(new Date(selectedEvent.registrationDeadline), "yyyy-MM-dd")
                          : ""
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label htmlFor="edit-requiresApproval">Approbation manuelle</Label>
                    <p className="text-sm text-muted-foreground">
                      Les inscriptions nécessitent votre validation
                    </p>
                  </div>
                  <Switch
                    id="edit-requiresApproval"
                    name="requiresApproval"
                    defaultChecked={selectedEvent.requiresApproval}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
