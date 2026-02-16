import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminInviteAccept() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const token = params.token;
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verify invitation token
  const { data: verification, isLoading } = trpc.admin.verifyAdminInvitation.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  useEffect(() => {
    if (!isLoading) {
      setIsChecking(false);
      if (verification && !verification.valid) {
        if (verification.reason === "invalid") {
          setError("Ce lien d'invitation est invalide.");
        } else if (verification.reason === "used") {
          setError("Ce lien d'invitation a déjà été utilisé.");
        } else if (verification.reason === "expired") {
          setError("Ce lien d'invitation a expiré.");
        }
      }
    }
  }, [isLoading, verification]);

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth with token
    window.location.href = `/api/auth/admin-google?token=${token}`;
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Lien invalide</CardTitle>
            </div>
            <CardDescription>
              Le lien d'invitation est manquant ou invalide.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Vérification de l'invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Invitation invalide</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-slate-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Invitation Administrateur</CardTitle>
            <CardDescription className="text-base mt-2">
              Vous avez été invité à devenir administrateur de la plateforme PRONTO
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-amber-900 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privilèges administrateur
            </h3>
            <ul className="text-sm text-amber-800 space-y-1 ml-6 list-disc">
              <li>Accès complet au panel d'administration</li>
              <li>Gestion des restaurants et utilisateurs</li>
              <li>Configuration de la plateforme</li>
              <li>Gestion des publicités et contenus</li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Connectez-vous avec Google pour accepter cette invitation
            </p>
            <Button
              onClick={handleGoogleLogin}
              size="lg"
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 shadow-md"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Se connecter avec Google
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            En acceptant cette invitation, vous devenez administrateur de la plateforme PRONTO
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
