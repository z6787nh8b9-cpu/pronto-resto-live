import { registerSW } from "virtual:pwa-register";

let applyUpdate: (() => void) | null = null;

/** Registers only the asset shell. API and authenticated responses remain network-only. */
export function registerProntoPwa() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent("pronto:pwa-update"));
    },
  });
  applyUpdate = () => updateServiceWorker(true);
}

export function applyProntoPwaUpdate() {
  applyUpdate?.();
}
