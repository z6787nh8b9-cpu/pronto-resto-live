import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  /**
   * Nombre de colonnes par breakpoint
   * Default: { mobile: 1, tablet: 2, desktop: 3 }
   */
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  /**
   * Gap entre les éléments
   * Default: "responsive" (utilise les tokens CSS)
   */
  gap?: "tight" | "normal" | "loose" | "responsive";
}

/**
 * ResponsiveGrid - Grid adaptatif avec colonnes automatiques
 * 
 * Mobile (< 640px): 1 colonne par défaut
 * Tablet (640-1024px): 2 colonnes par défaut
 * Desktop (>= 1024px): 3 colonnes par défaut
 * 
 * Utilise les tokens CSS pour les gaps
 */
export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "responsive",
}: ResponsiveGridProps) {
  const gapClass = {
    tight: "gap-2",
    normal: "gap-4",
    loose: "gap-6",
    responsive: "gap-[var(--gap-mobile)] sm:gap-[var(--gap-tablet)] lg:gap-[var(--gap-desktop)]",
  }[gap];

  const gridClass = cn(
    "grid",
    `grid-cols-${cols.mobile || 1}`,
    `sm:grid-cols-${cols.tablet || 2}`,
    `lg:grid-cols-${cols.desktop || 3}`,
    gapClass,
    className
  );

  return <div className={gridClass}>{children}</div>;
}
