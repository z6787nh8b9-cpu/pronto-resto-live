/**
 * Admin Invitation Page
 * Allows invited users to create an admin account with email/password
 */

import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, CheckCircle2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function AdminInvite() {
  const params = useParams();
  const token = params.token as string;
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Get the current origin to build the login link
  const loginUrl = `${window.location.origin}/admin`;

  const registerMutation = trpc.adminAuth.register.useMutation({
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

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

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
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

  const copyLoginLink = () => {
    navigator.clipboard.writeText(loginUrl);
    setCopiedLink(true);
    toast.success("Lien copié dans le presse-papiers !");
    setTimeout(() => setCopiedLink(false), 2000);
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

  // Success screen after account creation
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl">Compte créé avec succès !</CardTitle>
              <CardDescription className="mt-2">
                Votre compte administrateur est maintenant actif
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert className="bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800">
              <Shield className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900 dark:text-orange-100">
                <strong>Important :</strong> Bookmarquez ce lien pour accéder au panel admin
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Lien de connexion admin</Label>
              <div className="flex gap-2">
                <Input
                  value={loginUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  onClick={copyLoginLink}
                  variant="outline"
                  size="icon"
                >
                  {copiedLink ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ce lien est unique et sécurisé. Gardez-le précieusement !
              </p>
            </div>

            <Button
              onClick={() => setLocation("/admin")}
              className="w-full"
              size="lg"
            >
              Accéder au panel admin
            </Button>

            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Vos identifiants</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Email :</strong> {email}</p>
                <p><strong>Mot de passe :</strong> (celui que vous avez choisi)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
                disabled={registerMutation.isPending}
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
                Minimum 8 caractères
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
