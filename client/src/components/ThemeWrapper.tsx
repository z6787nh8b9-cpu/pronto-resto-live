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
    // Charger le CSS du thème via un élément <link>
    const linkId = 'theme-stylesheet';
    let linkElement = document.getElementById(linkId) as HTMLLinkElement;

    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.id = linkId;
      linkElement.rel = 'stylesheet';
      document.head.appendChild(linkElement);
    }

    // Mettre à jour le href avec le bon thème
    linkElement.href = `/src/themes/${theme}.css`;

    // Appliquer l'attribut data-theme au body
    document.body.setAttribute('data-theme', theme);

    // Cleanup: retirer l'attribut au démontage
    return () => {
      document.body.removeAttribute('data-theme');
    };
  }, [theme]);

  return <div data-theme={theme}>{children}</div>;
}
