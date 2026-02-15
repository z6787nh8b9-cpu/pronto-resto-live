import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Plus, Upload, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface GalleryProps {
  restaurantId: number;
}

function SortablePhoto({ photo, onUpdate, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing flex items-center"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <img
              src={photo.imageUrl}
              alt={photo.caption || "Photo de galerie"}
              className="w-32 h-32 object-cover rounded-lg"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {photo.caption || "Sans légende"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ordre: {photo.displayOrder}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdate(photo.id, { isActive: !photo.isActive })}
                >
                  {photo.isActive ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Masquer
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Afficher
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(photo.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Gallery({ restaurantId }: GalleryProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: photos, refetch } = trpc.gallery.getGalleryPhotos.useQuery({ restaurantId });

  const addPhotoMutation = trpc.gallery.addPhoto.useMutation({
    onSuccess: () => {
      toast.success("Photo ajoutée à la galerie");
      refetch();
      setIsAddDialogOpen(false);
      setImageUrl("");
      setCaption("");
    },
    onError: (error: any) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const updatePhotoMutation = trpc.gallery.updatePhoto.useMutation({
    onSuccess: () => {
      toast.success("Photo mise à jour");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const deletePhotoMutation = trpc.gallery.deletePhoto.useMutation({
    onSuccess: () => {
      toast.success("Photo supprimée");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && photos) {
      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);

      const newPhotos = arrayMove(photos, oldIndex, newIndex);

      // Update display order for all affected photos
      newPhotos.forEach((photo, index) => {
        if (photo.displayOrder !== index) {
          updatePhotoMutation.mutate({
            id: photo.id,
            displayOrder: index,
          });
        }
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 10MB)");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erreur lors de l'upload");

      const { url } = await response.json();
      setImageUrl(url);
      toast.success("Image uploadée avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPhoto = () => {
    if (!imageUrl) {
      toast.error("Veuillez uploader une image");
      return;
    }

    addPhotoMutation.mutate({
      restaurantId,
      imageUrl,
      caption,
      displayOrder: photos?.length || 0,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Galerie photos</CardTitle>
              <CardDescription>
                Gérez les photos de votre restaurant affichées sur la page d'accueil
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une photo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {photos && photos.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={photos.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {photos.map((photo) => (
                    <SortablePhoto
                      key={photo.id}
                      photo={photo}
                      onUpdate={(id: number, data: any) => updatePhotoMutation.mutate({ id, ...data })}
                      onDelete={(id: number) => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) {
                          deletePhotoMutation.mutate({ id });
                        }
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucune photo dans la galerie</p>
              <p className="text-sm mt-2">Ajoutez votre première photo ci-dessus</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Photo Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une photo</DialogTitle>
            <DialogDescription>
              Uploadez une photo de votre restaurant pour la galerie
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              {isUploading && <p className="text-sm text-muted-foreground">Upload en cours...</p>}
              {imageUrl && (
                <img src={imageUrl} alt="Aperçu" className="w-full h-48 object-cover rounded-lg mt-2" />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Légende (optionnel)</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Description de la photo..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddPhoto} disabled={!imageUrl || addPhotoMutation.isPending}>
              {addPhotoMutation.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
