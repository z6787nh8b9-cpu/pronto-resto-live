import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

export default function AdminMagicLogin() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <section className="mx-auto max-w-md rounded-3xl bg-card p-8 text-center shadow-sm ring-1 ring-border">
        <ShieldCheck className="mx-auto mb-5 h-10 w-10 text-primary" />
        <h1 className="text-2xl font-semibold">Connexion sécurisée requise</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Les liens de connexion directe ne sont plus disponibles. Connectez-vous avec votre email et votre mot de passe.
        </p>
        <Link href="/admin/login" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]">
          Accéder à la connexion administrateur
        </Link>
      </section>
    </main>
  );
}
