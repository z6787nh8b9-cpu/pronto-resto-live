import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, ShieldOff, UserPlus, Crown, Mail, Clock, CheckCircle, XCircle, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Admins() {
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Queries
  const { data: admins, refetch: refetchAdmins } = trpc.admin.listAdmins.useQuery();
  const { data: allUsers } = trpc.admin.listAllUsers.useQuery();
  const { data: invitations, refetch: refetchInvitations } = trpc.admin.listAdminInvitations.useQuery();

  // Mutations
  const promoteToAdmin = trpc.admin.promoteToAdmin.useMutation({
    onSuccess: () => {
      toast.success("Utilisateur promu admin avec succès");
      refetchAdmins();
      setIsPromoteDialogOpen(false);
      setSelectedUserId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la promotion");
    },
  });

  const demoteToUser = trpc.admin.demoteToUser.useMutation({
    onSuccess: () => {
      toast.success("Admin rétrogradé en utilisateur");
      refetchAdmins();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la rétrogradation");
    },
  });

  const createInvitation = trpc.admin.createAdminInvitation.useMutation({
    onSuccess: (data) => {
      toast.success(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail("");
      setIsInviting(false);
      refetchInvitations();
      
      // Copy invitation link to clipboard
      const invitationUrl = `${window.location.origin}/admin/invite/${data.token}`;
      navigator.clipboard.writeText(invitationUrl);
      toast.success("Lien d'invitation copié dans le presse-papiers");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la création de l'invitation");
      setIsInviting(false);
    },
  });

  const revokeInvitation = trpc.admin.revokeAdminInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation révoquée");
      refetchInvitations();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la révocation");
    },
  });

  const nonAdminUsers = allUsers?.filter(u => u.role !== 'admin') || [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsInviting(true);
    createInvitation.mutate({ email: inviteEmail });
  };

  const handleCopyInviteLink = (token: string) => {
    const invitationUrl = `${window.location.origin}/admin/invite/${token}`;
    navigator.clipboard.writeText(invitationUrl);
    toast.success("Lien copié dans le presse-papiers");
  };

  const isInvitationExpired = (expiresAt: Date) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Administrateurs</h2>
          <p className="text-muted-foreground">Gérez les comptes administrateurs de la plateforme</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            <Shield className="h-4 w-4 mr-2" />
            Admins Actifs ({admins?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="invite">
            <Mail className="h-4 w-4 mr-2" />
            Inviter par Email
          </TabsTrigger>
          <TabsTrigger value="promote">
            <UserPlus className="h-4 w-4 mr-2" />
            Promouvoir Utilisateur
          </TabsTrigger>
        </TabsList>

        {/* Active Admins Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Administrateurs Actifs</CardTitle>
              <CardDescription>
                {admins?.length || 0} administrateur(s) avec accès complet à la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {admins?.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{admin.name || 'Sans nom'}</p>
                          <Badge variant="default" className="bg-amber-600">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{admin.email || 'Pas d\'email'}</p>
                        <p className="text-xs text-muted-foreground">
                          Dernière connexion : {admin.lastSignedIn ? new Date(admin.lastSignedIn).toLocaleDateString('fr-FR') : 'Jamais'}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir rétrograder ${admin.name || 'cet utilisateur'} ?`)) {
                          demoteToUser.mutate({ userId: admin.id });
                        }
                      }}
                      disabled={demoteToUser.isPending}
                    >
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Rétrograder
                    </Button>
                  </div>
                ))}

                {admins?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Aucun administrateur trouvé</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invite by Email Tab */}
        <TabsContent value="invite" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Inviter un administrateur par email
              </CardTitle>
              <CardDescription>
                Envoyez une invitation par email avec un lien d'activation unique (valide 7 jours)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={isInviting}
                    required
                  />
                </div>
                <Button type="submit" disabled={isInviting || !inviteEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  {isInviting ? "Envoi..." : "Envoyer l'invitation"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Invitations en attente ({invitations?.filter(i => !i.usedAt).length || 0})
              </CardTitle>
              <CardDescription>
                Invitations envoyées mais pas encore acceptées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitations && invitations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Créée le</TableHead>
                      <TableHead>Expire le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => {
                      const expired = isInvitationExpired(invitation.expiresAt);
                      const used = !!invitation.usedAt;
                      
                      return (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">{invitation.email}</TableCell>
                          <TableCell>
                            {used ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Acceptée
                              </Badge>
                            ) : expired ? (
                              <Badge variant="destructive">
                                <XCircle className="mr-1 h-3 w-3" />
                                Expirée
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="mr-1 h-3 w-3" />
                                En attente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(invitation.createdAt).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            {new Date(invitation.expiresAt).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              {!used && !expired && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyInviteLink(invitation.token)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Êtes-vous sûr de vouloir révoquer l'invitation pour ${invitation.email} ?`)) {
                                    revokeInvitation.mutate({ id: invitation.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucune invitation en attente
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promote User Tab */}
        <TabsContent value="promote">
          <Card>
            <CardHeader>
              <CardTitle>Promouvoir un utilisateur existant</CardTitle>
              <CardDescription>
                Sélectionnez un utilisateur déjà inscrit pour lui donner les droits d'administrateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select
                  value={selectedUserId?.toString()}
                  onValueChange={(value) => setSelectedUserId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {nonAdminUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex flex-col">
                          <span>{user.name || 'Sans nom'}</span>
                          <span className="text-xs text-muted-foreground">{user.email || 'Pas d\'email'}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {nonAdminUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Tous les utilisateurs sont déjà administrateurs
                  </p>
                )}

                <Button
                  onClick={() => {
                    if (selectedUserId) {
                      promoteToAdmin.mutate({ userId: selectedUserId });
                    }
                  }}
                  disabled={!selectedUserId || promoteToAdmin.isPending}
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Promouvoir en Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
