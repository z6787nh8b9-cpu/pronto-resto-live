import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MessageCircle, Phone, MapPin, Mail, Clock, Calendar, X, Send, ChevronRight } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import ReactMarkdown from "react-markdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";

export default function RestaurantHomePage() {
  const params: { slug?: string } = useParams();
  const [, navigate] = useLocation();
  const slug = params.slug || "";
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [sessionId] = useState(() => nanoid());

  // Get restaurant data
  const { data: restaurant, isLoading } = trpc.public.getRestaurant.useQuery(
    { slug },
    { enabled: !!slug }
  );

  // Translation hook
  const { currentLanguage, setCurrentLanguage, translate } = useTranslation(restaurant?.id);

  // Get menu data (pour afficher les plats signatures)
  const { data: menuData } = trpc.public.getMenu.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id }
  );

  // Chat mutation
  const chatMutation = trpc.public.chat.useMutation({
    onSuccess: (data) => {
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi du message");
    },
  });

  // Track page view
  const trackPageViewMutation = trpc.public.trackPageView.useMutation();

  useEffect(() => {
    if (restaurant?.id) {
      trackPageViewMutation.mutate({
        restaurantId: restaurant.id,
        path: window.location.pathname,
      });
    }
  }, [restaurant?.id]);

  // Redirection automatique si pas PREMIUM
  useEffect(() => {
    if (restaurant && restaurant.subscriptionTier !== "premium") {
      navigate(`/${slug}/menu`);
    }
  }, [restaurant, slug, navigate]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !restaurant) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");

    chatMutation.mutate({
      restaurantId: restaurant.id,
      sessionId,
      message: userMessage,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Restaurant non trouvé</p>
      </div>
    );
  }

  const primaryColor = restaurant.primaryColor || "#ef4444";
  const accentColor = restaurant.accentColor || "#fbbf24";
  
  // Récupérer 4-6 plats signatures (les premiers de chaque catégorie)
  const signatureDishes = menuData?.items?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec logo et navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            {restaurant.logoUrl && (
              <img src={restaurant.logoUrl} alt={restaurant.name} className="h-10 w-auto object-contain" />
            )}
            <h1 className="text-xl font-bold">{restaurant.name}</h1>
          </div>
          
          <nav className="flex items-center gap-4">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
            />
            <Button variant="ghost" onClick={() => navigate(`/${slug}/menu`)}>
              Menu
            </Button>
            <Button variant="ghost" onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>
              Contact
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        {restaurant.heroImageUrl ? (
          <img
            src={restaurant.heroImageUrl}
            alt={restaurant.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative container h-full flex flex-col justify-center items-center text-center text-white">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">{restaurant.name}</h2>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl">{restaurant.description}</p>
          <div className="flex gap-4">
            <Button size="lg" onClick={() => navigate(`/${slug}/menu`)} style={{ backgroundColor: primaryColor }}>
              Voir le menu
            </Button>
            {restaurant.reservationUrl && (
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur text-white border-white hover:bg-white/20">
                Réserver
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Qui sommes-nous */}
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Qui sommes-nous ?</Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-6">Bienvenue chez {restaurant.name}</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {restaurant.description || "Découvrez notre univers culinaire unique, où tradition et innovation se rencontrent pour vous offrir une expérience gastronomique inoubliable."}
            </p>
          </div>
        </div>
      </section>

      {/* Plats Signatures */}
      {signatureDishes.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Nos Spécialités</Badge>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Quelques-uns de nos plats</h3>
              <p className="text-lg text-muted-foreground">Découvrez une sélection de nos créations signatures</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {signatureDishes.map((dish) => (
                <Card key={dish.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {dish.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold mb-2">{dish.name}</h4>
                    {dish.description && (
                      <p className="text-sm text-muted-foreground mb-3">{dish.description}</p>
                    )}
                    <p className="text-xl font-bold" style={{ color: primaryColor }}>
                      {Number(dish.price).toFixed(2)}€
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button size="lg" onClick={() => navigate(`/${slug}/menu`)} style={{ backgroundColor: primaryColor }}>
                Voir le menu complet
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Informations Pratiques */}
      <section id="contact" className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Informations Pratiques</Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Nous trouver</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h4 className="text-xl font-semibold mb-4">Contact</h4>
                {restaurant.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <a href={`tel:${restaurant.phone}`} className="hover:underline">
                      {restaurant.phone}
                    </a>
                  </div>
                )}
                {restaurant.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <a href={`mailto:${restaurant.email}`} className="hover:underline">
                      {restaurant.email}
                    </a>
                  </div>
                )}
                {restaurant.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <p>{restaurant.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Horaires (placeholder pour Phase 4) */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h4 className="text-xl font-semibold mb-4">Horaires</h4>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Les horaires seront disponibles prochainement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bouton Réservation */}
          {restaurant.reservationUrl && (
            <div className="text-center mt-8">
              <Button size="lg" style={{ backgroundColor: primaryColor }}>
                <Calendar className="mr-2 h-5 w-5" />
                Réserver une table
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            Propulsé par <span className="font-semibold">PRONTO by Altmachine</span>
          </p>
        </div>
      </footer>

      {/* Bouton WhatsApp flottant */}
      {restaurant.whatsapp && (
        <a
          href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        >
          <Phone className="h-6 w-6" />
        </a>
      )}

      {/* Bouton Chatbot flottant */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 left-6 z-50 rounded-full p-4 shadow-lg"
        style={{ backgroundColor: primaryColor }}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Dialog Chatbot */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>Assistant {restaurant.name}</span>
              <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Bonjour ! Comment puis-je vous aider ?</p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="text-sm prose prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">...</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Posez votre question..."
                disabled={chatMutation.isPending}
              />
              <Button type="submit" size="icon" disabled={chatMutation.isPending || !chatInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
