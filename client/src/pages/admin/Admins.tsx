import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ShieldOff, UserPlus, Crown } from "lucide-react";
import { toast } from "sonner";

export default function Admins() {
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: admins, refetch: refetchAdmins } = trpc.admin.listAdmins.useQuery();
  const { data: allUsers } = trpc.admin.listAllUsers.useQuery();
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

  const nonAdminUsers = allUsers?.filter(u => u.role !== 'admin') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Administrateurs</h2>
          <p className="text-muted-foreground">Gérez les comptes administrateurs de la plateforme</p>
        </div>
        <Button onClick={() => setIsPromoteDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un Admin
        </Button>
      </div>

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

      {/* Dialog pour promouvoir un utilisateur */}
      <Dialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promouvoir un utilisateur en Admin</DialogTitle>
            <DialogDescription>
              Sélectionnez un utilisateur pour lui donner les droits d'administrateur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (selectedUserId) {
                  promoteToAdmin.mutate({ userId: selectedUserId });
                }
              }}
              disabled={!selectedUserId || promoteToAdmin.isPending}
            >
              <Shield className="h-4 w-4 mr-2" />
              Promouvoir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
