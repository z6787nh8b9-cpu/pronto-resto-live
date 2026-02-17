/**
 * Admin Login Page
 * Allows existing admins to login with email/password
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, LogIn } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: async (data) => {
      console.log('[AdminLogin] Login successful:', data);
      console.log('[AdminLogin] Invalidating adminAuth.me query...');
      
      // Invalidate the me query to refetch admin data
      await utils.adminAuth.me.invalidate();
      
      console.log('[AdminLogin] Query invalidated, redirecting to /admin...');
      
      // Redirect to admin panel after successful login
      setLocation("/admin");
    },
    onError: (err) => {
      console.error('[AdminLogin] Login failed:', err);
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AdminLogin] Form submitted with email:', email);
    
    // Only clear error if not already pending
    if (!loginMutation.isPending) {
      setError("");
    }

    // Validate inputs
    if (!email || !password) {
      console.error('[AdminLogin] Validation failed: missing fields');
      setError("Tous les champs sont requis");
      return;
    }

    console.log('[AdminLogin] Calling login mutation...');
    
    // Submit login
    loginMutation.mutate({
      email,
      password,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Connexion Administrateur</CardTitle>
            <CardDescription className="mt-2">
              Connectez-vous pour accéder au panel d'administration PRONTO
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
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
                disabled={loginMutation.isPending}
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
                disabled={loginMutation.isPending}
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
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Se connecter
                </>
              )}
            </Button>

            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas de compte ?{" "}
                <span className="text-muted-foreground">
                  Contactez un administrateur pour recevoir une invitation.
                </span>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
