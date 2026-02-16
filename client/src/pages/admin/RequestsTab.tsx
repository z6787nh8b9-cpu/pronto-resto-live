import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function RequestsTab() {
  const { data: requests, refetch } = trpc.chatbotRequests.list.useQuery();
  const updateStatusMutation = trpc.chatbotRequests.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "default", label: "En attente" },
      contacted: { variant: "secondary", label: "Contacté" },
      resolved: { variant: "outline", label: "Résolu" },
      dismissed: { variant: "destructive", label: "Ignoré" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === "call_request" ? (
      <Badge className="bg-blue-500">📞 Demande d'appel</Badge>
    ) : (
      <Badge className="bg-orange-500">⚠️ Signalement</Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Demandes chatbot</h2>
        <Badge variant="outline">{requests?.length || 0} demandes</Badge>
      </div>

      <div className="grid gap-4">
        {requests?.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(request.type)}
                    {getStatusBadge(request.status)}
                  </div>
                  <CardTitle className="text-lg">
                    {request.name || "Anonyme"}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {request.email && <div>📧 {request.email}</div>}
                    {request.phone && <div>📞 {request.phone}</div>}
                    <div>
                      🕒 {format(new Date(request.createdAt), "PPP à HH:mm", { locale: fr })}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Message :</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {request.message}
                </p>
              </div>

              {request.adminNotes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes admin :</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {request.adminNotes}
                  </p>
                </div>
              )}

              {editingId === request.id ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Notes admin..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        updateStatusMutation.mutate({
                          id: request.id,
                          status: "contacted",
                          adminNotes,
                        });
                        setEditingId(null);
                        setAdminNotes("");
                      }}
                    >
                      Marquer comme contacté
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        updateStatusMutation.mutate({
                          id: request.id,
                          status: "resolved",
                          adminNotes,
                        });
                        setEditingId(null);
                        setAdminNotes("");
                      }}
                    >
                      Résolu
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(null);
                        setAdminNotes("");
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {request.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingId(request.id);
                        setAdminNotes(request.adminNotes || "");
                      }}
                    >
                      Traiter
                    </Button>
                  )}
                  {request.status !== "dismissed" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        updateStatusMutation.mutate({
                          id: request.id,
                          status: "dismissed",
                        });
                      }}
                    >
                      Ignorer
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {(!requests || requests.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Aucune demande pour le moment
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
