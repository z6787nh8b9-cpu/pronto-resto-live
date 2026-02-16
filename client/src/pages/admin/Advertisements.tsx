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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Advertisements() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [adImageUrl, setAdImageUrl] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"pastille" | "footer" | "fullpage" | "popup" | "dish_item">("footer");

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
      description: formData.get("description") as string || undefined,
      format: selectedFormat,
      imageUrl: adImageUrl || undefined,
      linkUrl: formData.get("linkUrl") as string || undefined,
      targetPage: (formData.get("targetPage") as "landing" | "restaurant_page" | "menu" | "all") || "all",
      displayOrder: parseInt(formData.get("displayOrder") as string) || 0,
      content: {},
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
        description: formData.get("description") as string || undefined,
        format: selectedFormat,
        imageUrl: adImageUrl || selectedAd.imageUrl || undefined,
        linkUrl: formData.get("linkUrl") as string || undefined,
        targetPage: (formData.get("targetPage") as "landing" | "restaurant_page" | "menu" | "all") || "all",
        displayOrder: parseInt(formData.get("displayOrder") as string),
        content: {},
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
    setAdImageUrl(ad.imageUrl || "");
    setSelectedFormat(ad.format || "footer");
    setIsEditDialogOpen(true);
  };

  const formatLabels = {
    pastille: "Pastille (badge discret)",
    footer: "Footer (bannière bas de page)",
    fullpage: "Pleine page (arrière-plan)",
    popup: "Pop-up (modal temporaire)",
    dish_item: "Item plat (intégré au menu)",
  };

  const formatDescriptions = {
    pastille: "Petit badge discret affiché dans un coin de la page (80x80px)",
    footer: "Bannière horizontale en bas de page (100% x 60px)",
    fullpage: "Arrière-plan pleine page avec overlay (100% x 100%)",
    popup: "Modal temporaire qui s'affiche après un délai (400x300px)",
    dish_item: "Intégré dans le menu avec design vert pesto et mention 'Partenariat' dorée",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Publicités</CardTitle>
              <CardDescription>
                Gérez les publicités affichées sur les restaurants en forfait MENU (19€/mois)
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
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
                    <div className="flex flex-col sm:flex-row gap-4">
                      {ad.imageUrl && (
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="w-full sm:w-32 h-32 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg truncate">{ad.title}</h3>
                            {ad.linkUrl && (
                              <a
                                href={ad.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline break-all"
                              >
                                {ad.linkUrl}
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0 flex-wrap">
                            <Badge variant={ad.isActive ? "default" : "secondary"}>
                              {ad.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{formatLabels[ad.format as keyof typeof formatLabels]}</Badge>
                            <Badge variant="outline">Ordre: {ad.displayOrder}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(ad.id, ad.isActive)}
                            className="flex-shrink-0"
                          >
                            {ad.isActive ? (
                              <>
                                <EyeOff className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Désactiver</span>
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Activer</span>
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditAd(ad)} className="flex-shrink-0">
                            <Edit className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Modifier</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(ad.id)}
                            className="text-destructive flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Supprimer</span>
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
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Description de la publicité" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Format *</Label>
                <Select value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(formatLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {formatDescriptions[selectedFormat]}
                </p>
              </div>
              <ImageUploader
                label={selectedFormat === "dish_item" ? "Image du partenaire" : "Image de la publicité"}
                currentImageUrl={adImageUrl}
                onUploadComplete={setAdImageUrl}
              />
              <div className="space-y-2">
                <Label htmlFor="linkUrl">URL de destination</Label>
                <Input
                  id="linkUrl"
                  name="linkUrl"
                  type="url"
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetPage">Page cible</Label>
                <Select name="targetPage" defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les pages</SelectItem>
                    <SelectItem value="landing">Landing page PRONTO</SelectItem>
                    <SelectItem value="restaurant_page">Pages restaurants</SelectItem>
                    <SelectItem value="menu">Pages menu</SelectItem>
                  </SelectContent>
                </Select>
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
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" name="description" defaultValue={selectedAd.description || ""} placeholder="Description de la publicité" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-format">Format *</Label>
                  <Select value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(formatLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {formatDescriptions[selectedFormat]}
                  </p>
                </div>
                <ImageUploader
                  label={selectedFormat === "dish_item" ? "Image du partenaire" : "Image de la publicité"}
                  currentImageUrl={adImageUrl}
                  onUploadComplete={setAdImageUrl}
                />
                <div className="space-y-2">
                  <Label htmlFor="edit-linkUrl">URL de destination</Label>
                  <Input
                    id="edit-linkUrl"
                    name="linkUrl"
                    type="url"
                    defaultValue={selectedAd.linkUrl || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-targetPage">Page cible</Label>
                  <Select name="targetPage" defaultValue={selectedAd.targetPage || "all"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les pages</SelectItem>
                      <SelectItem value="landing">Landing page PRONTO</SelectItem>
                      <SelectItem value="restaurant_page">Pages restaurants</SelectItem>
                      <SelectItem value="menu">Pages menu</SelectItem>
                    </SelectContent>
                  </Select>
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
