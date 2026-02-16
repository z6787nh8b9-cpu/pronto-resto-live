import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ContactFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  source: "HEADER" | "HERO" | "FOOTER";
}

export function ContactFormDialog({ isOpen, onClose, source }: ContactFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitMutation = trpc.public.submitContactForm.useMutation({
    onSuccess: () => {
      toast.success("Demande envoyée ! Nous vous recontacterons rapidement.");
      onClose();
    },
    onError: (error) => {
      toast.error(`Erreur : ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;

    submitMutation.mutate({
      name,
      email,
      phone,
      message,
      source,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Essai gratuit 14 jours</DialogTitle>
          <DialogDescription>
            Remplissez ce formulaire et nous vous recontacterons rapidement pour démarrer votre essai gratuit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du restaurant *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Le Bistrot Parisien"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contact@restaurant.fr"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optionnel)</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Parlez-nous de votre restaurant..."
              rows={3}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Envoi..." : "Envoyer ma demande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
