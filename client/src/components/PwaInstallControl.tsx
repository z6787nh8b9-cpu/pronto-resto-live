import { Download, RefreshCw } from "lucide-react";
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

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    const onUpdate = () => setUpdateReady(true);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("pronto:pwa-update", onUpdate);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("pronto:pwa-update", onUpdate);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  if (!installPrompt && !updateReady) return null;
  return (
    <div className="container mt-3 flex justify-end px-4 sm:px-6 lg:px-8" aria-live="polite">
      {installPrompt && <Button variant="outline" size="sm" className="rounded-xl" onClick={install}><Download className="mr-2 h-4 w-4" />Installer PRONTO B2B</Button>}
      {updateReady && <Button size="sm" className="rounded-xl" onClick={applyProntoPwaUpdate}><RefreshCw className="mr-2 h-4 w-4" />Mettre à jour</Button>}
    </div>
  );
}
