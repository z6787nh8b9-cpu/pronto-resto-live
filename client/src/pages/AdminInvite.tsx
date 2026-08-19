/**
 * Admin Invitation Page
 * Allows invited users to create an admin account with email/password
 */

import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, CheckCircle2 } from "lucide-react";

export default function AdminInvite() {
  const params = useParams();
  const token = params.token as string;
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const { data: invitation, isLoading: isCheckingInvitation } = trpc.admin.checkLocalAdminInvitation.useQuery(
    { token: token || "" },
    { enabled: !!token, retry: false },
  );
  const registerMutation = trpc.admin.acceptLocalAdminInvitation.useMutation({
    onSuccess: () => {
      setLocation("/admin/login");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    if (invitation?.valid) {
      setEmail(invitation.email ?? "");
      if (invitation.name) setName(invitation.name ?? "");
    }
  }, [invitation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!email || !name || !password || !confirmPassword) {
      setError("Tous les champs sont requis");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError("Le mot de passe doit contenir 12 caractères, une majuscule, une minuscule et un chiffre.");
      return;
    }

    // Submit registration
    registerMutation.mutate({
      token,
      email,
      name,
      password,
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Token manquant</CardTitle>
            <CardDescription>
              Le lien d'invitation est invalide. Veuillez contacter l'administrateur.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isCheckingInvitation) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-pronto-primary" /></div>;
  }

  if (!invitation?.valid) {
    return <div className="min-h-screen flex items-center justify-center bg-background p-4"><Card className="w-full max-w-md"><CardHeader><CardTitle>Invitation invalide</CardTitle><CardDescription>Ce lien est expiré, déjà utilisé ou ne correspond plus à une invitation active.</CardDescription></CardHeader></Card></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Invitation Administrateur</CardTitle>
            <CardDescription className="mt-2">
              Vous avez été invité à devenir administrateur de la plateforme PRONTO
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
            <h3 className="font-semibold text-sm text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privilèges administrateur
            </h3>
            <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
              <li>• Accès complet au panel d'administration</li>
              <li>• Gestion des restaurants et utilisateurs</li>
              <li>• Configuration de la plateforme</li>
              <li>• Gestion des publicités et contenus</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={registerMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={registerMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                12 caractères minimum, avec majuscule, minuscule et chiffre
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={registerMutation.isPending}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création du compte...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Créer mon compte administrateur
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              En acceptant cette invitation, vous devenez administrateur de la plateforme PRONTO
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
