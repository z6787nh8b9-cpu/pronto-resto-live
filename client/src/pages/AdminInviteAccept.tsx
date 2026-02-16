import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";

export function AdminInviteAccept() {
  const [, params] = useRoute("/admin/invite/:token");
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "expired" | "used">("loading");
  const [invitationEmail, setInvitationEmail] = useState<string>("");

  const token = params?.token || "";
  const { user } = trpc.auth.me.useQuery();

  // Check invitation validity
  const { data: invitationCheck } = trpc.admin.checkAdminInvitation.useQuery(
    { token },
    { enabled: !!token }
  );

  // Accept invitation mutation
  const acceptInvitation = trpc.admin.acceptAdminInvitation.useMutation({
    onSuccess: () => {
      setLocation("/admin");
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    if (invitationCheck) {
      if (!invitationCheck.valid) {
        setStatus(invitationCheck.reason as any);
        setInvitationEmail(invitationCheck.email || "");
      } else {
        setStatus("valid");
        setInvitationEmail(invitationCheck.email || "");
        
        // If user is already logged in, try to accept automatically
        if (user && user.email === invitationCheck.email) {
          acceptInvitation.mutate({ token });
        }
      }
    }
  }, [token, invitationCheck, user]);

  const handleLogin = () => {
    // Redirect to Manus OAuth login
    // After login, the backend will check if the user's email matches the invitation
    // and automatically promote them to admin
    window.location.href = getLoginUrl(`/admin/invite/${token}`);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pronto-primary/10 to-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-pronto-primary" />
              <p className="text-muted-foreground">Vérification de l'invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 to-background">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invitation invalide</CardTitle>
            </div>
            <CardDescription>
              Ce lien d'invitation n'est pas valide ou a été révoqué.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setLocation("/")} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 to-background">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invitation expirée</CardTitle>
            </div>
            <CardDescription>
              Cette invitation a expiré. Veuillez contacter un administrateur pour recevoir une nouvelle invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setLocation("/")} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "used") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500/10 to-background">
        <Card className="w-full max-w-md border-green-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <CardTitle>Invitation déjà utilisée</CardTitle>
            </div>
            <CardDescription>
              Cette invitation a déjà été acceptée. Vous pouvez vous connecter avec votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogin} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // status === "valid"
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pronto-primary/10 to-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-pronto-primary" />
            <CardTitle>Invitation Administrateur</CardTitle>
          </div>
          <CardDescription>
            Vous avez été invité à devenir super administrateur de PRONTO
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Privilèges administrateur</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Gestion complète des restaurants</li>
              <li>• Accès aux statistiques globales</li>
              <li>• Gestion des publicités</li>
              <li>• Invitation d'autres administrateurs</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Pour accepter cette invitation, connectez-vous avec votre compte Manus.
            </p>
            <Button onClick={handleLogin} className="w-full" size="lg">
              <Shield className="mr-2 h-4 w-4" />
              Se connecter et accepter
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Cette invitation expire dans 7 jours et ne peut être utilisée qu'une seule fois.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
