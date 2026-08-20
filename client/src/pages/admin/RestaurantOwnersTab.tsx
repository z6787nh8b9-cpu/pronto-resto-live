import { KeyRound, Store } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/LoadingState";

const providerLabels: Record<string, string> = {
  email: "Adresse e-mail",
  google: "Google",
  facebook: "Facebook",
};

export default function RestaurantOwnersTab() {
  const { data: owners, isLoading } = trpc.admin.listRestaurantOwners.useQuery();

  if (isLoading) {
    return <LoadingState label="Chargement des propriétaires" />;
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-pronto-primary" /> Propriétaires</CardTitle>
        <CardDescription>Répertoire de supervision. Les secrets de connexion et les sessions ne sont jamais affichés ici.</CardDescription>
      </CardHeader>
      <CardContent>
        {!owners?.length ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Aucun propriétaire local n’est encore associé à un établissement.</p>
        ) : (
          <div className="divide-y rounded-xl border" role="list" aria-label="Propriétaires restaurateurs">
            {owners.map((owner) => (
              <article key={owner.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" role="listitem">
                <div className="min-w-0">
                  <p className="truncate font-medium">{owner.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{owner.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="secondary">{providerLabels[owner.provider] ?? owner.provider}</Badge>
                  {owner.restaurantId ? (
                    <Badge variant={owner.restaurantIsActive ? "outline" : "secondary"} className="max-w-full gap-1 truncate"><Store className="h-3.5 w-3.5 shrink-0" />{owner.restaurantName}</Badge>
                  ) : (
                    <span className="text-muted-foreground">Aucun établissement associé</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
