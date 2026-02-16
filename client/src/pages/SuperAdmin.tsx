import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, TrendingUp, Store, MessageSquare, Settings, Megaphone, Shield, Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { ResponsiveHeader, ResponsiveTable } from "@/components/responsive";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Advertisements from "./admin/Advertisements";
import Admins from "./admin/Admins";
import InvitationsTab from "./admin/InvitationsTab";
import RequestsTab from "./admin/RequestsTab";

export default function SuperAdmin() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("restaurants");
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [copiedInvitation, setCopiedInvitation] = useState(false);
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  // MODE DÉVELOPPEMENT : Accès sans authentification
  const isDev = import.meta.env.DEV;

  // Queries - MUST be before any conditional returns (React hooks rules)
  const { data: stats } = trpc.admin.getStats.useQuery(undefined, { enabled: isDev || (!!user && user.role === 'admin') });
  const { data: restaurants, refetch } = trpc.admin.listRestaurants.useQuery(undefined, { enabled: isDev || (!!user && user.role === 'admin') });

  // Mutations
  const createMutation = trpc.admin.createRestaurant.useMutation({
    onSuccess: () => {
      toast.success("Restaurant créé avec succès");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = trpc.admin.updateRestaurant.useMutation({
    onSuccess: () => {
      toast.success("Restaurant mis à jour");
      setEditingRestaurant(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = trpc.admin.deleteRestaurant.useMutation({
    onSuccess: () => {
      toast.success("Restaurant supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const createInvitationMutation = trpc.invitations.create.useMutation({
    onSuccess: (data) => {
      setInvitationUrl(data.invitationUrl);
      toast.success("Invitation créée avec succès");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleCopyInvitation = () => {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl);
      setCopiedInvitation(true);
      toast.success("Lien copié dans le presse-papier");
      setTimeout(() => setCopiedInvitation(false), 2000);
    }
  };

  // Redirect if not admin - AFTER all hooks
  if (!isDev && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated or not admin
  if (!isDev && (!user || user.role !== 'admin')) {
    if (!user) {
      // Not authenticated - redirect to OAuth login
      window.location.href = `https://manus.im/app-auth?appId=${import.meta.env.VITE_APP_ID}&redirectUri=${encodeURIComponent(window.location.origin + '/api/oauth/callback')}&state=${encodeURIComponent(window.location.origin + '/admin')}&type=signIn`;
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirection vers la connexion...</p>
          </div>
        </div>
      );
    } else {
      // Authenticated but not admin
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20">
          <Card className="max-w-md">
            <CardHeader>
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-center">Accès Refusé</CardTitle>
              <CardDescription className="text-center">
                Vous n'avez pas les permissions nécessaires pour accéder au Super Admin.
                <br />
                <span className="text-xs text-muted-foreground mt-2 block">
                  Code erreur : 10002 - Permissions administrateur requises
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => setLocation('/')} variant="outline" className="w-full">
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      ownerId: 1, // TODO: Get from user selection
      slug: formData.get("slug") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      whatsapp: formData.get("whatsapp") as string,
      address: formData.get("address") as string,
      subscriptionTier: formData.get("subscriptionTier") as "menu" | "pro" | "premium",
      subscriptionStatus: "trial",
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateMutation.mutate({
      id: editingRestaurant.id,
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        whatsapp: formData.get("whatsapp") as string,
        address: formData.get("address") as string,
        subscriptionTier: formData.get("subscriptionTier") as "menu" | "pro" | "premium",
        subscriptionStatus: formData.get("subscriptionStatus") as "active" | "trial" | "expired" | "cancelled",
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec ResponsiveHeader */}
      <ResponsiveHeader
        title="PRONTO"
        subtitle="Super Admin Dashboard"
        primaryAction={{
          label: "Nouveau Restaurant",
          onClick: () => setIsCreateDialogOpen(true),
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      <main className="container px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="restaurants">
              <Store className="h-4 w-4 mr-2" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="advertisements">
              <Megaphone className="h-4 w-4 mr-2" />
              Publicités
            </TabsTrigger>
            <TabsTrigger value="admins">
              <Shield className="h-4 w-4 mr-2" />
              Admins
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <Mail className="h-4 w-4 mr-2" />
              Invitations
            </TabsTrigger>
            <TabsTrigger value="requests">
              <MessageSquare className="h-4 w-4 mr-2" />
              Demandes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restaurants Actifs</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeRestaurants || 0}</div>
              <p className="text-xs text-muted-foreground">Total des établissements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRevenue || 0}€</div>
              <p className="text-xs text-muted-foreground">Abonnements cumulés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversations IA</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
              <p className="text-xs text-muted-foreground">RISE AI™ interactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Restaurants Table avec ResponsiveTable */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Liste des Restaurants</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Gérez tous les restaurants de la plateforme</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <ResponsiveTable
              columns={[
                { key: "name", label: "Nom" },
                { key: "slug", label: "Slug", render: (value) => <code className="text-xs bg-muted px-2 py-1 rounded">{value}</code> },
                { key: "subscriptionTier", label: "Plan", render: (value) => (
                  <Badge 
                    variant={value === "premium" ? "default" : value === "pro" ? "outline" : "secondary"} 
                    className="text-xs"
                  >
                    {value === "premium" ? "Premium - 39€" : value === "pro" ? "Pro - 29€" : "Menu - 19€"}
                  </Badge>
                ) },
                { key: "subscriptionStatus", label: "Statut", render: (value) => (
                  <Badge variant={value === "active" ? "default" : value === "trial" ? "secondary" : "destructive"}>
                    {value}
                  </Badge>
                ) },
                { key: "contact", label: "Contact", render: (_, row) => row.email || row.phone || "-" },
                { key: "actions", label: "Actions", render: (_, row) => (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/${row.slug}`, '_blank')}
                      className="text-xs"
                    >
                      🍽️ Public
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/${row.slug}/dashboard`)}
                      className="text-xs"
                    >
                      📊 Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => createInvitationMutation.mutate({ restaurantId: row.id })}
                      className="text-xs"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Inviter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRestaurant(row)}
                      className="text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer ce restaurant ?")) {
                          deleteMutation.mutate({ id: row.id });
                        }
                      }}
                      className="text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                      Supprimer
                    </Button>
                  </div>
                ) },
              ]}
              data={restaurants || []}
              keyExtractor={(row) => row.id}
              mobileCardRender={(row) => (
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm">{row.name}</div>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{row.slug}</code>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge 
                    variant={row.subscriptionTier === "premium" ? "default" : row.subscriptionTier === "pro" ? "outline" : "secondary"} 
                    className="text-xs"
                  >
                        {row.subscriptionTier === "premium" ? "Premium - 39€" : row.subscriptionTier === "pro" ? "Pro - 29€" : "Menu - 19€"}
                      </Badge>
                      <Badge variant={row.subscriptionStatus === "active" ? "default" : row.subscriptionStatus === "trial" ? "secondary" : "destructive"} className="text-xs">
                        {row.subscriptionStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.email || row.phone || "-"}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/${row.slug}`, '_blank')}
                      className="w-full sm:flex-1 text-xs"
                    >
                      🍽️ Public
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/${row.slug}/dashboard`)}
                      className="w-full sm:flex-1 text-xs"
                    >
                      📊 Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => createInvitationMutation.mutate({ restaurantId: row.id })}
                      className="w-full sm:flex-1 text-xs"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Inviter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRestaurant(row)}
                      className="w-full sm:flex-1 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer ce restaurant ?")) {
                          deleteMutation.mutate({ id: row.id });
                        }
                      }}
                      className="w-full sm:flex-1 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="advertisements">
            <Advertisements />
          </TabsContent>

          <TabsContent value="admins">
            <Admins />
          </TabsContent>

          {/* Tab Invitations */}
          <TabsContent value="invitations">
            <InvitationsTab />
          </TabsContent>

          {/* Tab Demandes */}
          <TabsContent value="requests">
            <RequestsTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un Nouveau Restaurant</DialogTitle>
            <DialogDescription>Ajoutez un nouveau restaurant à la plateforme</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du Restaurant *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (sous-domaine) *</Label>
                  <Input id="slug" name="slug" placeholder="mon-restaurant" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" name="phone" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" name="whatsapp" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscriptionTier">Plan d'Abonnement</Label>
                  <Select name="subscriptionTier" defaultValue="menu">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="menu">Menu - 19€/mois</SelectItem>
                      <SelectItem value="pro">Pro - 29€/mois</SelectItem>
                      <SelectItem value="premium">Premium - 39€/mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" name="address" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRestaurant} onOpenChange={() => setEditingRestaurant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le Restaurant</DialogTitle>
            <DialogDescription>Mettez à jour les informations du restaurant</DialogDescription>
          </DialogHeader>
          {editingRestaurant && (
            <form onSubmit={handleUpdateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom du Restaurant</Label>
                  <Input id="edit-name" name="name" defaultValue={editingRestaurant.name} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingRestaurant.description || ""}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      name="email"
                      type="email"
                      defaultValue={editingRestaurant.email || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Téléphone</Label>
                    <Input id="edit-phone" name="phone" defaultValue={editingRestaurant.phone || ""} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                    <Input
                      id="edit-whatsapp"
                      name="whatsapp"
                      defaultValue={editingRestaurant.whatsapp || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-subscriptionTier">Plan</Label>
                    <Select name="subscriptionTier" defaultValue={editingRestaurant.subscriptionTier}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="menu">Menu - 19€/mois</SelectItem>
                        <SelectItem value="pro">Pro - 29€/mois</SelectItem>
                        <SelectItem value="premium">Premium - 39€/mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-subscriptionStatus">Statut</Label>
                    <Select
                      name="subscriptionStatus"
                      defaultValue={editingRestaurant.subscriptionStatus}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Adresse</Label>
                    <Input
                      id="edit-address"
                      name="address"
                      defaultValue={editingRestaurant.address || ""}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingRestaurant(null)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'invitation */}
      <Dialog open={!!invitationUrl} onOpenChange={() => setInvitationUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lien d'invitation généré</DialogTitle>
            <DialogDescription>
              Envoyez ce lien au propriétaire du restaurant. Il expirera dans 24 heures.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <code className="text-sm break-all">{invitationUrl}</code>
            </div>
            <Button
              onClick={handleCopyInvitation}
              className="w-full"
              variant={copiedInvitation ? "default" : "outline"}
            >
              {copiedInvitation ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier le lien
                </>
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setInvitationUrl(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
