import { useEffect, useState } from "react";
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
import { Plus, Edit, Trash2, TrendingUp, Store, MessageSquare, Settings, Megaphone, Shield, Mail, Copy, Check, Search, ArrowUpRight, Building2, FileUp, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
// import { useAuth } from "@/_core/hooks/useAuth"; // Remplacé par trpc.adminAuth.me
import { ResponsiveHeader, ResponsiveTable } from "@/components/responsive";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Advertisements from "./admin/Advertisements";
import Admins from "./admin/Admins";
import InvitationsTab from "./admin/InvitationsTab";
import RequestsTab from "./admin/RequestsTab";
import RestaurantOwnersTab from "./admin/RestaurantOwnersTab";

export default function SuperAdmin() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [copiedInvitation, setCopiedInvitation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  // const { user, loading } = useAuth(); // Remplacé par trpc.adminAuth.me
  const { data: adminUser, isLoading: loading } = trpc.adminAuth.me.useQuery();

  // Vérification d'authentification admin
  const isDev = false; // Authentification requise en production

  // Queries - MUST be before any conditional returns (React hooks rules)
  const { data: stats } = trpc.admin.getStats.useQuery(undefined, { enabled: isDev || !!adminUser });
  const { data: restaurants, refetch } = trpc.admin.listRestaurants.useQuery(undefined, { enabled: isDev || !!adminUser });

  useEffect(() => {
    if (!isDev && !loading && !adminUser) {
      setLocation("/admin/login");
    }
  }, [adminUser, isDev, loading, setLocation]);

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

  // Redirect to login if not authenticated as admin
  if (!isDev && !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
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
        subtitle="Pilotage multi-entreprises"
        primaryAction={{
          label: "Nouvelle entreprise",
          onClick: () => setIsCreateDialogOpen(true),
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      <main className="container px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex min-w-max gap-1">
            <TabsTrigger value="overview">
              <Building2 className="h-4 w-4 mr-2" />
              Vue d’ensemble
            </TabsTrigger>
            <TabsTrigger value="restaurants">
              <Store className="h-4 w-4 mr-2" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="owners">
              <UsersRound className="h-4 w-4 mr-2" />
              Propriétaires
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
          </div>

          <TabsContent value="overview" className="space-y-6">
            <section className="pronto-shell overflow-hidden p-1.5">
              <div className="relative overflow-hidden rounded-[calc(1.5rem-0.375rem)] bg-pronto-primary-deep px-5 py-8 text-white sm:px-8 sm:py-10">
                <div className="absolute -right-10 top-0 h-56 w-56 rounded-full bg-pronto-accent/20 blur-3xl" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl"><p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-white/65">Centre de contrôle</p><h2 className="mt-3 text-4xl text-white sm:text-5xl">Une vue claire sur votre réseau d’entreprises.</h2><p className="mt-4 max-w-xl leading-7 text-white/70">Surveillez l’activité, préparez les accès et intervenez au bon endroit, sans mélanger supervision et travail quotidien des équipes.</p></div>
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="group h-12 w-full rounded-full bg-white px-5 text-pronto-primary hover:bg-pronto-beige sm:w-auto">Ajouter une entreprise <span className="ml-2 grid h-6 w-6 place-items-center rounded-full bg-pronto-primary/10 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px"><Plus className="h-3.5 w-3.5" /></span></Button>
                </div>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <div className="pronto-panel p-5"><p className="text-sm text-muted-foreground">Entreprises actives</p><p className="mt-2 font-display text-5xl">{stats?.activeRestaurants || 0}</p><p className="mt-2 text-sm text-muted-foreground">Comptes actuellement actifs.</p></div>
              <div className="pronto-panel p-5"><p className="text-sm text-muted-foreground">Revenus suivis</p><p className="mt-2 font-display text-5xl">{stats?.totalRevenue || 0}€</p><p className="mt-2 text-sm text-muted-foreground">Valeur des abonnements enregistrés.</p></div>
              <div className="pronto-panel p-5"><p className="text-sm text-muted-foreground">Conversations assistées</p><p className="mt-2 font-display text-5xl">{stats?.totalConversations || 0}</p><p className="mt-2 text-sm text-muted-foreground">Interactions gérées par l’assistance.</p></div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <button type="button" onClick={() => setActiveTab("restaurants")} className="pronto-panel group p-5 text-left transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-pronto-primary/10 text-pronto-primary"><Store className="h-5 w-5" /></span><h3 className="mt-7 text-3xl">Entreprises</h3><p className="mt-3 leading-7 text-muted-foreground">Ouvrez, recherchez et gérez les espaces actuellement hébergés sur la plateforme.</p><span className="mt-6 inline-flex items-center text-sm font-semibold text-pronto-primary">Ouvrir la liste <ArrowUpRight className="ml-1.5 h-4 w-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-0.5" /></span></button>
              <button type="button" onClick={() => setActiveTab("invitations")} className="pronto-panel group p-5 text-left transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-pronto-accent/25 text-pronto-primary"><Mail className="h-5 w-5" /></span><h3 className="mt-7 text-3xl">Accès & invitations</h3><p className="mt-3 leading-7 text-muted-foreground">Accompagnez les propriétaires dans une prise en main sécurisée de leur espace.</p><span className="mt-6 inline-flex items-center text-sm font-semibold text-pronto-primary">Gérer les accès <ArrowUpRight className="ml-1.5 h-4 w-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-0.5" /></span></button>
              <button type="button" onClick={() => setActiveTab("requests")} className="pronto-panel group p-5 text-left transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-pronto-primary"><FileUp className="h-5 w-5" /></span><h3 className="mt-7 text-3xl">Demandes à traiter</h3><p className="mt-3 leading-7 text-muted-foreground">Gardez une entrée unique pour les demandes de support et les signaux à suivre.</p><span className="mt-6 inline-flex items-center text-sm font-semibold text-pronto-primary">Voir les demandes <ArrowUpRight className="ml-1.5 h-4 w-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-0.5" /></span></button>
            </section>
          </TabsContent>

          <TabsContent value="restaurants">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entreprises actives</CardTitle>
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

        {/* Liste d'entreprises avec ResponsiveTable */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Liste des entreprises</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Gérez toutes les entreprises de la plateforme</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une entreprise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
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
                      Voir la vitrine
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/${row.slug}/dashboard`)}
                      className="text-xs"
                    >
                      Gérer l’espace
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
                        if (confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) {
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
              data={(restaurants || []).filter(restaurant => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  restaurant.name?.toLowerCase().includes(query) ||
                  restaurant.slug?.toLowerCase().includes(query) ||
                  restaurant.email?.toLowerCase().includes(query) ||
                  restaurant.phone?.toLowerCase().includes(query)
                );
              })}
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
                      Voir la vitrine
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
                        if (confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) {
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

          <TabsContent value="owners">
            <RestaurantOwnersTab />
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
            <DialogTitle>Créer une nouvelle entreprise</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle entreprise à la plateforme</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l’entreprise *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (sous-domaine) *</Label>
                  <Input id="slug" name="slug" placeholder="mon-entreprise" required />
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
            <DialogTitle>Modifier l’entreprise</DialogTitle>
            <DialogDescription>Mettez à jour les informations de l’entreprise</DialogDescription>
          </DialogHeader>
          {editingRestaurant && (
            <form onSubmit={handleUpdateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom de l’entreprise</Label>
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
              Envoyez ce lien au propriétaire de l’entreprise. Il expirera dans 24 heures.
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
