import { useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { Clock3, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { LoadingState } from "@/components/LoadingState";
import { PublicVitrineChrome } from "@/components/PublicVitrineChrome";
import { ScrollReveal } from "@/components/ScrollReveal";
import { usePublicSeo } from "@/lib/public-seo";

const verticalLabel: Record<string, string> = {
  beauty: "Beauté & bien-être",
  retail: "Boutique",
  service: "Services",
  events: "Événements",
  other: "Entreprise",
};

function formatPrice(item: { priceType: string; price: string | number | null; priceMax: string | number | null; priceLabel: string | null; currency: string }) {
  const currency = item.currency === "EUR" ? "€" : item.currency;
  const display = (value: string | number | null) => value == null ? null : `${Number(value).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}${currency}`;
  if (item.priceType === "free") return item.priceLabel || "Sans frais";
  if (item.priceType === "quote") return item.priceLabel || "Sur devis";
  if (item.priceType === "range") return `${display(item.price)} – ${display(item.priceMax)}`;
  if (item.priceType === "from") return `À partir de ${display(item.price)}`;
  return display(item.price) || item.priceLabel || "Tarif sur demande";
}

export default function BusinessPublicPage({ preview = false }: { preview?: boolean }) {
  const { slug = "" } = useParams<{ slug: string }>();
  const publicBusiness = trpc.businesses.getPublicBySlug.useQuery({ slug }, { retry: false, enabled: !preview });
  const publicCatalog = trpc.businesses.getPublicCatalogBySlug.useQuery({ slug }, { retry: false, enabled: !preview });
  const previewCatalog = trpc.businesses.getPreviewBySlug.useQuery({ slug }, { retry: false, enabled: preview });
  const business = preview ? previewCatalog.data?.business : publicBusiness.data;
  const catalog = preview ? previewCatalog.data : publicCatalog.data;
  const profile = business?.profile;
  const displayName = profile?.displayName || business?.slug || "Vitrine PRONTO";
  usePublicSeo({
    title: preview ? `${displayName} — Aperçu PRONTO` : `${displayName} — PRONTO`,
    description: profile?.shortDescription || `Découvrez le catalogue de ${displayName}.`,
    pathname: `/b/${slug}`,
    imageUrl: profile?.heroImageUrl || profile?.logoUrl,
    noIndex: preview,
  });
  const itemsByCollection = useMemo(() => {
    const items = catalog?.items ?? [];
    const groups = new Map<number | null, typeof items>();
    for (const item of items) groups.set(item.collectionId, [...(groups.get(item.collectionId) ?? []), item]);
    return groups;
  }, [catalog]);

  if (publicBusiness.isLoading || publicCatalog.isLoading || previewCatalog.isLoading) return <main className="min-h-[100dvh] bg-[#fbf8f3]"><LoadingState label="Ouverture de la vitrine" /></main>;
  if (!business) return <main className="min-h-[100dvh] bg-[#fbf8f3]"><div className="mx-auto flex min-h-[100dvh] max-w-xl items-center px-6 text-center"><p className="w-full text-sm font-medium text-muted-foreground">Cette vitrine n’est pas disponible.</p></div></main>;

  return (
    <main className="min-h-[100dvh] bg-[#fbf8f3] text-foreground">
      <PublicVitrineChrome
        name={profile?.displayName || business.slug}
        logoUrl={profile?.logoUrl}
      ><button type="button" onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })} className="h-10 rounded-[1rem] px-3 text-sm font-medium text-foreground transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.05] active:scale-[0.98]">Catalogue</button></PublicVitrineChrome>
      <section className="relative flex min-h-[58dvh] items-end overflow-hidden px-5 pb-14 pt-28 sm:px-8">
        {profile?.heroImageUrl && <img src={profile.heroImageUrl} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover blur-[8px]" />}
        <div className="absolute inset-0 bg-gradient-to-b from-[#21150f]/85 via-[#21150f]/68 to-[#21150f]/30" />
        <div className="relative mx-auto w-full max-w-5xl text-white">
          {preview && <p className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">Aperçu Super Admin — non publié</p>}
          <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70"><Sparkles className="h-4 w-4" /> {verticalLabel[business.vertical] || "Entreprise"}</p>
          <h1 className="max-w-3xl font-display text-5xl leading-[0.94] sm:text-7xl">{profile?.displayName || business.slug}</h1>
          {profile?.shortDescription && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">{profile.shortDescription}</p>}
        </div>
      </section>
      <section id="catalogue" className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{catalog?.catalog?.type === "products" ? "Collections" : "Prestations"}</p><h2 className="mt-2 font-display text-4xl">{catalog?.catalog?.name || "Notre sélection"}</h2></div>
          {profile?.whatsapp && <Button asChild className="rounded-2xl"><a href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}><MessageCircle className="mr-2 h-4 w-4" />Nous contacter</a></Button>}
        </div>
        {catalog?.collections.map((collection, collectionIndex) => <div key={collection.id} className="mb-12 last:mb-0">
          <ScrollReveal delay={collectionIndex * 60} className="mb-5"><h3 className="text-2xl font-semibold tracking-[-0.025em]">{collection.name}</h3>{collection.description && <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>}</ScrollReveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {(itemsByCollection.get(collection.id) ?? []).map((item, itemIndex) => <ScrollReveal key={item.id} delay={60 + itemIndex * 70}><article className="vitrine-surface rounded-[1.45rem] border border-border/75 bg-white p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(62,42,25,0.06)]"><div className="rounded-[1.05rem] border border-white/70 bg-card p-5"><div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:gap-4"><h4 className="font-semibold">{item.name}</h4><span className="text-sm font-semibold text-pronto-primary">{formatPrice(item)}</span></div>{item.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}{item.durationMinutes && <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{item.durationMinutes} min</p>}</div></article></ScrollReveal>)}
          </div>
        </div>)}
        {!catalog?.catalog && <div className="rounded-[1.45rem] border border-dashed p-8 text-muted-foreground">Ce catalogue sera disponible prochainement.</div>}
      </section>
      <footer className="border-t border-border/70 px-5 py-8 text-center text-sm text-muted-foreground">Propulsé par PRONTO</footer>
    </main>
  );
}
