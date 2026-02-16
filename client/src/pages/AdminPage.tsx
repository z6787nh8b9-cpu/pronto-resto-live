import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Shield, Mail, Clock, CheckCircle, XCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export function AdminPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Queries
  const { data: admins, refetch: refetchAdmins } = trpc.admin.listAdmins.useQuery();
  const { data: invitations, refetch: refetchInvitations } = trpc.admin.listAdminInvitations.useQuery();

  // Mutations
  const createInvitation = trpc.admin.createAdminInvitation.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Invitation envoyée",
        description: `Un email d'invitation a été envoyé à ${inviteEmail}`,
      });
      setInviteEmail("");
      setIsInviting(false);
      refetchInvitations();
      
      // Copy invitation link to clipboard
      const invitationUrl = `${window.location.origin}/admin/invite/${data.token}`;
      navigator.clipboard.writeText(invitationUrl);
      toast({
        title: "Lien copié",
        description: "Le lien d'invitation a été copié dans le presse-papiers",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
      setIsInviting(false);
    },
  });

  const revokeInvitation = trpc.admin.revokeAdminInvitation.useMutation({
    onSuccess: () => {
      toast({
        title: "Invitation révoquée",
        description: "L'invitation a été supprimée avec succès",
      });
      refetchInvitations();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const demoteAdmin = trpc.admin.demoteToUser.useMutation({
    onSuccess: () => {
      toast({
        title: "Admin rétrogradé",
        description: "L'administrateur a été rétrogradé en utilisateur",
      });
      refetchAdmins();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsInviting(true);
    createInvitation.mutate({ email: inviteEmail });
  };

  const handleCopyInviteLink = (token: string) => {
    const invitationUrl = `${window.location.origin}/admin/invite/${token}`;
    navigator.clipboard.writeText(invitationUrl);
    toast({
      title: "Lien copié",
      description: "Le lien d'invitation a été copié dans le presse-papiers",
    });
  };

  const isInvitationExpired = (expiresAt: Date) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Administrateurs</h1>
          <p className="text-muted-foreground">
            Gérez les super administrateurs de la plateforme PRONTO
          </p>
        </div>

        {/* Invite Admin Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Inviter un administrateur
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

        {/* Current Admins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Administrateurs actifs ({admins?.length || 0})
            </CardTitle>
            <CardDescription>
              Liste des super administrateurs ayant accès au panel d'administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {admins && admins.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name || "—"}</TableCell>
                      <TableCell>{admin.email || "—"}</TableCell>
                      <TableCell>
                        {admin.lastSignedIn ? new Date(admin.lastSignedIn).toLocaleDateString('fr-FR') : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Êtes-vous sûr de vouloir rétrograder ${admin.name || admin.email} ?`)) {
                              demoteAdmin.mutate({ userId: admin.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Aucun administrateur actif
              </p>
            )}
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
      </div>
    </DashboardLayout>
  );
}
