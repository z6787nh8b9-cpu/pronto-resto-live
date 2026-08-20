import { useEffect } from "react";

type PublicSeoInput = {
  title: string;
  description: string;
  pathname: string;
  imageUrl?: string | null;
  noIndex?: boolean;
};

const DEFAULT_DESCRIPTION = "PRONTO crée des vitrines et catalogues clairs pour les commerces de proximité.";

function upsertMeta(attribute: "name" | "property", key: string, content?: string) {
  const selector = `meta[${attribute}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);

  if (!content) {
    existing?.remove();
    return;
  }

  const meta = existing ?? document.createElement("meta");
  meta.setAttribute(attribute, key);
  meta.content = content;
  if (!existing) document.head.appendChild(meta);
}

function upsertCanonical(pathname: string) {
  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.createElement("link");
  canonical.rel = "canonical";
  canonical.href = new URL(pathname, window.location.origin).toString();
  if (!canonical.parentNode) document.head.appendChild(canonical);
}

function toPublicImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return undefined;
  try {
    const resolved = new URL(imageUrl, window.location.origin);
    return ["http:", "https:"].includes(resolved.protocol) ? resolved.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function usePublicSeo({ title, description, pathname, imageUrl, noIndex = false }: PublicSeoInput) {
  useEffect(() => {
    const safeDescription = (description || DEFAULT_DESCRIPTION).trim().slice(0, 160);
    const absoluteUrl = new URL(pathname, window.location.origin).toString();
    const publicImageUrl = toPublicImageUrl(imageUrl);

    document.documentElement.lang = "fr";
    document.title = title;
    upsertMeta("name", "description", safeDescription);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", "PRONTO");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", safeDescription);
    upsertMeta("property", "og:url", absoluteUrl);
    upsertMeta("property", "og:image", publicImageUrl);
    upsertMeta("name", "twitter:card", publicImageUrl ? "summary_large_image" : "summary");
    upsertCanonical(pathname);
  }, [description, imageUrl, noIndex, pathname, title]);
}
