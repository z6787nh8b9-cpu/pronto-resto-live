import { Link } from "wouter";

export default function TermsPage() {
  return (
    <main className="min-h-[100dvh] bg-[#fbf8f3] px-5 py-10 text-[#301d15] sm:px-8 sm:py-16">
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-7 shadow-[0_18px_50px_rgba(48,29,21,0.08)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a553f]">PRONTO</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Conditions de service</h1>
        <p className="mt-6 text-base leading-7 text-[#6b5548]">
          Cette page sera complétée avec les conditions contractuelles applicables avant toute ouverture commerciale du service.
          L’accès propriétaire reste réservé aux comptes associés à un établissement et aux invitations valides.
        </p>
        <p className="mt-4 text-sm leading-6 text-[#8a7366]">
          Pour accéder à votre espace, revenez à la page de connexion. Aucune souscription ni aucun paiement ne peut être effectué depuis cette page.
        </p>
        <Link href="/login-restaurant" className="mt-8 inline-flex rounded-full bg-[#713222] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#542419]">
          Retour à la connexion
        </Link>
      </section>
    </main>
  );
}
