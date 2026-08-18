import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CatalogType = "menu" | "services" | "products" | "price_list" | "portfolio" | "events";

const labels: Record<CatalogType, string> = {
  menu: "Menu / carte",
  services: "Prestations",
  products: "Produits",
  price_list: "Liste de prix",
  portfolio: "Portfolio",
  events: "Événements",
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Fichier invalide."));
    reader.readAsDataURL(file);
  });
}

function resolveSource(file: File) {
  const mimeType = file.type || (file.name.endsWith(".csv") ? "text/csv" : "");
  if (["text/csv", "application/vnd.ms-excel", "text/plain"].includes(mimeType)) return { sourceType: "csv" as const, mimeType };
  if (mimeType === "application/pdf") return { sourceType: "pdf" as const, mimeType };
  if (["image/jpeg", "image/png", "image/webp"].includes(mimeType)) return { sourceType: "image" as const, mimeType };
  return null;
}

export function CatalogImportCard({ restaurantId, defaultCatalogName }: { restaurantId: number; defaultCatalogName: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [catalogName, setCatalogName] = useState(defaultCatalogName);
  const [catalogType, setCatalogType] = useState<CatalogType>("menu");
  const [review, setReview] = useState<any>(null);
  const utils = trpc.useUtils();
  const { data: business, isLoading: isBusinessLoading } = trpc.businesses.getByLegacyRestaurant.useQuery({ restaurantId }, { enabled: restaurantId > 0 });

  const analyzeImport = trpc.imports.analyze.useMutation({
    onSuccess: result => {
      setReview(result);
      toast.success("Analyse terminée : vérifiez le brouillon avant de l'appliquer.");
    },
    onError: error => toast.error(error.message),
  });
  const applyImport = trpc.imports.applyDraft.useMutation({
    onSuccess: async () => {
      toast.success("Brouillon appliqué. Le nouveau catalogue reste non publié.");
      await utils.businesses.getWorkspace.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const analyze = async () => {
    if (!business) return toast.error("Le noyau entreprise est encore en cours de préparation.");
    if (!file) return toast.error("Choisissez un CSV, un PDF ou une image.");
    const source = resolveSource(file);
    if (!source) return toast.error("Formats acceptés : CSV, PDF, JPG, PNG ou WEBP.");
    if (!catalogName.trim()) return toast.error("Donnez un nom au catalogue.");

    try {
      const base64Data = await fileToDataUrl(file);
      analyzeImport.mutate({
        businessId: business.id,
        catalogName: catalogName.trim(),
        catalogType,
        sourceType: source.sourceType,
        fileName: file.name,
        mimeType: source.mimeType,
        base64Data,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Préparation du fichier impossible.");
    }
  };

  const totalItems = review?.draft?.collections?.reduce((sum: number, collection: any) => sum + collection.items.length, 0) ?? 0;

  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.05] via-background to-background">
      <CardHeader className="border-b border-border/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" /> Import assisté</CardTitle>
            <CardDescription>Importez une carte, une liste de soins ou un catalogue depuis un CSV, un PDF ou une photo. Rien n’est publié sans votre validation.</CardDescription>
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> Brouillon contrôlé</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="import-catalog-name">Nom du futur catalogue</Label>
            <Input id="import-catalog-name" value={catalogName} onChange={event => setCatalogName(event.target.value)} placeholder="Ex. Carte des soins" />
          </div>
          <div className="space-y-2">
            <Label>Type de contenu</Label>
            <Select value={catalogType} onValueChange={value => setCatalogType(value as CatalogType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(labels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <input ref={inputRef} className="sr-only" type="file" accept=".csv,text/csv,application/pdf,image/jpeg,image/png,image/webp" onChange={event => {
          const selected = event.target.files?.[0] ?? null;
          setFile(selected);
          setReview(null);
        }} />
        <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center gap-4 rounded-xl border border-dashed border-primary/30 bg-background/60 p-4 text-left transition-colors hover:border-primary/70 hover:bg-primary/[0.03]">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary"><Upload className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-medium">{file ? file.name : "Choisir un fichier"}</span><span className="block truncate text-sm text-muted-foreground">{file ? `${Math.ceil(file.size / 1024)} Ko · prêt à analyser` : "CSV, PDF, JPG, PNG ou WEBP — importé dans un brouillon"}</span></span>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Relisez toujours les résultats issus d’une photo ou d’un PDF : ils restent modifiables avant publication.</p>
          <Button onClick={analyze} disabled={!file || isBusinessLoading || analyzeImport.isPending} className="sm:min-w-40">
            {analyzeImport.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyser le fichier
          </Button>
        </div>

        {review && <div className="rounded-xl border border-primary/20 bg-background/80 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Brouillon prêt à vérifier</p><p className="text-sm text-muted-foreground">{review.draft.collections.length} catégories · {totalItems} éléments · statut : non publié</p></div><Button onClick={() => applyImport.mutate({ businessId: business!.id, importJobId: review.jobId })} disabled={applyImport.isPending}>{applyImport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer le brouillon</Button></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{review.draft.collections.slice(0, 6).map((collection: any) => <div key={collection.name} className="rounded-lg border border-border/70 px-3 py-2 text-sm"><span className="font-medium">{collection.name}</span><span className="ml-2 text-muted-foreground">{collection.items.length} éléments</span></div>)}</div>
        </div>}
      </CardContent>
    </Card>
  );
}
