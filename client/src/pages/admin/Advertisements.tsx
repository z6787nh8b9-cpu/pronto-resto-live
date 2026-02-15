import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye, EyeOff, MoveUp, MoveDown } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ImageUploader";

export default function Advertisements() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [adImageUrl, setAdImageUrl] = useState("");

  const { data: ads, refetch } = trpc.admin.listAdvertisements.useQuery();

  const createMutation = trpc.admin.createAdvertisement.useMutation({
    onSuccess: () => {
      toast.success("Publicité créée");
      setIsCreateDialogOpen(false);
      setAdImageUrl("");
      refetch();
    },
  });

  const updateMutation = trpc.admin.updateAdvertisement.useMutation({
    onSuccess: () => {
      toast.success("Publicité modifiée");
      setIsEditDialogOpen(false);
      setSelectedAd(null);
      setAdImageUrl("");
      refetch();
    },
  });

  const deleteMutation = trpc.admin.deleteAdvertisement.useMutation({
    onSuccess: () => {
      toast.success("Publicité supprimée");
      refetch();
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!adImageUrl) {
      toast.error("Veuillez uploader une image");
      return;
    }

    createMutation.mutate({
      title: formData.get("title") as string,
      imageUrl: adImageUrl,
      linkUrl: formData.get("linkUrl") as string,
      displayOrder: parseInt(formData.get("displayOrder") as string) || 0,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAd) return;

    const formData = new FormData(e.currentTarget);

    updateMutation.mutate({
      id: selectedAd.id,
      data: {
        title: formData.get("title") as string,
        imageUrl: adImageUrl || selectedAd.imageUrl,
        linkUrl: formData.get("linkUrl") as string,
        displayOrder: parseInt(formData.get("displayOrder") as string),
      },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette publicité ?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleActive = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({
      id,
      data: { isActive: !currentStatus },
    });
  };

  const handleEditAd = (ad: any) => {
    setSelectedAd(ad);
    setAdImageUrl(ad.imageUrl);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Publicités</CardTitle>
              <CardDescription>
                Gérez les publicités affichées sur les restaurants en forfait MENU (19€/mois)
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle publicité
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ads && ads.length > 0 ? (
            <div className="space-y-4">
              {ads.map((ad) => (
                <Card key={ad.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{ad.title}</h3>
                            <a
                              href={ad.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {ad.linkUrl}
                            </a>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={ad.isActive ? "default" : "secondary"}>
                              {ad.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">Ordre: {ad.displayOrder}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(ad.id, ad.isActive)}
                          >
                            {ad.isActive ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                Activer
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditAd(ad)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(ad.id)}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucune publicité créée. Créez votre première publicité ci-dessus.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Advertisement Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle publicité</DialogTitle>
            <DialogDescription>
              Créez une publicité qui sera affichée sur les restaurants en forfait MENU
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input id="title" name="title" required />
              </div>
              <ImageUploader
                label="Image de la publicité *"
                currentImageUrl={adImageUrl}
                onUploadComplete={setAdImageUrl}
              />
              <div className="space-y-2">
                <Label htmlFor="linkUrl">URL de destination *</Label>
                <Input
                  id="linkUrl"
                  name="linkUrl"
                  type="url"
                  placeholder="https://example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Ordre d'affichage</Label>
                <Input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  defaultValue="0"
                />
                <p className="text-sm text-muted-foreground">
                  Les publicités sont affichées par ordre croissant (0 = premier)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer la publicité</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Advertisement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la publicité</DialogTitle>
            <DialogDescription>Modifiez les détails de la publicité</DialogDescription>
          </DialogHeader>
          {selectedAd && (
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Titre *</Label>
                  <Input id="edit-title" name="title" defaultValue={selectedAd.title} required />
                </div>
                <ImageUploader
                  label="Image de la publicité *"
                  currentImageUrl={adImageUrl}
                  onUploadComplete={setAdImageUrl}
                />
                <div className="space-y-2">
                  <Label htmlFor="edit-linkUrl">URL de destination *</Label>
                  <Input
                    id="edit-linkUrl"
                    name="linkUrl"
                    type="url"
                    defaultValue={selectedAd.linkUrl}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-displayOrder">Ordre d'affichage</Label>
                  <Input
                    id="edit-displayOrder"
                    name="displayOrder"
                    type="number"
                    defaultValue={selectedAd.displayOrder}
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
