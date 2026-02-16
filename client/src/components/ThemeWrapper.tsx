import { useEffect } from 'react';

interface ThemeWrapperProps {
  theme: 'pronto-service' | 'moderne-soho' | 'beach-boheme' | 'day-night' | 'marble-rome';
  children: React.ReactNode;
}

/**
 * ThemeWrapper - Charge dynamiquement le CSS du thème et applique l'attribut data-theme
 */
export function ThemeWrapper({ theme, children }: ThemeWrapperProps) {
  useEffect(() => {
    // Charger le CSS du thème dynamiquement
    const loadThemeCSS = async () => {
      try {
        // Import dynamique du fichier CSS du thème
        await import(`@/themes/${theme}.css`);
      } catch (error) {
        console.error(`Failed to load theme: ${theme}`, error);
        // Fallback sur le thème par défaut
        if (theme !== 'pronto-service') {
          await import('@/themes/pronto-service.css');
        }
      }
    };

    loadThemeCSS();

    // Appliquer l'attribut data-theme au body
    document.body.setAttribute('data-theme', theme);

    // Cleanup: retirer l'attribut au démontage
    return () => {
      document.body.removeAttribute('data-theme');
    };
  }, [theme]);

  return <div data-theme={theme}>{children}</div>;
}
