import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  FileUp,
  LayoutDashboard,
  Menu,
  Scissors,
  ShoppingBag,
  Sparkles,
  Store,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ChatbotWidget from "@/components/ChatbotWidget";
import { ContactFormDialog } from "@/components/ContactFormDialog";

const capabilities = [
  {
    icon: FileUp,
    title: "Partez de ce que vous avez déjà",
    description: "Une photo, un PDF ou un CSV devient un brouillon de catalogue à relire avant publication.",
    className: "md:col-span-7",
  },
  {
    icon: LayoutDashboard,
    title: "Gardez le contrôle",
    description: "Produits, prestations, menus, disponibilités et contenu réunis dans un espace simple.",
    className: "md:col-span-5",
  },
  {
    icon: Sparkles,
    title: "Publiez une vitrine qui vous ressemble",
    description: "Une présence mobile soignée, personnalisable et lisible pour les personnes qui vous découvrent.",
    className: "md:col-span-5",
  },
  {
    icon: CalendarDays,
    title: "Faites progresser chaque visite",
    description: "Réservations, demandes et informations utiles restent proches de votre catalogue, sans multiplier les outils.",
    className: "md:col-span-7",
  },
];

const sectors = [
  { icon: Utensils, label: "Restaurants & bars" },
  { icon: Scissors, label: "Beauté & bien-être" },
  { icon: ShoppingBag, label: "Boutiques & créateurs" },
  { icon: Store, label: "Commerces & services" },
];

export default function LandingPage() {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactFormSource, setContactFormSource] = useState<"HEADER" | "HERO" | "FOOTER">("HEADER");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const openContactForm = (source: "HEADER" | "HERO" | "FOOTER") => {
    setContactFormSource(source);
    setIsContactFormOpen(true);
  };

  const openContactFormFromMobileMenu = () => {
    setIsMobileMenuOpen(false);
    openContactForm("HEADER");
  };

  return (
    <>
      <main className="pronto-page overflow-x-hidden">
        <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-5">
          <div className="container max-w-7xl">
            <div className="flex h-[4.5rem] items-center justify-between rounded-full border border-white/70 bg-background/80 px-3 shadow-[0_12px_38px_oklch(0.22_0.025_53_/_0.08)] backdrop-blur-xl sm:h-20 sm:px-5">
              <a href="/" className="flex items-center" aria-label="PRONTO, accueil">
                <img src="/pronto-logo-horizontal.png" alt="PRONTO" className="h-14 w-auto origin-left scale-[1.25] sm:h-16 sm:scale-[1.55]" />
              </a>
              <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
                <a className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" href="#fonctionnalites">Fonctionnalités</a>
                <a className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" href="#secteurs">Pour votre activité</a>
                <a className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" href="#tarifs">Tarifs</a>
              </nav>
              <div className="hidden items-center gap-2 sm:flex">
                <Button asChild variant="ghost" className="rounded-full px-4"><a href="/login-restaurant">Connexion</a></Button>
                <Button onClick={() => openContactForm("HEADER")} className="group rounded-full bg-pronto-primary px-5 text-primary-foreground shadow-[0_8px_20px_oklch(0.38_0.12_35_/_0.18)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-pronto-primary-deep active:scale-[0.98]">
                  Créer ma vitrine <span className="ml-2 grid h-5 w-5 place-items-center rounded-full bg-white/15 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px"><ArrowUpRight className="h-3.5 w-3.5" /></span>
                </Button>
              </div>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild className="sm:hidden">
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[min(94vw,26rem)] border-l-white/50 bg-background/95 backdrop-blur-2xl">
                  <SheetHeader className="text-left"><SheetTitle className="font-body text-lg font-semibold tracking-tight">Explorer PRONTO</SheetTitle><SheetDescription>Une plateforme, adaptée à votre activité.</SheetDescription></SheetHeader>
                  <nav className="mt-10 flex flex-col gap-2" aria-label="Navigation mobile">
                    <a href="#fonctionnalites" className="rounded-2xl px-4 py-3 text-lg transition-colors hover:bg-secondary">Fonctionnalités</a>
                    <a href="#secteurs" className="rounded-2xl px-4 py-3 text-lg transition-colors hover:bg-secondary">Pour votre activité</a>
                    <a href="#tarifs" className="rounded-2xl px-4 py-3 text-lg transition-colors hover:bg-secondary">Tarifs</a>
                    <a href="/login-restaurant" className="mt-4 rounded-2xl px-4 py-3 text-lg transition-colors hover:bg-secondary">Connexion</a>
                    <Button onClick={openContactFormFromMobileMenu} className="mt-3 h-12 rounded-2xl bg-pronto-primary">Créer ma vitrine</Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <section className="container max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:pb-36 lg:pt-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
            <div className="relative z-10 max-w-4xl">
              <span className="pronto-eyebrow"><Sparkles className="h-3.5 w-3.5" /> Une seule plateforme, votre façon de travailler</span>
              <h1 className="mt-6 max-w-4xl text-[clamp(3.25rem,7vw,6.6rem)] leading-[0.9] text-foreground sm:mt-8">
                Votre activité mérite mieux qu’un simple lien.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
                PRONTO transforme vos produits, vos services ou votre carte en une vitrine claire, vivante et facile à maintenir — sans dépendre d’une agence pour chaque modification.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={() => openContactForm("HERO")} size="lg" className="group h-14 rounded-full bg-pronto-primary px-6 text-base shadow-[0_14px_30px_oklch(0.38_0.12_35_/_0.2)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-pronto-primary-deep active:scale-[0.98]">
                  Construire mon espace <span className="ml-3 grid h-7 w-7 place-items-center rounded-full bg-white/15 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-px"><ArrowUpRight className="h-4 w-4" /></span>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 rounded-full border-border/90 bg-card/70 px-6 text-base transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-secondary active:scale-[0.98]"><a href="/la-voile-rouge">Découvrir une vitrine <ChevronRight className="ml-2 h-4 w-4" /></a></Button>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">Préparez votre catalogue · Relisez chaque détail · Publiez quand vous êtes prêt</p>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div className="absolute -left-5 top-8 h-48 w-48 rounded-full bg-pronto-accent/20 blur-3xl" />
              <div className="pronto-shell relative p-2 sm:p-3">
                <div className="relative overflow-hidden rounded-[calc(1.5rem-0.5rem)] bg-pronto-primary-deep p-5 sm:p-7">
                  <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=900&fit=crop" alt="Établissement accueillant avec espace de service" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity" />
                  <div className="relative flex min-h-[26rem] flex-col justify-between sm:min-h-[31rem]">
                    <div className="flex items-center justify-between text-white/85"><span className="font-body text-xs font-semibold uppercase tracking-[0.16em]">Votre espace PRONTO</span><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs backdrop-blur-sm">En préparation</span></div>
                    <div className="max-w-md rounded-[1.35rem] border border-white/20 bg-black/10 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-md sm:p-6">
                      <p className="font-body text-sm font-medium text-white/70">Depuis une photo, un PDF ou un tableau</p>
                      <p className="mt-2 font-display text-3xl leading-none sm:text-4xl">Votre catalogue devient prêt à partager.</p>
                      <div className="mt-5 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-pronto-accent" /><span className="text-sm text-white/75">Relisez, ajustez, publiez.</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="secteurs" className="container max-w-7xl px-4 pb-24 sm:px-6 sm:pb-32">
          <div className="pronto-shell p-1.5"><div className="rounded-[calc(1.5rem-0.375rem)] bg-card px-5 py-7 sm:px-8 sm:py-9"><p className="font-body text-sm font-semibold uppercase tracking-[0.13em] text-muted-foreground">Pensé pour les métiers qui ont quelque chose à montrer</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{sectors.map(({ icon: Icon, label }) => <div key={label} className="group flex items-center gap-3 rounded-2xl bg-secondary/65 p-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1"><span className="grid h-10 w-10 place-items-center rounded-xl bg-background text-pronto-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"><Icon className="h-4 w-4" /></span><span className="font-medium tracking-[-0.01em]">{label}</span></div>)}</div></div></div>
        </section>

        <section id="fonctionnalites" className="container max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-3xl"><span className="pronto-eyebrow">Tout devient plus simple</span><h2 className="mt-5 max-w-3xl text-5xl sm:text-6xl">Moins d’outils. Plus de temps pour votre métier.</h2><p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">PRONTO organise le travail quotidien autour d’un même principe : préparer, contrôler puis publier, sans perdre vos repères.</p></div>
          <div className="mt-12 grid grid-flow-dense gap-4 md:grid-cols-12">{capabilities.map(({ icon: Icon, title, description, className }) => <article key={title} className={`pronto-shell p-1.5 ${className}`}><div className="group flex h-full min-h-64 flex-col justify-between rounded-[calc(1.5rem-0.375rem)] bg-card p-6 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-pronto-primary/10 text-pronto-primary"><Icon className="h-5 w-5" /></span><div className="mt-12"><h3 className="text-3xl">{title}</h3><p className="mt-4 max-w-md leading-7 text-muted-foreground">{description}</p></div></div></article>)}</div>
        </section>

        <section className="container max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"><div><span className="pronto-eyebrow">Votre flux, sans frictions</span><h2 className="mt-5 text-5xl sm:text-6xl">De vos fichiers à une vitrine utile.</h2></div><div className="grid gap-3"><div className="pronto-panel flex gap-5 p-5 sm:p-6"><span className="font-display text-4xl text-pronto-primary/60">01</span><div><h3 className="font-body text-lg font-semibold tracking-tight">Ajoutez ce que vous avez</h3><p className="mt-1 leading-7 text-muted-foreground">Photo, PDF ou CSV : l’import prépare une base de travail, jamais une publication définitive.</p></div></div><div className="pronto-panel flex gap-5 p-5 sm:p-6"><span className="font-display text-4xl text-pronto-primary/60">02</span><div><h3 className="font-body text-lg font-semibold tracking-tight">Vérifiez à votre rythme</h3><p className="mt-1 leading-7 text-muted-foreground">Ajustez les collections, les prix, les informations et la présentation avant de les rendre visibles.</p></div></div><div className="pronto-panel flex gap-5 p-5 sm:p-6"><span className="font-display text-4xl text-pronto-primary/60">03</span><div><h3 className="font-body text-lg font-semibold tracking-tight">Partagez un espace cohérent</h3><p className="mt-1 leading-7 text-muted-foreground">Votre page publique suit votre identité et reste adaptée à la consultation mobile.</p></div></div></div></div>
        </section>

        <section id="tarifs" className="container max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="rounded-[2rem] bg-pronto-primary-deep px-6 py-12 text-primary-foreground sm:px-10 sm:py-16 lg:px-16"><div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-3xl"><span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/80">Une base simple, des possibilités qui grandissent</span><h2 className="mt-6 text-5xl text-white sm:text-6xl">Commencez avec l’essentiel. Évoluez quand votre activité le demande.</h2><p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">Définissons une formule cohérente avec votre catalogue, votre vitrine et vos priorités de publication.</p></div><div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-6 backdrop-blur-sm"><p className="text-sm text-white/65">Votre besoin, votre rythme</p><p className="mt-1 font-display text-4xl leading-tight text-white">Une formule adaptée à votre activité.</p><ul className="mt-5 space-y-3 text-sm text-white/80"><li className="flex gap-2"><Check className="h-4 w-4 text-pronto-accent" />Votre vitrine publique</li><li className="flex gap-2"><Check className="h-4 w-4 text-pronto-accent" />Catalogue maintenu facilement</li><li className="flex gap-2"><Check className="h-4 w-4 text-pronto-accent" />Un accompagnement au départ</li></ul><Button onClick={() => openContactForm("FOOTER")} className="mt-7 w-full rounded-full bg-white text-pronto-primary hover:bg-pronto-beige">Parler de mon projet</Button></div></div></div>
        </section>

        <section className="container max-w-7xl px-4 pb-24 pt-4 sm:px-6 sm:pb-32"><div className="pronto-shell p-1.5"><div className="rounded-[calc(1.5rem-0.375rem)] bg-card px-6 py-14 text-center sm:px-12 sm:py-20"><span className="pronto-eyebrow">Prêt quand vous l’êtes</span><h2 className="mx-auto mt-6 max-w-4xl text-5xl sm:text-6xl">Une présence en ligne plus claire commence par une première conversation.</h2><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Expliquez-nous votre activité et ce que vous souhaitez montrer. Nous vous aidons à choisir le bon point de départ.</p><Button onClick={() => openContactForm("FOOTER")} size="lg" className="group mt-9 h-14 rounded-full bg-pronto-primary px-6 text-base transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-pronto-primary-deep active:scale-[0.98]">Démarrer la conversation <span className="ml-3 grid h-7 w-7 place-items-center rounded-full bg-white/15 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-px"><ArrowUpRight className="h-4 w-4" /></span></Button></div></div></section>

        <footer className="container max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10"><div className="flex flex-col gap-6 border-t border-border/80 pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><img src="/pronto-logo-horizontal.png" alt="PRONTO" className="h-8 w-auto" /><span>© 2026 PRONTO</span></div><div className="flex flex-wrap gap-x-5 gap-y-2"><a className="transition-colors hover:text-foreground" href="#fonctionnalites">Fonctionnalités</a><a className="transition-colors hover:text-foreground" href="#tarifs">Tarifs</a><a className="transition-colors hover:text-foreground" href="/login-restaurant">Connexion</a><a className="transition-colors hover:text-foreground" href="https://altmachine.fr" target="_blank" rel="noreferrer">Une solution ALTMachine</a></div></div></footer>
      </main>
      <ChatbotWidget />
      <ContactFormDialog isOpen={isContactFormOpen} onClose={() => setIsContactFormOpen(false)} source={contactFormSource} />
    </>
  );
}
