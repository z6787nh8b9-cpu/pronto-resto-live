import type { ReactNode } from "react";
import { Store } from "lucide-react";

type PublicVitrineChromeProps = {
  name: string;
  logoUrl?: string | null;
  children?: ReactNode;
};

export function PublicVitrineChrome({ name, logoUrl, children }: PublicVitrineChromeProps) {
  return <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-5">
    <div className="pointer-events-auto mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 rounded-[1.4rem] border border-white/55 bg-white/78 px-2.5 py-2 shadow-[0_16px_48px_rgba(49,33,21,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="flex min-w-0 items-center gap-2.5 px-2 py-1.5">
        {logoUrl ? <img src={logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full border border-black/[0.07] object-cover" /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pronto-primary text-white"><Store className="h-4 w-4" /></span>}
        <span className="truncate font-semibold tracking-[-0.025em] text-foreground">{name}</span>
      </div>
      {children && <nav className="flex shrink-0 items-center gap-1.5">{children}</nav>}
    </div>
  </header>;
}
