export const storefrontThemes = ['pronto-service', 'moderne-soho', 'beach-boheme', 'day-night', 'marble-rome'] as const;
export type StorefrontTheme = typeof storefrontThemes[number];

interface ThemeWrapperProps {
  theme: StorefrontTheme;
  children: React.ReactNode;
}

export function resolveStorefrontTheme(theme: string | null | undefined, subscriptionTier: string | null | undefined): StorefrontTheme {
  if (subscriptionTier !== 'premium') return 'pronto-service';
  return storefrontThemes.includes(theme as StorefrontTheme) ? theme as StorefrontTheme : 'pronto-service';
}

/** Applies a scoped, bundled storefront theme without runtime stylesheet requests. */
export function ThemeWrapper({ theme, children }: ThemeWrapperProps) {
  return <div data-theme={theme} className="public-storefront">{children}</div>;
}
