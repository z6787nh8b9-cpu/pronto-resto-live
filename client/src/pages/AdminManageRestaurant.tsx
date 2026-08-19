import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, GripVertical, ArrowLeft, Eye, MessageSquare, BarChart3, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ALLERGENS } from "@shared/allergens";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function AdminManageRestaurant() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("menu");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const restaurantId = parseInt(params.id || "0");

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get restaurant data
  const { data: restaurant } = trpc.admin.getRestaurant.useQuery(
    { id: restaurantId },
    { enabled: !!restaurantId }
  );

  // Get menu data
  const { data: categories, refetch: refetchCategories } = trpc.restaurant.getCategories.useQuery(
    { restaurantId },
    { enabled: !!restaurantId }
  );

  const { data: menuItems, refetch: refetchItems } = trpc.restaurant.getMenuItems.useQuery(
    { restaurantId },
    { enabled: !!restaurantId }
  );

  // Get chatbot config
  const { data: chatbotConfig } = trpc.restaurant.getChatbotConfig.useQuery(
    { restaurantId },
    { enabled: !!restaurantId }
  );

  // Mutations
  const createCategoryMutation = trpc.restaurant.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Collection créée");
      setIsAddCategoryOpen(false);
      refetchCategories();
    },
  });

  const createItemMutation = trpc.restaurant.createMenuItem.useMutation({
    onSuccess: () => {
      toast.success("Élément ajouté");
      setIsAddItemOpen(false);
      refetchItems();
    },
  });

  const updateChatbotMutation = trpc.restaurant.updateChatbotConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuration chatbot mise à jour");
    },
  });

  const updateRestaurantMutation = trpc.admin.updateRestaurant.useMutation({
    onSuccess: () => {
      toast.success("Restaurant mis à jour");
    },
  });

  const updateItemMutation = trpc.restaurant.updateMenuItem.useMutation({
    onSuccess: () => {
      toast.success("Élément mis à jour");
      setIsEditItemOpen(false);
      setSelectedItem(null);
      refetchItems();
    },
  });

  const deleteItemMutation = trpc.restaurant.deleteMenuItem.useMutation({
    onSuccess: () => {
      toast.success("Élément supprimé");
      refetchItems();
    },
  });

  const reorderCategoriesMutation = trpc.restaurant.reorderCategories.useMutation({
    onSuccess: () => {
      toast.success("Ordre des collections mis à jour");
      refetchCategories();
    },
  });

  const reorderItemsMutation = trpc.restaurant.reorderItems.useMutation({
    onSuccess: () => {
      toast.success("Ordre des éléments mis à jour");
      refetchItems();
    },
  });

  const handleCreateCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCategoryMutation.mutate({
      restaurantId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    });
  };

  const handleCreateItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Collect selected allergens
    const allergens = formData.getAll("allergens") as string[];
    
    // Collect nutritional info
    const nutritionalInfo: any = {};
    const calories = formData.get("calories");
    const protein = formData.get("protein");
    const carbs = formData.get("carbs");
    const fat = formData.get("fat");
    
    if (calories) nutritionalInfo.calories = parseFloat(calories as string);
    if (protein) nutritionalInfo.protein = parseFloat(protein as string);
    if (carbs) nutritionalInfo.carbs = parseFloat(carbs as string);
    if (fat) nutritionalInfo.fat = parseFloat(fat as string);
    
    createItemMutation.mutate({
      categoryId: selectedCategory!,
      restaurantId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: formData.get("price") as string,
      isVegetarian: formData.get("isVegetarian") === "on",
      isVegan: formData.get("isVegan") === "on",
      isGlutenFree: formData.get("isGlutenFree") === "on",
      ingredients: formData.get("ingredients") as string,
      allergens,
      nutritionalInfo: Object.keys(nutritionalInfo).length > 0 ? nutritionalInfo : undefined,
    });
  };

  const handleChatbotUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateChatbotMutation.mutate({
      restaurantId,
      isEnabled: formData.get("isEnabled") === "on",
      tone: formData.get("tone") as "formal" | "warm" | "casual",
      customInfo: formData.get("customInfo") as string,
      welcomeMessage: formData.get("welcomeMessage") as string,
    });
  };

  const handleRestaurantUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateRestaurantMutation.mutate({
      id: restaurantId,
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        whatsapp: formData.get("whatsapp") as string,
        address: formData.get("address") as string,
        primaryColor: formData.get("primaryColor") as string,
        accentColor: formData.get("accentColor") as string,
      },
    });
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au Super Admin
              </Button>
              <div>
                <h1 className="text-2xl font-display font-bold text-pronto-primary">{restaurant.name}</h1>
                <p className="text-sm text-muted-foreground">Gestion de l’entreprise (Super Admin)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Voir la page publique
              </Button>
              <Badge variant={restaurant.subscriptionTier === "premium" ? "default" : "secondary"}>
                {restaurant.subscriptionTier === "premium" ? "Premium" : restaurant.subscriptionTier === "pro" ? "Pro" : "Essentiel"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="menu">Catalogue</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="chatbot">Chatbot IA</TabsTrigger>
            <TabsTrigger value="analytics">Statistiques</TabsTrigger>
          </TabsList>

          {/* Menu Tab */}
          <TabsContent value="menu" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Gestion du catalogue</h2>
                <p className="text-muted-foreground">Organisez vos collections et vos éléments</p>
              </div>
              <Button onClick={() => setIsAddCategoryOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle collection
              </Button>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              {categories?.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            disabled={categories?.indexOf(category) === 0}
                            onClick={() => {
                              const currentIndex = categories!.indexOf(category);
                              if (currentIndex > 0) {
                                const newCategoryIds = [...categories!.map(c => c.id)];
                                [newCategoryIds[currentIndex - 1], newCategoryIds[currentIndex]] = [newCategoryIds[currentIndex], newCategoryIds[currentIndex - 1]];
                                reorderCategoriesMutation.mutate({ restaurantId, categoryIds: newCategoryIds });
                              }
                            }}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            disabled={categories?.indexOf(category) === categories!.length - 1}
                            onClick={() => {
                              const currentIndex = categories!.indexOf(category);
                              if (currentIndex < categories!.length - 1) {
                                const newCategoryIds = [...categories!.map(c => c.id)];
                                [newCategoryIds[currentIndex], newCategoryIds[currentIndex + 1]] = [newCategoryIds[currentIndex + 1], newCategoryIds[currentIndex]];
                                reorderCategoriesMutation.mutate({ restaurantId, categoryIds: newCategoryIds });
                              }
                            }}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <CardTitle>{category.name}</CardTitle>
                          {category.description && (
                            <CardDescription>{category.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setIsAddItemOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un élément
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {menuItems
                        ?.filter((item) => item.categoryId === category.id)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  disabled={menuItems?.filter(i => i.categoryId === category.id).indexOf(item) === 0}
                                  onClick={() => {
                                    const categoryItems = menuItems!.filter(i => i.categoryId === category.id);
                                    const currentIndex = categoryItems.indexOf(item);
                                    if (currentIndex > 0) {
                                      const newItemIds = [...categoryItems.map(i => i.id)];
                                      [newItemIds[currentIndex - 1], newItemIds[currentIndex]] = [newItemIds[currentIndex], newItemIds[currentIndex - 1]];
                                      reorderItemsMutation.mutate({ categoryId: category.id, itemIds: newItemIds });
                                    }
                                  }}
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  disabled={menuItems?.filter(i => i.categoryId === category.id).indexOf(item) === menuItems!.filter(i => i.categoryId === category.id).length - 1}
                                  onClick={() => {
                                    const categoryItems = menuItems!.filter(i => i.categoryId === category.id);
                                    const currentIndex = categoryItems.indexOf(item);
                                    if (currentIndex < categoryItems.length - 1) {
                                      const newItemIds = [...categoryItems.map(i => i.id)];
                                      [newItemIds[currentIndex], newItemIds[currentIndex + 1]] = [newItemIds[currentIndex + 1], newItemIds[currentIndex]];
                                      reorderItemsMutation.mutate({ categoryId: category.id, itemIds: newItemIds });
                                    }
                                  }}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.name}</span>
                                  {item.isVegetarian && (
                                    <Badge variant="outline" className="text-xs">
                                      🌱 Végé
                                    </Badge>
                                  )}
                                  {item.isVegan && (
                                    <Badge variant="outline" className="text-xs">
                                      🌿 Vegan
                                    </Badge>
                                  )}
                                  {item.isGlutenFree && (
                                    <Badge variant="outline" className="text-xs">
                                      Sans gluten
                                    </Badge>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-pronto-primary">{item.price}€</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsEditItemOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Supprimer "${item.name}" ?`)) {
                                      deleteItemMutation.mutate({ id: item.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de l’entreprise</CardTitle>
                <CardDescription>Modifiez les informations de l'établissement</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRestaurantUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom de l’entreprise</Label>
                      <Input name="name" defaultValue={restaurant.name} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" name="email" defaultValue={restaurant.email || ""} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea name="description" rows={3} defaultValue={restaurant.description || ""} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input name="phone" defaultValue={restaurant.phone || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp</Label>
                      <Input name="whatsapp" defaultValue={restaurant.whatsapp || ""} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Adresse</Label>
                    <Input name="address" defaultValue={restaurant.address || ""} />
                  </div>
                  <Button type="submit">Sauvegarder les modifications</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personnalisation</CardTitle>
                <CardDescription>Couleurs et typographie</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRestaurantUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur Principale</Label>
                      <Input type="color" name="primaryColor" defaultValue={restaurant.primaryColor || "#7D3A31"} />
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur d'Accent</Label>
                      <Input type="color" name="accentColor" defaultValue={restaurant.accentColor || "#FF9999"} />
                    </div>
                  </div>
                  <Button type="submit">Sauvegarder</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chatbot Tab */}
          <TabsContent value="chatbot" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Configuration RISE AI™
                </CardTitle>
                <CardDescription>
                  Personnalisez l'assistant virtuel pour les clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChatbotUpdate} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Activer le chatbot</Label>
                      <p className="text-sm text-muted-foreground">
                        Permettre aux visiteurs de poser des questions
                      </p>
                    </div>
                    <Switch name="isEnabled" defaultChecked={chatbotConfig?.isEnabled} />
                  </div>

                  <div className="space-y-2">
                    <Label>Ton de la conversation</Label>
                    <Select name="tone" defaultValue={chatbotConfig?.tone || "warm"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formel et professionnel</SelectItem>
                        <SelectItem value="warm">Chaleureux et accueillant</SelectItem>
                        <SelectItem value="casual">Décontracté et amical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Message de bienvenue</Label>
                    <Input
                      name="welcomeMessage"
                      placeholder="Bonjour ! Comment puis-je vous aider aujourd'hui ?"
                      defaultValue={chatbotConfig?.welcomeMessage || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Informations personnalisées</Label>
                    <Textarea
                      name="customInfo"
                      rows={4}
                      placeholder="Ajoutez des informations spécifiques sur l’activité, les services ou les horaires..."
                      defaultValue={chatbotConfig?.customInfo || ""}
                    />
                  </div>

                  <Button type="submit">Sauvegarder la configuration</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Vues de la page</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Ce mois-ci</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Conversations Chatbot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{chatbotConfig?.totalConversations || 0}</div>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Éléments du catalogue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{menuItems?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Actifs</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle collection</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle collection à votre catalogue</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nom de la collection *</Label>
                <Input id="cat-name" name="name" placeholder="Collections, gammes, catégories..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea id="cat-desc" name="description" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvel élément</DialogTitle>
            <DialogDescription>Ajoutez un nouvel élément à votre catalogue</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateItem}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Nom de l’élément *</Label>
                  <Input id="item-name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-price">Prix (€) *</Label>
                  <Input id="item-price" name="price" type="number" step="0.01" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-desc">Description</Label>
                <Textarea id="item-desc" name="description" rows={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-ingredients">Ingrédients</Label>
                <Textarea
                  id="item-ingredients"
                  name="ingredients"
                  rows={2}
                  placeholder="Tomates, mozzarella, basilic, huile d'olive..."
                />
              </div>

              <div className="space-y-3">
                <Label>Options diététiques</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="veg" name="isVegetarian" className="rounded" />
                    <Label htmlFor="veg">Végétarien</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="vegan" name="isVegan" className="rounded" />
                    <Label htmlFor="vegan">Vegan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="gf" name="isGlutenFree" className="rounded" />
                    <Label htmlFor="gf">Sans gluten</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Allergènes</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {ALLERGENS.map((allergen) => (
                    <div key={allergen.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`allergen-${allergen.value}`}
                        name="allergens"
                        value={allergen.value}
                        className="rounded"
                      />
                      <Label htmlFor={`allergen-${allergen.value}`} className="text-sm font-normal">
                        {allergen.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Informations nutritionnelles (optionnel)</Label>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="calories" className="text-xs">Calories</Label>
                    <Input id="calories" name="calories" type="number" placeholder="250" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="protein" className="text-xs">Protéines (g)</Label>
                    <Input id="protein" name="protein" type="number" step="0.1" placeholder="12" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="carbs" className="text-xs">Glucides (g)</Label>
                    <Input id="carbs" name="carbs" type="number" step="0.1" placeholder="30" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="fat" className="text-xs">Lipides (g)</Label>
                    <Input id="fat" name="fat" type="number" step="0.1" placeholder="8" />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddItemOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Éditer l’élément</DialogTitle>
            <DialogDescription>Modifiez les informations de l’élément</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const allergens = formData.getAll("allergens") as string[];
            const nutritionalInfo: any = {};
            const calories = formData.get("calories");
            const protein = formData.get("protein");
            const carbs = formData.get("carbs");
            const fat = formData.get("fat");
            if (calories) nutritionalInfo.calories = parseFloat(calories as string);
            if (protein) nutritionalInfo.protein = parseFloat(protein as string);
            if (carbs) nutritionalInfo.carbs = parseFloat(carbs as string);
            if (fat) nutritionalInfo.fat = parseFloat(fat as string);
            
            updateItemMutation.mutate({
              id: selectedItem.id,
              data: {
                name: formData.get("name") as string,
                description: formData.get("description") as string,
                price: formData.get("price") as string,
                isVegetarian: formData.get("isVegetarian") === "on",
                isVegan: formData.get("isVegan") === "on",
                isGlutenFree: formData.get("isGlutenFree") === "on",
                ingredients: formData.get("ingredients") as string,
                allergens,
                nutritionalInfo: Object.keys(nutritionalInfo).length > 0 ? nutritionalInfo : undefined,
              },
            });
          }}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-item-name">Nom de l’élément *</Label>
                  <Input id="edit-item-name" name="name" defaultValue={selectedItem?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-item-price">Prix (€) *</Label>
                  <Input id="edit-item-price" name="price" type="number" step="0.01" defaultValue={selectedItem?.price} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-item-desc">Description</Label>
                <Textarea id="edit-item-desc" name="description" rows={2} defaultValue={selectedItem?.description} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-item-ingredients">Ingrédients</Label>
                <Textarea
                  id="edit-item-ingredients"
                  name="ingredients"
                  rows={2}
                  placeholder="Tomates, mozzarella, basilic, huile d'olive..."
                  defaultValue={selectedItem?.ingredients}
                />
              </div>

              <div className="space-y-3">
                <Label>Options diététiques</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="edit-veg" name="isVegetarian" className="rounded" defaultChecked={selectedItem?.isVegetarian} />
                    <Label htmlFor="edit-veg">Végétarien</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="edit-vegan" name="isVegan" className="rounded" defaultChecked={selectedItem?.isVegan} />
                    <Label htmlFor="edit-vegan">Vegan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="edit-gf" name="isGlutenFree" className="rounded" defaultChecked={selectedItem?.isGlutenFree} />
                    <Label htmlFor="edit-gf">Sans gluten</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Allergènes</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {ALLERGENS.map((allergen) => (
                    <div key={allergen.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-allergen-${allergen.value}`}
                        name="allergens"
                        value={allergen.value}
                        className="rounded"
                        defaultChecked={selectedItem?.allergens?.includes(allergen.value)}
                      />
                      <Label htmlFor={`edit-allergen-${allergen.value}`} className="text-sm font-normal">
                        {allergen.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Informations nutritionnelles (optionnel)</Label>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-calories" className="text-xs">Calories</Label>
                    <Input id="edit-calories" name="calories" type="number" placeholder="250" defaultValue={selectedItem?.nutritionalInfo?.calories} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-protein" className="text-xs">Protéines (g)</Label>
                    <Input id="edit-protein" name="protein" type="number" step="0.1" placeholder="12" defaultValue={selectedItem?.nutritionalInfo?.protein} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-carbs" className="text-xs">Glucides (g)</Label>
                    <Input id="edit-carbs" name="carbs" type="number" step="0.1" placeholder="30" defaultValue={selectedItem?.nutritionalInfo?.carbs} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-fat" className="text-xs">Lipides (g)</Label>
                    <Input id="edit-fat" name="fat" type="number" step="0.1" placeholder="8" defaultValue={selectedItem?.nutritionalInfo?.fat} />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditItemOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
