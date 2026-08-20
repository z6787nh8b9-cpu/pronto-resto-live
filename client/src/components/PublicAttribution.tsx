import type { HTMLAttributes } from "react";

export function PublicAttribution({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs font-medium tracking-[0.04em] opacity-70 ${className}`} {...props}>
      Propulsé par <span className="font-semibold">PRONTO</span> <span aria-hidden="true">·</span> by ALTMachine
    </p>
  );
}
