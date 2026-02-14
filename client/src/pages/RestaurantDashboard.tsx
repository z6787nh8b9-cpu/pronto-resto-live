import { useState } from "react";
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
import { Plus, Edit, Trash2, GripVertical, Settings, Eye, MessageSquare, BarChart3, Star } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import { useParams } from "wouter";
import { EmojiPicker } from "@/components/EmojiPicker";
import { ImageUploader } from "@/components/ImageUploader";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function RestaurantDashboard() {
  const params: { slug?: string } = useParams();
  const tenant = useTenant();
  const slug = params.slug || tenant.slug;
  const [activeTab, setActiveTab] = useState("menu");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedEmoji, setSelectedEmoji] = useState("🍴");
  const [categoryImageUrl, setCategoryImageUrl] = useState("");

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get restaurant data based on slug
  const { data: restaurant } = trpc.public.getRestaurant.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Get menu data
  const { data: categories, refetch: refetchCategories } = trpc.restaurant.getCategories.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id }
  );

  const { data: menuItems, refetch: refetchItems } = trpc.restaurant.getMenuItems.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id }
  );

  // Get chatbot config
  const { data: chatbotConfig } = trpc.restaurant.getChatbotConfig.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id }
  );

  // Mutations
  const createCategoryMutation = trpc.restaurant.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Catégorie créée");
      setIsAddCategoryOpen(false);
      refetchCategories();
    },
  });

  const createItemMutation = trpc.restaurant.createMenuItem.useMutation({
    onSuccess: () => {
      toast.success("Plat ajouté");
      setIsAddItemOpen(false);
      refetchItems();
    },
  });

  const updateCategoryMutation = trpc.restaurant.updateCategory.useMutation({
    onSuccess: () => {
      toast.success("Catégorie modifiée");
      setIsEditCategoryOpen(false);
      refetchCategories();
    },
  });

  const updateItemMutation = trpc.restaurant.updateMenuItem.useMutation({
    onSuccess: () => {
      toast.success("Plat modifié");
      setIsEditItemOpen(false);
      refetchItems();
    },
  });

  const deleteItemMutation = trpc.restaurant.deleteMenuItem.useMutation({
    onSuccess: () => {
      toast.success("Plat supprimé");
      refetchItems();
    },
  });

  const updateChatbotMutation = trpc.restaurant.updateChatbotConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuration chatbot mise à jour");
    },
  });

  const reorderCategoriesMutation = trpc.restaurant.reorderCategories.useMutation({
    onSuccess: () => {
      toast.success("Ordre des catégories mis à jour");
      refetchCategories();
    },
  });

  const reorderItemsMutation = trpc.restaurant.reorderItems.useMutation({
    onSuccess: () => {
      toast.success("Ordre des plats mis à jour");
      refetchItems();
    },
  });

  const updateRestaurantMutation = trpc.restaurant.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Informations mises à jour");
      window.location.reload(); // Reload to see changes
    },
  });

  const handleUpdateRestaurantInfo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateRestaurantMutation.mutate({
      restaurantId: restaurant!.id,
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        whatsapp: formData.get("whatsapp") as string,
        address: formData.get("address") as string,
      },
    });
  };

  const handleUpdateColors = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateRestaurantMutation.mutate({
      restaurantId: restaurant!.id,
      data: {
        primaryColor: formData.get("primaryColor") as string,
        accentColor: formData.get("accentColor") as string,
      },
    });
  };

  const handleDragEndCategories = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categories || !restaurant) return;

    const oldIndex = categories.findIndex((cat: any) => cat.id === active.id);
    const newIndex = categories.findIndex((cat: any) => cat.id === over.id);

    const reordered = arrayMove(categories, oldIndex, newIndex);
    reorderCategoriesMutation.mutate({
      restaurantId: restaurant.id,
      categoryIds: reordered.map((cat: any) => cat.id),
    });
  };

  const handleDragEndItems = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !menuItems || !selectedCategory) return;

    const oldIndex = menuItems.findIndex((item) => item.id === active.id);
    const newIndex = menuItems.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(menuItems, oldIndex, newIndex);
    reorderItemsMutation.mutate({
      categoryId: selectedCategory,
      itemIds: reordered.map((item) => item.id),
    });
  };

  const handleCreateCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const imageUrl = formData.get("imageUrl") as string;
    createCategoryMutation.mutate({
      restaurantId: restaurant!.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      emoji: selectedEmoji,
      imageUrl: imageUrl || undefined,
    });
    // Reset states
    setSelectedEmoji("🍴");
    setCategoryImageUrl("");
  };

  const handleCreateItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createItemMutation.mutate({
      categoryId: selectedCategory!,
      restaurantId: restaurant!.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: formData.get("price") as string,
      isVegetarian: formData.get("isVegetarian") === "on",
      isVegan: formData.get("isVegan") === "on",
      isGlutenFree: formData.get("isGlutenFree") === "on",
    });
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setSelectedEmoji(category.emoji || "🍴");
    setCategoryImageUrl(category.imageUrl || "");
    setIsEditCategoryOpen(true);
  };

  const handleUpdateCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const imageUrl = formData.get("imageUrl") as string;
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        emoji: selectedEmoji,
        imageUrl: imageUrl || undefined,
      },
    });
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsEditItemOpen(true);
  };

  const handleUpdateItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateItemMutation.mutate({
      id: editingItem.id,
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        price: formData.get("price") as string,
        isVegetarian: formData.get("isVegetarian") === "on",
        isVegan: formData.get("isVegan") === "on",
        isGlutenFree: formData.get("isGlutenFree") === "on",
        isFeatured: formData.get("isFeatured") === "on",
      },
    });
  };

  const handleDeleteItem = (itemId: number) => {
    setItemToDelete(itemId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate({ id: itemToDelete });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleToggleFeatured = (itemId: number, currentValue: boolean) => {
    updateItemMutation.mutate({
      id: itemId,
      data: { isFeatured: !currentValue },
    });
  };

  const handleChatbotUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateChatbotMutation.mutate({
      restaurantId: restaurant!.id,
      isEnabled: formData.get("isEnabled") === "on",
      tone: formData.get("tone") as "formal" | "warm" | "casual",
      customInfo: formData.get("customInfo") as string,
      welcomeMessage: formData.get("welcomeMessage") as string,
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
            <div>
              <h1 className="text-2xl font-display font-bold text-pronto-primary">{restaurant.name}</h1>
              <p className="text-sm text-muted-foreground">Dashboard Restaurateur</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Voir la page publique
              </Button>
              <Badge variant={restaurant.subscriptionPlan === "premium" ? "default" : "secondary"}>
                {restaurant.subscriptionPlan === "premium" ? "Premium" : "Basic"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="chatbot">Chatbot IA</TabsTrigger>
            <TabsTrigger value="analytics">Statistiques</TabsTrigger>
          </TabsList>

          {/* Menu Tab */}
          <TabsContent value="menu" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Gestion du Menu</h2>
                <p className="text-muted-foreground">Organisez vos catégories et plats</p>
              </div>
              <Button onClick={() => setIsAddCategoryOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Catégorie
              </Button>
            </div>

            {/* Categories */}
            <div className="space-y-4">
              {categories?.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                        <div className="text-3xl">{category.emoji || "🍴"}</div>
                        <div>
                          <CardTitle>{category.name}</CardTitle>
                          {category.description && (
                            <CardDescription>{category.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setIsAddItemOpen(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter un plat
                        </Button>
                      </div>
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
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
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
                                  onClick={() => handleToggleFeatured(item.id, item.isFeatured || false)}
                                  title={item.isFeatured ? "Retirer des favoris" : "Mettre en favori"}
                                >
                                  <Star
                                    className={`h-4 w-4 ${item.isFeatured ? "fill-yellow-400 text-yellow-400" : ""}`}
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditItem(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
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
                <CardTitle>Informations du Restaurant</CardTitle>
                <CardDescription>Modifiez les informations de votre établissement</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateRestaurantInfo} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rest-name">Nom du Restaurant</Label>
                      <Input id="rest-name" name="name" defaultValue={restaurant.name} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rest-email">Email</Label>
                      <Input id="rest-email" name="email" type="email" defaultValue={restaurant.email || ""} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rest-desc">Description</Label>
                    <Textarea id="rest-desc" name="description" rows={3} defaultValue={restaurant.description || ""} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rest-phone">Téléphone</Label>
                      <Input id="rest-phone" name="phone" defaultValue={restaurant.phone || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rest-whatsapp">WhatsApp</Label>
                      <Input id="rest-whatsapp" name="whatsapp" defaultValue={restaurant.whatsapp || ""} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rest-address">Adresse</Label>
                    <Input id="rest-address" name="address" defaultValue={restaurant.address || ""} />
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
                <form onSubmit={handleUpdateColors} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Couleur Principale</Label>
                      <Input id="primary-color" name="primaryColor" type="color" defaultValue={restaurant.primaryColor || "#7D3A31"} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent-color">Couleur d'Accent</Label>
                      <Input id="accent-color" name="accentColor" type="color" defaultValue={restaurant.accentColor || "#FF9999"} />
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
                  Personnalisez votre assistant virtuel pour vos clients
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
                      placeholder="Ajoutez des informations spécifiques sur votre restaurant (histoire, spécialités, horaires...)"
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
                  <CardTitle className="text-sm font-medium">Plats au menu</CardTitle>
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
            <DialogTitle>Nouvelle Catégorie</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle catégorie à votre menu</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nom de la catégorie *</Label>
                <Input id="cat-name" name="name" placeholder="Entrées, Plats, Desserts..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea id="cat-desc" name="description" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Emoji de la catégorie</Label>
                <div className="flex items-center gap-4">
                  <EmojiPicker value={selectedEmoji} onChange={setSelectedEmoji} />
                  <span className="text-sm text-muted-foreground">Cliquez pour choisir un emoji</span>
                </div>
              </div>
              {restaurant?.subscriptionPlan === 'premium' && (
                <ImageUploader
                  label="Image de la catégorie (Premium)"
                  currentImageUrl={categoryImageUrl}
                  onUploadComplete={setCategoryImageUrl}
                />
              )}
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
            <DialogTitle>Nouveau Plat</DialogTitle>
            <DialogDescription>Ajoutez un nouveau plat à votre menu</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateItem}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Nom du plat *</Label>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddItemOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la Catégorie</DialogTitle>
            <DialogDescription>Modifiez les informations de la catégorie</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cat-name">Nom de la catégorie *</Label>
                <Input
                  id="edit-cat-name"
                  name="name"
                  defaultValue={editingCategory?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cat-desc">Description</Label>
                <Textarea
                  id="edit-cat-desc"
                  name="description"
                  defaultValue={editingCategory?.description || ""}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Emoji de la catégorie</Label>
                <div className="flex items-center gap-4">
                  <EmojiPicker value={selectedEmoji} onChange={setSelectedEmoji} />
                  <span className="text-sm text-muted-foreground">Cliquez pour choisir un emoji</span>
                </div>
              </div>
              {restaurant?.subscriptionPlan === 'premium' && (
                <ImageUploader
                  label="Image de la catégorie (Premium)"
                  currentImageUrl={categoryImageUrl}
                  onUploadComplete={setCategoryImageUrl}
                />
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le Plat</DialogTitle>
            <DialogDescription>Modifiez les informations du plat</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateItem}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-item-name">Nom du plat *</Label>
                  <Input
                    id="edit-item-name"
                    name="name"
                    defaultValue={editingItem?.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-item-price">Prix (€) *</Label>
                  <Input
                    id="edit-item-price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingItem?.price}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-item-desc">Description</Label>
                <Textarea
                  id="edit-item-desc"
                  name="description"
                  defaultValue={editingItem?.description || ""}
                  rows={2}
                />
              </div>

              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-veg"
                    name="isVegetarian"
                    defaultChecked={editingItem?.isVegetarian}
                    className="rounded"
                  />
                  <Label htmlFor="edit-veg">Végétarien</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-vegan"
                    name="isVegan"
                    defaultChecked={editingItem?.isVegan}
                    className="rounded"
                  />
                  <Label htmlFor="edit-vegan">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-gf"
                    name="isGlutenFree"
                    defaultChecked={editingItem?.isGlutenFree}
                    className="rounded"
                  />
                  <Label htmlFor="edit-gf">Sans gluten</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-featured"
                    name="isFeatured"
                    defaultChecked={editingItem?.isFeatured}
                    className="rounded"
                  />
                  <Label htmlFor="edit-featured">⭐ Plat en favori</Label>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce plat ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setItemToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteItem}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
