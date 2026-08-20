import { Check, Download, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { applyProntoPwaUpdate } from "@/lib/pwa";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallControl() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const updateInstallState = () => {
      const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
      setIsInstalled(standaloneQuery.matches || navigatorWithStandalone.standalone === true);
    };
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };
    const onUpdate = () => setUpdateReady(true);
    updateInstallState();
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("pronto:pwa-update", onUpdate);
    standaloneQuery.addEventListener("change", updateInstallState);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("pronto:pwa-update", onUpdate);
      standaloneQuery.removeEventListener("change", updateInstallState);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  const applyUpdate = () => {
    setIsApplyingUpdate(true);
    applyProntoPwaUpdate();
  };

  if (!installPrompt && !updateReady && !isInstalled) return null;
  return (
    <div className="container mt-3 flex flex-wrap items-center justify-end gap-2 px-4 sm:px-6 lg:px-8" aria-live="polite">
      {isInstalled && !updateReady && <p className="inline-flex items-center gap-2 rounded-xl border border-emerald-900/10 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900"><Check className="h-3.5 w-3.5" aria-hidden="true" />PRONTO est installé sur cet appareil</p>}
      {installPrompt && <Button variant="outline" size="sm" className="rounded-xl" onClick={install}><Download className="mr-2 h-4 w-4" aria-hidden="true" />Installer PRONTO B2B</Button>}
      {updateReady && <Button size="sm" className="rounded-xl" onClick={applyUpdate} disabled={isApplyingUpdate} aria-busy={isApplyingUpdate}><RefreshCw className={`mr-2 h-4 w-4 ${isApplyingUpdate ? "animate-spin" : ""}`} aria-hidden="true" />{isApplyingUpdate ? "Mise à jour…" : "Mettre à jour"}</Button>}
    </div>
  );
}
