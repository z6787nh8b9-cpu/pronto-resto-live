import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ResponsiveHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryActions?: ReactNode;
  backButton?: {
    label: string;
    onClick: () => void;
  };
  breadcrumbs?: string[];
}

/**
 * ResponsiveHeader - Header universel mobile-first
 * 
 * Mobile (< 640px):
 * - Layout vertical compact
 * - Titre tronqué avec text-sm
 * - Badge inline minimaliste
 * - Action principale visible
 * - Actions secondaires dans menu hamburger
 * 
 * Desktop (>= 640px):
 * - Layout horizontal
 * - Titre complet
 * - Toutes les actions visibles
 */
export function ResponsiveHeader({
  title,
  subtitle,
  badge,
  primaryAction,
  secondaryActions,
  backButton,
  breadcrumbs,
}: ResponsiveHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container">
        <div className="flex min-h-[var(--header-height-mobile)] sm:min-h-[var(--header-height-tablet)] items-center justify-between gap-2 py-2 sm:py-3">
          {/* Left: Back button + Title + Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {backButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={backButton.onClick}
                className="shrink-0 text-xs sm:text-sm"
              >
                ← {backButton.label}
              </Button>
            )}
            
            <div className="min-w-0 flex-1">
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav aria-label="Fil d’Ariane" className="mb-0.5 flex items-center gap-1 overflow-hidden text-[11px] text-muted-foreground">
                  {breadcrumbs.map((crumb, index) => <div key={`${crumb}-${index}`} className="flex min-w-0 items-center gap-1">{index > 0 && <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />}<span className="truncate">{crumb}</span></div>)}
                </nav>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {title === "PRONTO" ? (
                  <img src="/pronto-logo-horizontal.png" alt="PRONTO - Fini les 5 outils. Un seul suffit." className="h-24 sm:h-32" />
                ) : (
                  <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-display font-semibold truncate">
                    {title}
                  </h1>
                )}
                {badge && (
                  <div className="shrink-0">{badge}</div>
                )}
              </div>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Primary action - always visible */}
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                size="sm"
                className="text-xs sm:text-sm"
              >
                {primaryAction.icon}
                <span className="hidden sm:inline">{primaryAction.label}</span>
                <span className="sm:hidden">{primaryAction.icon ? "" : primaryAction.label}</span>
              </Button>
            )}

            {/* Secondary actions - hamburger menu on mobile */}
            {secondaryActions && (
              <>
                {/* Mobile: Hamburger menu */}
                <Sheet>
                  <SheetTrigger asChild className="sm:hidden">
                    <Button variant="ghost" size="sm">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Actions</SheetTitle>
                      <SheetDescription>
                        Options supplémentaires
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-2">
                      {secondaryActions}
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Desktop: Inline actions */}
                <div className="hidden sm:flex items-center gap-2">
                  {secondaryActions}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
