import { Ring } from "ldrs/react";
import "ldrs/react/Ring.css";

type LoadingStateProps = {
  label?: string;
  className?: string;
  compact?: boolean;
};

export function LoadingState({
  label = "Chargement en cours",
  className = "",
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-muted-foreground ${compact ? "py-2" : "min-h-[18rem] px-6"} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <Ring size={compact ? 20 : 30} speed={1.35} stroke={3} bgOpacity={0.16} color="currentColor" />
      <span className="text-sm font-medium tracking-[-0.01em]">{label}</span>
    </div>
  );
}
