import { useEffect, useState } from "react";
import { Check, CircleDashed, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type OnboardingStep = "business_type" | "catalog" | "media" | "profile" | "publish";
type Industry = "restaurant" | "beauty" | "retail" | "service" | "events" | "other";

const steps = [
  { id: "business_type" as const, label: "Définir votre activité", description: "Choisissez le format qui ressemble à votre entreprise." },
  { id: "catalog" as const, label: "Préparer votre contenu", description: "Ajoutez une carte, des services ou un catalogue." },
  { id: "profile" as const, label: "Personnaliser votre vitrine", description: "Complétez vos informations et votre identité visuelle." },
  { id: "publish" as const, label: "Vérifier avant de publier", description: "Ouvrez la vitrine comme le ferait un visiteur." },
];

export function BusinessOnboardingCard({ businessId, onNavigate }: { businessId: number | null; onNavigate: (tab: "menu" | "settings" | "import") => void }) {
  const utils = trpc.useUtils();
  const { data: onboarding } = trpc.businesses.getOnboarding.useQuery({ businessId: businessId || 0 }, { enabled: Boolean(businessId) });
  const { data: workspace } = trpc.businesses.getWorkspace.useQuery({ businessId: businessId || 0 }, { enabled: Boolean(businessId) });
  const [industry, setIndustry] = useState<Industry>("other");
  const [goal, setGoal] = useState("");
  const update = trpc.businesses.updateOnboarding.useMutation({
    onSuccess: () => {
      utils.businesses.getOnboarding.invalidate({ businessId: businessId || 0 });
      toast.success("Votre progression a été enregistrée");
    },
  });

  useEffect(() => {
    if (onboarding?.industry) setIndustry(onboarding.industry as Industry);
    else if (workspace?.business.vertical) setIndustry(workspace.business.vertical as Industry);
    if (onboarding?.primaryGoal) setGoal(onboarding.primaryGoal);
  }, [onboarding?.industry, onboarding?.primaryGoal, workspace?.business.vertical]);

  if (!businessId) return null;
  const completed = new Set<OnboardingStep>((onboarding?.completedSteps || []) as OnboardingStep[]);
  const completedCount = steps.filter((step) => completed.has(step.id)).length;
  const mergedSteps = (step: OnboardingStep) => Array.from(new Set<OnboardingStep>([...Array.from(completed), step]));
  const saveSetup = () => update.mutate({ businessId, industry, primaryGoal: goal || "Présenter mon activité", completedSteps: mergedSteps("business_type"), status: "in_progress" });
  const goTo = (step: typeof steps[number]) => {
    const tab = step.id === "catalog" ? "import" : step.id === "profile" ? "settings" : "menu";
    update.mutate({ businessId, completedSteps: mergedSteps(step.id), status: completedCount + 1 >= steps.length ? "completed" : "in_progress" });
    onNavigate(tab);
  };

  return (
    <Card className="pronto-panel overflow-hidden border-0">
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-pronto-primary/8 to-transparent">
        <div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-2xl"><Sparkles className="h-5 w-5 text-pronto-primary" /> Bien démarrer</CardTitle><CardDescription className="mt-2">{completedCount}/4 étapes terminées. Avancez à votre rythme, rien ne se publie sans vous.</CardDescription></div><span className="rounded-full bg-pronto-primary/10 px-3 py-1 text-xs font-semibold text-pronto-primary">{Math.round((completedCount / steps.length) * 100)}%</span></div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><div className="space-y-2"><Label>Votre activité</Label><Select value={industry} onValueChange={(value) => setIndustry(value as Industry)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="restaurant">Restaurant ou bar</SelectItem><SelectItem value="beauty">Beauté & bien-être</SelectItem><SelectItem value="retail">Boutique & créateur</SelectItem><SelectItem value="service">Commerce ou service</SelectItem><SelectItem value="events">Évènementiel</SelectItem><SelectItem value="other">Autre activité</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Votre objectif</Label><Input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Ex. présenter mes prestations" /></div><Button onClick={saveSetup} disabled={update.isPending} className="rounded-xl bg-pronto-primary">Enregistrer</Button></div>
        <div className="divide-y divide-border/60 rounded-2xl border border-border/60">
          {steps.map((step) => <div key={step.id} className="flex items-center gap-3 p-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${completed.has(step.id) ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"}`}>{completed.has(step.id) ? <Check className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="font-semibold">{step.label}</p><p className="text-sm text-muted-foreground">{step.description}</p></div>{step.id !== "business_type" && <Button variant="ghost" size="sm" onClick={() => goTo(step)} className="shrink-0 text-pronto-primary">Ouvrir</Button>}</div>)}
        </div>
      </CardContent>
    </Card>
  );
}
