import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock3, Copy, Mail, Shield, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function Admins() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [lastInvitationUrl, setLastInvitationUrl] = useState<string | null>(null);
  const { data: admins } = trpc.admin.listAdmins.useQuery();
  const { data: invitations, refetch } = trpc.admin.listLocalAdminInvitations.useQuery();
  const createInvitation = trpc.admin.createLocalAdminInvitation.useMutation({
    onSuccess: async ({ token }) => {
      const url = `${window.location.origin}/invite-admin/${token}`;
      setLastInvitationUrl(url);
      setEmail("");
      setName("");
      await refetch();
      try { await navigator.clipboard.writeText(url); toast.success("Lien sécurisé copié dans le presse-papiers."); }
      catch { toast.success("Invitation créée. Copiez le lien affiché ci-dessous."); }
    },
    onError: (error) => toast.error(error.message),
  });
  const revokeInvitation = trpc.admin.revokeLocalAdminInvitation.useMutation({
    onSuccess: async () => { await refetch(); toast.success("Invitation révoquée."); },
    onError: (error) => toast.error(error.message),
  });

  const copyLastInvitation = async () => {
    if (!lastInvitationUrl) return;
    await navigator.clipboard.writeText(lastInvitationUrl);
    toast.success("Lien copié.");
  };
  const status = (value: "pending" | "accepted" | "revoked" | "expired") => {
    if (value === "accepted") return <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" />Acceptée</Badge>;
    if (value === "pending") return <Badge variant="secondary"><Clock3 className="mr-1 h-3 w-3" />En attente</Badge>;
    return <Badge variant="outline">{value === "revoked" ? "Révoquée" : "Expirée"}</Badge>;
  };

  return <div className="space-y-7">
    <section className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-pronto-primary" />Inviter un Super Admin</CardTitle><CardDescription>L’accès est strictement lié à l’adresse renseignée, valable sept jours et consommable une seule fois.</CardDescription></CardHeader><CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); createInvitation.mutate({ email, name: name || undefined }); }}>
          <div className="space-y-2"><Label htmlFor="admin-email">Adresse professionnelle</Label><Input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="prenom@entreprise.fr" required disabled={createInvitation.isPending} /></div>
          <div className="space-y-2"><Label htmlFor="admin-name">Nom <span className="text-muted-foreground">(facultatif)</span></Label><Input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Prénom Nom" disabled={createInvitation.isPending} /></div>
          <Button type="submit" className="sm:col-span-2" disabled={createInvitation.isPending}><Mail className="mr-2 h-4 w-4" />{createInvitation.isPending ? "Création…" : "Créer l’invitation sécurisée"}</Button>
        </form>
        {lastInvitationUrl && <div className="mt-5 rounded-xl border border-pronto-primary/20 bg-pronto-primary/5 p-4"><p className="text-sm font-medium">Lien à transmettre de manière sécurisée</p><div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 break-all text-xs text-muted-foreground">{lastInvitationUrl}</code><Button type="button" size="icon" variant="outline" onClick={copyLastInvitation} aria-label="Copier le lien"><Copy className="h-4 w-4" /></Button></div><p className="mt-2 text-xs text-muted-foreground">Il n’est plus affichable après fermeture de cette page : seul son hachage est conservé.</p></div>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-pronto-primary" />Accès actifs</CardTitle><CardDescription>{admins?.length ?? 0} compte(s) local(aux) habilité(s).</CardDescription></CardHeader><CardContent className="space-y-3">{admins?.map((admin) => <div key={admin.id} className="rounded-xl border p-3"><p className="font-medium">{admin.name || "Sans nom"}</p><p className="truncate text-sm text-muted-foreground">{admin.email}</p></div>)}</CardContent></Card>
    </section>
    <Card><CardHeader><CardTitle>Historique des invitations</CardTitle><CardDescription>Les jetons ne sont jamais affichés ni stockés en clair.</CardDescription></CardHeader><CardContent>{invitations?.length ? <Table><TableHeader><TableRow><TableHead>Destinataire</TableHead><TableHead>Statut</TableHead><TableHead>Créée</TableHead><TableHead>Expiration</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{invitations.map((invitation) => <TableRow key={invitation.id}><TableCell><p className="font-medium">{invitation.name || "Sans nom"}</p><p className="text-sm text-muted-foreground">{invitation.email}</p></TableCell><TableCell>{status(invitation.status)}</TableCell><TableCell>{new Date(invitation.createdAt).toLocaleDateString("fr-FR")}</TableCell><TableCell>{new Date(invitation.expiresAt).toLocaleDateString("fr-FR")}</TableCell><TableCell className="text-right">{invitation.status === "pending" && <Button size="icon" variant="ghost" onClick={() => revokeInvitation.mutate({ id: invitation.id })} disabled={revokeInvitation.isPending} aria-label="Révoquer l’invitation"><Trash2 className="h-4 w-4 text-destructive" /></Button>}</TableCell></TableRow>)}</TableBody></Table> : <p className="py-7 text-center text-sm text-muted-foreground">Aucune invitation Super Admin n’a été créée.</p>}</CardContent></Card>
  </div>;
}
