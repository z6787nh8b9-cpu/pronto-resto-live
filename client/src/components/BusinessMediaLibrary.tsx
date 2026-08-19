import { useRef, useState } from "react";
import { Archive, Check, Copy, FileText, ImagePlus, LoaderCircle, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });
}

export function BusinessMediaLibrary({ businessId }: { businessId: number | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const { data: assets, isLoading } = trpc.businesses.listMedia.useQuery({ businessId: businessId || 0 }, { enabled: Boolean(businessId) });
  const upload = trpc.businesses.uploadMedia.useMutation({ onSuccess: () => { utils.businesses.listMedia.invalidate({ businessId: businessId || 0 }); toast.success("Média ajouté à votre bibliothèque"); } });
  const archive = trpc.businesses.archiveMedia.useMutation({ onSuccess: () => { utils.businesses.listMedia.invalidate({ businessId: businessId || 0 }); toast.success("Le média a été retiré de votre bibliothèque"); } });

  if (!businessId) return null;
  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!ACCEPT.includes(file.type) || file.size > 5 * 1024 * 1024) return toast.error("Choisissez une image JPG, PNG, WEBP ou un PDF de 5 Mo maximum.");
    try { upload.mutate({ businessId, fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf", base64: await readAsBase64(file) }); } catch { toast.error("Impossible de préparer ce fichier"); }
  };
  const copyUrl = async (id: number, url: string) => { await navigator.clipboard.writeText(url); setCopiedId(id); setTimeout(() => setCopiedId(null), 1600); };

  return <Card className="pronto-panel border-0"><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-2xl"><ImagePlus className="h-5 w-5 text-pronto-primary" /> Médiathèque</CardTitle><CardDescription className="mt-2">Conservez les visuels et documents autorisés pour votre vitrine.</CardDescription></div><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /><Button onClick={() => inputRef.current?.click()} disabled={upload.isPending} className="rounded-xl bg-pronto-primary">{upload.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}Ajouter</Button></CardHeader><CardContent>{isLoading ? <p className="text-sm text-muted-foreground">Chargement de la médiathèque…</p> : !assets?.length ? <div className="rounded-2xl border border-dashed border-border p-8 text-center"><ImagePlus className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-semibold">Votre bibliothèque est prête</p><p className="mt-1 text-sm text-muted-foreground">Ajoutez une image ou un PDF : les fichiers restent rattachés à votre entreprise.</p></div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{assets.map((asset) => <article key={asset.id} className="overflow-hidden rounded-2xl border border-border/70 bg-background"><div className="grid aspect-[4/3] place-items-center bg-secondary/60">{asset.mimeType.startsWith("image/") ? <img src={asset.url} alt="" className="h-full w-full object-cover" /> : <FileText className="h-9 w-9 text-pronto-primary" />}</div><div className="flex items-center gap-2 p-3"><p className="min-w-0 flex-1 truncate text-sm font-medium" title={asset.originalName}>{asset.originalName}</p><Button variant="ghost" size="icon" aria-label="Copier l'URL du média" onClick={() => void copyUrl(asset.id, asset.url)}>{copiedId === asset.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</Button><AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Retirer ce média" disabled={archive.isPending}><Archive className="h-4 w-4 text-muted-foreground" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Retirer ce média ?</AlertDialogTitle><AlertDialogDescription>« {asset.originalName} » ne sera plus visible dans votre médiathèque. Le fichier restera archivé pour préserver les contenus qui l'utilisent déjà.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => archive.mutate({ businessId, assetId: asset.id })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Retirer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></article>)}</div>}</CardContent></Card>;
}
