import { useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { Clock3, MessageCircle, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

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

function BusinessPublicChrome({ name, logoUrl, onOpenCatalog }: { name: string; logoUrl?: string | null; onOpenCatalog: () => void }) {
  return <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-5">
    <div className="pointer-events-auto mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 rounded-[1.4rem] border border-white/55 bg-white/78 px-2.5 py-2 shadow-[0_16px_48px_rgba(49,33,21,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="flex min-w-0 items-center gap-2.5 px-2 py-1.5">
        {logoUrl ? <img src={logoUrl} alt="" className="h-8 w-8 rounded-full border border-black/[0.07] object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pronto-primary text-white"><Store className="h-4 w-4" /></span>}
        <span className="truncate font-semibold tracking-[-0.025em] text-foreground">{name}</span>
      </div>
      <button type="button" onClick={onOpenCatalog} className="h-10 rounded-[1rem] px-3 text-sm font-medium text-foreground transition-colors hover:bg-black/[0.05]">Catalogue</button>
    </div>
  </header>;
}

export default function BusinessPublicPage({ preview = false }: { preview?: boolean }) {
  const { slug = "" } = useParams<{ slug: string }>();
  const publicBusiness = trpc.businesses.getPublicBySlug.useQuery({ slug }, { retry: false, enabled: !preview });
  const publicCatalog = trpc.businesses.getPublicCatalogBySlug.useQuery({ slug }, { retry: false, enabled: !preview });
  const previewCatalog = trpc.businesses.getPreviewBySlug.useQuery({ slug }, { retry: false, enabled: preview });
  const business = preview ? previewCatalog.data?.business : publicBusiness.data;
  const catalog = preview ? previewCatalog.data : publicCatalog.data;
  const itemsByCollection = useMemo(() => {
    const items = catalog?.items ?? [];
    const groups = new Map<number | null, typeof items>();
    for (const item of items) groups.set(item.collectionId, [...(groups.get(item.collectionId) ?? []), item]);
    return groups;
  }, [catalog]);

  if (publicBusiness.isLoading || publicCatalog.isLoading || previewCatalog.isLoading) return <div className="min-h-[100dvh] bg-background" />;
  if (!business) return <div className="min-h-[100dvh] bg-background" />;

  const profile = business.profile;
  return (
    <main className="min-h-[100dvh] bg-[#fbf8f3] text-foreground">
      <BusinessPublicChrome
        name={profile?.displayName || business.slug}
        logoUrl={profile?.logoUrl}
        onOpenCatalog={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })}
      />
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
        {catalog?.collections.map((collection) => <div key={collection.id} className="mb-12 last:mb-0">
          <div className="mb-5"><h3 className="text-2xl font-semibold tracking-[-0.025em]">{collection.name}</h3>{collection.description && <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(itemsByCollection.get(collection.id) ?? []).map((item) => <article key={item.id} className="vitrine-surface rounded-[1.45rem] border border-border/75 bg-white p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(62,42,25,0.06)]"><div className="rounded-[1.05rem] border border-white/70 bg-card p-5"><div className="flex items-start justify-between gap-4"><h4 className="font-semibold">{item.name}</h4><span className="shrink-0 text-sm font-semibold text-pronto-primary">{formatPrice(item)}</span></div>{item.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}{item.durationMinutes && <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{item.durationMinutes} min</p>}</div></article>)}
          </div>
        </div>)}
        {!catalog?.catalog && <div className="rounded-[1.45rem] border border-dashed p-8 text-muted-foreground">Ce catalogue sera disponible prochainement.</div>}
      </section>
      <footer className="border-t border-border/70 px-5 py-8 text-center text-sm text-muted-foreground">Propulsé par PRONTO</footer>
    </main>
  );
}
