import { useState } from "react";
import { ArrowRightLeft, KeyRound, Store, Unlink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/LoadingState";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const providerLabels: Record<string, string> = { email: "Adresse e-mail", google: "Google", facebook: "Facebook" };
type Owner = { id: number; name: string; email: string; provider: string; restaurantId: number | null; restaurantName: string | null; restaurantIsActive: boolean | null; isSuspended: boolean };

export default function RestaurantOwnersTab() {
  const utils = trpc.useUtils();
  const { data: owners, isLoading } = trpc.admin.listRestaurantOwners.useQuery();
  const [ownerForAction, setOwnerForAction] = useState<Owner | null>(null);
  const [targetOwnerId, setTargetOwnerId] = useState("");
  const close = () => { setOwnerForAction(null); setTargetOwnerId(""); };
  const transfer = trpc.admin.transferRestaurantOwner.useMutation({ onSuccess: async () => { await utils.admin.listRestaurantOwners.invalidate(); toast.success("Propriétaire transféré."); close(); }, onError: (error) => toast.error(error.message) });
  const unassign = trpc.admin.unassignRestaurantOwner.useMutation({ onSuccess: async () => { await utils.admin.listRestaurantOwners.invalidate(); toast.success("Établissement dissocié du propriétaire."); close(); }, onError: (error) => toast.error(error.message) });
  const suspension = trpc.admin.setRestaurantOwnerSuspension.useMutation({ onSuccess: async (_, variables) => { await utils.admin.listRestaurantOwners.invalidate(); toast.success(variables.isSuspended ? "Compte propriétaire suspendu et sessions révoquées." : "Compte propriétaire rétabli."); close(); }, onError: (error) => toast.error(error.message) });

  if (isLoading) return <LoadingState label="Chargement des propriétaires" />;

  return <>
    <Card className="border-border/70 shadow-sm">
      <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-pronto-primary" /> Propriétaires</CardTitle><CardDescription>Répertoire de supervision. Les secrets de connexion et les sessions ne sont jamais affichés ici.</CardDescription></CardHeader>
      <CardContent>
        {!owners?.length ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Aucun propriétaire local n’est encore associé à un établissement.</p> : <div className="divide-y rounded-xl border" role="list" aria-label="Propriétaires restaurateurs">{owners.map((owner) => <article key={owner.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" role="listitem"><div className="min-w-0"><p className="truncate font-medium">{owner.name}</p><p className="truncate text-sm text-muted-foreground">{owner.email}</p></div><div className="flex flex-wrap items-center gap-2 text-sm"><Badge variant="secondary">{providerLabels[owner.provider] ?? owner.provider}</Badge>{owner.isSuspended ? <Badge variant="destructive">Suspendu</Badge> : null}{owner.restaurantId ? <><Badge variant={owner.restaurantIsActive ? "outline" : "secondary"} className="max-w-full gap-1 truncate"><Store className="h-3.5 w-3.5 shrink-0" />{owner.restaurantName}</Badge><Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOwnerForAction(owner)}><ArrowRightLeft className="h-3.5 w-3.5" />Gérer</Button></> : <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOwnerForAction(owner)}><ArrowRightLeft className="h-3.5 w-3.5" />Gérer</Button>}</div></article>)}</div>}
      </CardContent>
    </Card>
    <Dialog open={Boolean(ownerForAction)} onOpenChange={(open) => !open && close()}>
      <DialogContent><DialogHeader><DialogTitle>Gérer le propriétaire</DialogTitle><DialogDescription>{ownerForAction ? <>{ownerForAction.restaurantId ? <>« {ownerForAction.restaurantName} » est associé à {ownerForAction.name}. Un transfert retire son accès à cet établissement lors de la prochaine requête autorisée.</> : <>Ce propriétaire n’est associé à aucun établissement.</>} La suspension bloque toutes ses connexions et conserve les établissements associés.</> : null}</DialogDescription></DialogHeader>{ownerForAction?.restaurantId ? <div className="space-y-2"><label className="text-sm font-medium" htmlFor="target-owner">Nouveau propriétaire</label><Select value={targetOwnerId} onValueChange={setTargetOwnerId}><SelectTrigger id="target-owner"><SelectValue placeholder="Choisir un propriétaire existant" /></SelectTrigger><SelectContent>{owners?.filter((owner) => owner.id !== ownerForAction.id && !owner.isSuspended).map((owner) => <SelectItem key={owner.id} value={String(owner.id)}>{owner.name} · {owner.email}</SelectItem>)}</SelectContent></Select></div> : null}<DialogFooter className="gap-2 sm:gap-0"><Button variant="outline" onClick={close}>Annuler</Button><Button variant={ownerForAction?.isSuspended ? "outline" : "destructive"} disabled={!ownerForAction || suspension.isPending} onClick={() => ownerForAction && suspension.mutate({ ownerId: ownerForAction.id, isSuspended: !ownerForAction.isSuspended })}>{ownerForAction?.isSuspended ? "Rétablir le compte" : "Suspendre le compte"}</Button>{ownerForAction?.restaurantId ? <Button variant="destructive" className="gap-1.5" disabled={unassign.isPending} onClick={() => unassign.mutate({ restaurantId: ownerForAction.restaurantId! })}><Unlink className="h-4 w-4" />Dissocier</Button> : null}{ownerForAction?.restaurantId ? <Button className="gap-1.5 bg-pronto-primary" disabled={!targetOwnerId || transfer.isPending} onClick={() => transfer.mutate({ restaurantId: ownerForAction.restaurantId!, targetOwnerId: Number(targetOwnerId) })}><ArrowRightLeft className="h-4 w-4" />Transférer</Button> : null}</DialogFooter></DialogContent>
    </Dialog>
  </>;
}
