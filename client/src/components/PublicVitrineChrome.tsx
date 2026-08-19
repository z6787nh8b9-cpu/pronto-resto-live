import type { ReactNode } from "react";
import { CalendarDays, ChevronRight, Store, UtensilsCrossed } from "lucide-react";

type PublicVitrineChromeProps = {
  name: string;
  logoUrl?: string | null;
  slug: string;
  languageControl?: ReactNode;
  onOpenCatalog: () => void;
  onReserve?: () => void;
};

/** Shared, mobile-first navigation material for every public PRONTO showcase. */
export function PublicVitrineChrome({
  name,
  logoUrl,
  slug,
  languageControl,
  onOpenCatalog,
  onReserve,
}: PublicVitrineChromeProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="pointer-events-auto mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 rounded-[1.4rem] border border-white/55 bg-white/78 px-2.5 py-2 shadow-[0_16px_48px_rgba(49,33,21,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        <a href={`/${slug}`} className="flex min-w-0 items-center gap-2.5 rounded-[1rem] px-2 py-1.5 transition-colors hover:bg-black/[0.04]">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-8 w-8 rounded-full border border-black/[0.07] object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pronto-primary text-white"><Store className="h-4 w-4" /></span>
          )}
          <span className="truncate font-semibold tracking-[-0.025em] text-foreground">{name}</span>
        </a>

        <nav className="flex items-center gap-1" aria-label="Navigation de la vitrine">
          {languageControl}
          <button type="button" onClick={onOpenCatalog} className="inline-flex h-10 items-center gap-1.5 rounded-[1rem] px-3 text-sm font-medium text-foreground transition-colors hover:bg-black/[0.05]">
            <UtensilsCrossed className="h-4 w-4" />
            <span className="hidden sm:inline">Catalogue</span>
          </button>
          {onReserve && (
            <button type="button" onClick={onReserve} className="inline-flex h-10 items-center gap-1.5 rounded-[1rem] border border-pronto-primary/15 bg-pronto-primary px-3 text-sm font-semibold text-white shadow-[inset_0_1px_rgba(255,255,255,0.18)] transition-transform hover:-translate-y-px active:translate-y-0">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Réserver</span>
              <ChevronRight className="hidden h-3.5 w-3.5 sm:block" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
