import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Upload, Palette, Type } from "lucide-react";

interface CustomizationProps {
  restaurantId: number;
}

export default function Customization({ restaurantId }: CustomizationProps) {
  const { data: restaurant, refetch } = trpc.restaurant.getById.useQuery({ id: restaurantId });
  
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState(restaurant?.primaryColor || "#7D3A31");
  const [accentColor, setAccentColor] = useState(restaurant?.accentColor || "#FF9999");
  const [fontFamily, setFontFamily] = useState(restaurant?.fontFamily || "Playfair Display");
  const [isUploading, setIsUploading] = useState(false);

  const updateCustomization = trpc.restaurant.updateCustomization.useMutation({
    onSuccess: () => {
      toast.success("Personnalisation mise à jour avec succès");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 5MB)");
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
      setLogoUrl(url);
      toast.success("Logo uploadé avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'upload du logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    updateCustomization.mutate({
      restaurantId,
      logoUrl: logoUrl || restaurant?.logoUrl || "",
      primaryColor,
      accentColor,
      fontFamily,
    });
  };

  if (!restaurant) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <CardTitle>Logo du restaurant</CardTitle>
          </div>
          <CardDescription>
            Uploadez le logo de votre restaurant (format PNG, JPG, max 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {(logoUrl || restaurant.logoUrl) && (
              <img
                src={logoUrl || restaurant.logoUrl || ""}
                alt="Logo"
                className="h-20 w-20 object-contain rounded border"
              />
            )}
            <div className="flex-1">
              <Input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleLogoUpload}
                disabled={isUploading}
              />
              {isUploading && <p className="text-sm text-muted-foreground mt-2">Upload en cours...</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Couleurs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Palette de couleurs</CardTitle>
          </div>
          <CardDescription>
            Personnalisez les couleurs de votre page d'accueil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Couleur principale</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#7D3A31"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Utilisée pour les titres et éléments principaux
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Couleur d'accentuation</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#FF9999"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Utilisée pour les boutons et liens
              </p>
            </div>
          </div>

          {/* Aperçu des couleurs */}
          <div className="mt-6 p-4 border rounded-lg space-y-3">
            <p className="text-sm font-medium">Aperçu</p>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <div
                  className="h-20 rounded border"
                  style={{ backgroundColor: primaryColor }}
                />
                <p className="text-xs text-center text-muted-foreground">Principale</p>
              </div>
              <div className="flex-1 space-y-2">
                <div
                  className="h-20 rounded border"
                  style={{ backgroundColor: accentColor }}
                />
                <p className="text-xs text-center text-muted-foreground">Accentuation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Police */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            <CardTitle>Typographie</CardTitle>
          </div>
          <CardDescription>
            Choisissez la police de caractères pour votre page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fontFamily">Police de caractères</Label>
            <select
              id="fontFamily"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="Playfair Display">Playfair Display (Élégante)</option>
              <option value="Inter">Inter (Moderne)</option>
              <option value="Roboto">Roboto (Classique)</option>
              <option value="Montserrat">Montserrat (Géométrique)</option>
              <option value="Lora">Lora (Serif)</option>
              <option value="Open Sans">Open Sans (Sans-serif)</option>
            </select>
          </div>

          {/* Aperçu de la police */}
          <div className="mt-4 p-4 border rounded-lg">
            <p className="text-sm font-medium mb-2">Aperçu</p>
            <p
              className="text-2xl"
              style={{ fontFamily }}
            >
              Votre restaurant, en ligne en 5 minutes
            </p>
            <p
              className="text-sm text-muted-foreground mt-2"
              style={{ fontFamily }}
            >
              Créez une page web élégante pour votre restaurant avec menu interactif et chatbot IA.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateCustomization.isPending}
          size="lg"
        >
          {updateCustomization.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
}
