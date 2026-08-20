import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const supportedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
type SupportedImageType = typeof supportedImageTypes[number];

function isSupportedImageType(value: string): value is SupportedImageType {
  return (supportedImageTypes as readonly string[]).includes(value);
}

interface ImageUploadProps {
  label: string;
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  aspectRatio?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  label,
  currentImageUrl,
  onUploadComplete,
  aspectRatio = "16/9",
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);

  const uploadMutation = trpc.upload.uploadImage.useMutation({
    onSuccess: (data) => {
      setPreviewUrl(data.url);
      onUploadComplete(data.url);
      toast.success("Image téléchargée avec succès");
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors du téléchargement");
      setIsUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`La taille du fichier ne doit pas dépasser ${maxSizeMB}MB`);
      return;
    }

    // Check file type
    const mimeType = file.type;
    if (!isSupportedImageType(mimeType)) {
      toast.error("Utilisez une image JPEG, PNG ou WebP");
      return;
    }

    setIsUploading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      uploadMutation.mutate({
        base64Data: base64,
        filename: file.name,
        mimeType,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onUploadComplete("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full rounded-lg border"
            style={{ aspectRatio }}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          style={{ aspectRatio }}
        >
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
            id={`upload-${label}`}
          />
          <Label
            htmlFor={`upload-${label}`}
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Téléchargement...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Cliquez pour télécharger une image
                </p>
                <p className="text-xs text-muted-foreground">
                  Max {maxSizeMB}MB • JPG, PNG, WebP
                </p>
              </>
            )}
          </Label>
        </div>
      )}
    </div>
  );
}
