import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactFormDialog } from "@/components/ContactFormDialog";
import { usePublicSeo } from "@/lib/public-seo";

const plans = [
  {
    name: "Menu",
    label: "L’essentiel public",
    description: "Une carte ou un catalogue clair à partager, simple à maintenir et pensé pour la consultation mobile.",
    features: ["Vitrine et catalogue public", "Mise à jour des produits, plats ou services", "Contact direct et présence mobile"],
  },
  {
    name: "Pro",
    label: "Plus de contexte",
    description: "Pour les établissements qui veulent enrichir l’information visible et s’adresser à davantage de visiteurs.",
    features: ["Tout le niveau Menu", "Horaires et traductions", "Personnalisation éditoriale avancée"],
  },
  {
    name: "Premium",
    label: "Une vitrine plus complète",
    description: "Pour réunir les contenus, les événements, les réservations et les formats visuels dans un même espace.",
    features: ["Tout le niveau Pro", "Événements, galerie et réservations", "Thèmes et modules Premium"],
  },
];

export default function PricingPage() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  usePublicSeo({
    title: "Formules — PRONTO",
    description: "Découvrez les niveaux fonctionnels PRONTO pour créer et maintenir votre vitrine publique.",
    pathname: "/tarifs",
  });

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#fdfbf7] text-[#21150f]">
      <header className="px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between rounded-full border border-white/65 bg-white/75 px-4 shadow-[0_14px_42px_rgba(56,38,24,0.08)] backdrop-blur-xl sm:h-20 sm:px-6">
          <a href="/" className="flex items-center" aria-label="PRONTO, accueil"><img src="/pronto-logo-horizontal.png" alt="PRONTO" className="h-10 w-auto sm:h-12" /></a>
          <div className="flex items-center gap-2"><Button asChild variant="ghost" className="rounded-full px-3 sm:px-4"><a href="/login-restaurant">Connexion</a></Button><Button onClick={() => setIsContactOpen(true)} className="group rounded-full bg-[#713222] px-4 text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[#542419] active:scale-[0.98] sm:px-5">Préparer mon projet <span className="ml-2 inline-grid h-5 w-5 place-items-center rounded-full bg-white/15 transition-transform duration-700 group-hover:translate-x-0.5 group-hover:-translate-y-px">↗</span></Button></div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pb-32 sm:pt-28 lg:pb-40 lg:pt-36">
        <div aria-hidden="true" className="pointer-events-none absolute right-[-8rem] top-10 h-72 w-72 rounded-full bg-[#b8704e]/15 blur-3xl" />
        <div className="relative max-w-4xl"><p className="inline-flex rounded-full bg-[#21150f]/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#713222]">Des niveaux qui suivent votre rythme</p><h1 className="mt-7 font-display text-[clamp(3.5rem,8vw,7.25rem)] leading-[0.88] tracking-[-0.055em]">Choisissez ce qui sert vraiment votre activité.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[#6b5548] sm:text-xl">PRONTO s’adapte à la manière dont vous souhaitez présenter votre catalogue, vos informations et vos rendez-vous. Les modalités commerciales sont définies avec vous selon votre contexte de publication.</p></div>

        <div className="relative mt-16 grid gap-5 lg:grid-cols-3 lg:gap-7">
          {plans.map((plan, index) => <article key={plan.name} className={`rounded-[2rem] bg-[#21150f]/[0.055] p-1.5 ${index === 2 ? "lg:-translate-y-6" : ""}`}><div className={`flex h-full flex-col rounded-[calc(2rem-0.375rem)] px-6 py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-8 sm:py-9 ${index === 2 ? "bg-[#552419] text-white" : "bg-white"}`}><div><p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${index === 2 ? "text-white/60" : "text-[#8a4b34]"}`}>{plan.label}</p><h2 className="mt-4 font-display text-5xl tracking-[-0.05em]">{plan.name}</h2><p className={`mt-5 min-h-24 text-base leading-7 ${index === 2 ? "text-white/75" : "text-[#6b5548]"}`}>{plan.description}</p></div><ul className={`mt-10 space-y-4 text-sm ${index === 2 ? "text-white/85" : "text-[#473329]"}`}>{plan.features.map((feature) => <li key={feature} className="flex gap-3"><span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${index === 2 ? "bg-[#e5b67a]" : "bg-[#9b4f36]"}`} />{feature}</li>)}</ul><Button onClick={() => setIsContactOpen(true)} variant={index === 2 ? "secondary" : "outline"} className={`group mt-10 w-full rounded-full ${index === 2 ? "bg-white text-[#552419] hover:bg-[#fff5e8]" : "border-[#21150f]/10 bg-white text-[#552419] hover:bg-[#f7eee6]"}`}>Échanger sur cette formule <span className="ml-2 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">↗</span></Button></div></article>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 sm:pb-32"><div className="rounded-[2rem] bg-[#21150f] p-1.5"><div className="flex flex-col items-start justify-between gap-8 rounded-[calc(2rem-0.375rem)] bg-[#2c180f] px-7 py-10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] sm:px-10 sm:py-14 lg:flex-row lg:items-end"><div className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e5b67a]">Un point de départ clair</p><h2 className="mt-5 font-display text-5xl leading-[0.95]">Parlons de votre catalogue avant de parler de formule.</h2><p className="mt-6 text-lg leading-8 text-white/70">Votre activité, vos contenus et vos priorités permettent de déterminer le niveau le plus cohérent, sans vous orienter vers un outil inutile.</p></div><Button onClick={() => setIsContactOpen(true)} size="lg" className="group h-14 shrink-0 rounded-full bg-[#e5b67a] px-6 text-[#2c180f] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[#f0ca95] active:scale-[0.98]">Démarrer la conversation <span className="ml-3 inline-grid h-7 w-7 place-items-center rounded-full bg-[#2c180f]/10 transition-transform duration-700 group-hover:translate-x-1 group-hover:-translate-y-px">↗</span></Button></div></div></section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-[#21150f]/10 px-4 py-8 text-sm text-[#6b5548] sm:flex-row sm:items-center sm:justify-between sm:px-6"><span>© 2026 PRONTO</span><a href="/" className="transition-colors hover:text-[#21150f]">Retour à l’accueil</a></footer>
      <ContactFormDialog isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} source="FOOTER" />
    </main>
  );
}
