import { useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, CheckCircle2, KeyRound, LockKeyhole } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordReset() {
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (!token) return setMessage("Ce lien est incomplet ou invalide.");
    if (newPassword !== confirmation) return setMessage("Les deux mots de passe ne correspondent pas.");
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) return setMessage(data.error || "Ce lien n'est plus valide.");
      setIsSuccess(true);
      setMessage("Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.");
    } catch {
      setMessage("La réinitialisation n'a pas pu être finalisée. Réessayez plus tard.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_right,oklch(0.92_0.05_70_/_0.45),transparent_30%),linear-gradient(135deg,oklch(0.98_0.01_80),oklch(0.96_0.015_50))] p-4">
      <Card className="w-full max-w-md border-white/70 bg-card/90 shadow-[0_24px_80px_oklch(0.2_0.025_45_/_0.14)] backdrop-blur-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-pronto-primary/10 text-pronto-primary"><KeyRound className="h-6 w-6" /></div>
          <CardTitle className="font-display text-3xl tracking-tight">Choisir un nouveau mot de passe</CardTitle>
          <CardDescription>Ce lien est personnel et ne peut être utilisé qu’une seule fois.</CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-5 text-center">
              <Alert className="border-emerald-500/20 bg-emerald-500/5 text-left"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><AlertDescription>{message}</AlertDescription></Alert>
              <Button onClick={() => setLocation("/login-restaurant")} className="w-full rounded-xl bg-pronto-primary">Se connecter</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="new-password">Nouveau mot de passe</Label><div className="relative"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="pl-9" placeholder="12 caractères minimum" required /></div><p className="text-xs text-muted-foreground">Utilisez au moins 12 caractères, une majuscule, une minuscule et un chiffre.</p></div>
              <div className="space-y-2"><Label htmlFor="confirm-password">Confirmer le mot de passe</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
              {message && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{message}</AlertDescription></Alert>}
              <Button type="submit" disabled={isLoading} className="w-full rounded-xl bg-pronto-primary">{isLoading ? "Mise à jour…" : "Mettre à jour mon mot de passe"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
