export function normalizeWhatsAppNumber(value?: string | null): string | null {
  const digits = value?.replace(/\D/g, "") || "";
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function getWhatsAppUrl(value?: string | null, message?: string): string | null {
  const number = normalizeWhatsAppNumber(value);
  if (!number) return null;
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
