/**
 * Invite Accept Page
 * Handles restaurant owner invitation acceptance
 */

import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, Clock } from "lucide-react";

export default function InviteAccept() {
  const [, params] = useRoute("/invite/:token");
  const [, setLocation] = useLocation();
  const token = params?.token || "";

  // Query invitation details
  const { data, isLoading, error } = trpc.invitations.getByToken.useQuery(
    { token },
    { enabled: !!token }
  );

  useEffect(() => {
    // If invitation is valid, redirect to login with token
    if (data?.valid && data.invitation) {
      // Redirect to login page with token parameter
      setTimeout(() => {
        setLocation(`/login-restaurant?token=${token}`);
      }, 2000);
    }
  }, [data, token, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <img src="/pronto-logo.png" alt="PRONTO" className="mx-auto h-24 w-24" />
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              PRONTO
            </CardTitle>
            <CardDescription>Vérification de l'invitation...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-amber-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <img src="/pronto-logo.png" alt="PRONTO" className="mx-auto h-24 w-24" />
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              PRONTO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Une erreur s'est produite lors de la vérification de l'invitation.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid invitation
  if (!data.valid) {
    let errorTitle = "Invitation invalide";
    let errorMessage = "Ce lien d'invitation n'est pas valide.";
    let errorIcon = <AlertCircle className="h-12 w-12 text-destructive" />;

    if (data.reason === "not_found") {
      errorMessage = "Ce lien d'invitation n'existe pas.";
    } else if (data.reason === "already_used") {
      errorTitle = "Invitation déjà utilisée";
      errorMessage = "Ce lien d'invitation a déjà été utilisé.";
      errorIcon = <CheckCircle className="h-12 w-12 text-amber-600" />;
    } else if (data.reason === "expired") {
      errorTitle = "Invitation expirée";
      errorMessage = "Ce lien d'invitation a expiré (validité : 24 heures).";
      errorIcon = <Clock className="h-12 w-12 text-muted-foreground" />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <img src="/pronto-logo.png" alt="PRONTO" className="mx-auto h-24 w-24" />
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              PRONTO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              {errorIcon}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">{errorTitle}</h3>
                <p className="text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
            <Alert>
              <AlertDescription>
                Veuillez contacter l'administrateur pour obtenir un nouveau lien d'invitation.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              className="w-full"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invitation - show success and redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <img src="/pronto-logo.png" alt="PRONTO" className="mx-auto h-24 w-24" />
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            PRONTO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">Invitation valide !</h3>
              <p className="text-muted-foreground">
                Vous avez été invité à gérer l’entreprise :
              </p>
              <p className="text-xl font-bold text-amber-600">
                {data.restaurant?.name}
              </p>
            </div>
          </div>
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-900">
              Vous allez être redirigé vers la page de connexion...
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
