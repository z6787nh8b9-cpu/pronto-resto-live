import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MessageCircle, Phone, MapPin, Mail, Clock, Calendar, X, Send, ChevronRight, CalendarDays, Users } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import ReactMarkdown from "react-markdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";
import { ReservationFlow } from "@/components/ReservationFlow";
import { EventRegistrationFlow } from "@/components/EventRegistrationFlow";

export default function RestaurantHomePage() {
  const params: { slug?: string } = useParams();
  const [, navigate] = useLocation();
  const slug = params.slug || "";
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isEventRegistrationOpen, setIsEventRegistrationOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
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

  // Get opening hours
  const { data: openingHours } = trpc.openingHours.getOpeningHours.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id }
  );

  // Get public events
  const { data: events } = trpc.events.getPublicEvents.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id && restaurant?.featuresEnabled?.events }
  );

  // Get advertisements (only for MENU tier)
  const { data: advertisements } = trpc.public.getActiveAdvertisements.useQuery(
    undefined,
    { enabled: restaurant?.subscriptionTier === "menu" && restaurant?.showAds }
  );

  // Get gallery photos (PREMIUM feature)
  const { data: galleryPhotos } = trpc.gallery.getGalleryPhotos.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id && restaurant?.subscriptionTier === "premium" }
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

  const handleSendMessage = () => {
    if (!chatInput.trim() || !restaurant) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");

    chatMutation.mutate({
      restaurantId: restaurant.id,
      message: userMessage,
      sessionId,
    });
  };

  const handleEventRegister = (event: any) => {
    setSelectedEvent(event);
    setIsEventRegistrationOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Restaurant non trouvé</h1>
          <p className="text-neutral-600">Ce restaurant n'existe pas ou n'est plus actif.</p>
        </div>
      </div>
    );
  }

  // Afficher quelques plats signatures (max 6)
  const featuredDishes = menuData?.items?.filter((item: any) => item.isFeatured).slice(0, 6) || 
                         menuData?.items?.slice(0, 6) || [];

  const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  return (
    <div className="min-h-screen bg-white">
      {/* Header moderne et minimaliste */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {restaurant.logoUrl && (
                <img 
                  src={restaurant.logoUrl} 
                  alt={restaurant.name}
                  className="h-12 w-12 object-cover rounded-full"
                />
              )}
              <span className="text-xl font-semibold text-neutral-900 tracking-tight">
                {restaurant.name}
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <LanguageSelector 
                currentLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
              />
              <button
                onClick={() => navigate(`/${slug}/menu`)}
                className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                Menu
              </button>
              <button
                onClick={() => setIsReservationOpen(true)}
                className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                Réserver
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Design moderne avec overlay subtil */}
      <section className="relative h-[70vh] min-h-[500px] mt-20">
        {restaurant.heroImageUrl && (
          <div className="absolute inset-0">
            <img
              src={restaurant.heroImageUrl}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-white"></div>
          </div>
        )}
        
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center px-4 max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 tracking-tight">
              {translate("restaurant", restaurant.id, "name", restaurant.name)}
            </h1>
            {restaurant.description && (
              <p className="text-lg md:text-xl text-white/90 mb-8 font-light leading-relaxed">
                {translate("restaurant", restaurant.id, "description", restaurant.description)}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate(`/${slug}/menu`)}
                className="bg-white text-neutral-900 hover:bg-neutral-100 px-8 py-6 text-base font-medium rounded-none"
              >
                Découvrir le menu
              </Button>
              {restaurant.featuresEnabled?.reservations && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsReservationOpen(true)}
                  className="border-2 border-white text-white hover:bg-white hover:text-neutral-900 px-8 py-6 text-base font-medium rounded-none"
                >
                  Réserver une table
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Dishes - Grid moderne */}
      {featuredDishes.length > 0 && (
        <section className="py-24 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-neutral-900 mb-4">
                Nos Spécialités
              </h2>
              <div className="w-24 h-1 bg-neutral-900 mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredDishes.map((dish: any) => (
                <div
                  key={dish.id}
                  className="group bg-white overflow-hidden transition-all duration-300 hover:shadow-2xl"
                >
                  {dish.imageUrl && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold text-neutral-900 flex-1">
                        {translate("item", dish.id, "name", dish.name)}
                      </h3>
                      <span className="text-lg font-bold text-neutral-900 ml-4">
                        {typeof dish.price === 'number' ? dish.price.toFixed(2) : Number(dish.price).toFixed(2)}€
                      </span>
                    </div>
                    {dish.description && (
                      <p className="text-neutral-600 text-sm leading-relaxed mb-4">
                        {translate("item", dish.id, "description", dish.description)}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {dish.isVegetarian && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-0">
                          Végétarien
                        </Badge>
                      )}
                      {dish.isVegan && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-0">
                          Vegan
                        </Badge>
                      )}
                      {dish.isGlutenFree && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-0">
                          Sans gluten
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate(`/${slug}/menu`)}
                className="border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white px-8 py-6 text-base font-medium rounded-none"
              >
                Voir le menu complet
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Events Section - Si activé */}
      {restaurant.featuresEnabled?.events && events && events.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-neutral-900 mb-4">
                Événements à venir
              </h2>
              <div className="w-24 h-1 bg-neutral-900 mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event: any) => (
                <Card key={event.id} className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-shadow">
                  {event.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">{event.title}</h3>
                    <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <CalendarDays className="h-4 w-4" />
                        <span>{new Date(event.eventDate).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Users className="h-4 w-4" />
                        <span>{event.currentAttendees} / {event.maxAttendees} participants</span>
                      </div>
                      {event.price > 0 && (
                        <div className="text-lg font-bold text-neutral-900">
                          {typeof event.price === 'number' ? event.price.toFixed(2) : Number(event.price).toFixed(2)} {event.currency}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleEventRegister(event)}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white rounded-none"
                      disabled={event.currentAttendees >= event.maxAttendees}
                    >
                      {event.currentAttendees >= event.maxAttendees ? "Complet" : "S'inscrire"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section - PREMIUM only */}
      {restaurant.subscriptionTier === "premium" && galleryPhotos && galleryPhotos.length > 0 && (
        <section className="py-24 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-neutral-900 mb-4">
                Galerie
              </h2>
              <div className="w-24 h-1 bg-neutral-900 mx-auto"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryPhotos.map((photo: any) => (
                <div key={photo.id} className="aspect-square overflow-hidden group">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || ""}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact & Info Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-serif font-bold text-neutral-900 mb-8">
                Nous contacter
              </h2>
              <div className="space-y-6">
                {restaurant.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-neutral-900" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500 mb-1">Téléphone</p>
                      <a href={`tel:${restaurant.phone}`} className="text-lg text-neutral-900 hover:underline">
                        {restaurant.phone}
                      </a>
                    </div>
                  </div>
                )}
                {restaurant.email && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-neutral-900" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500 mb-1">Email</p>
                      <a href={`mailto:${restaurant.email}`} className="text-lg text-neutral-900 hover:underline">
                        {restaurant.email}
                      </a>
                    </div>
                  </div>
                )}
                {restaurant.address && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-neutral-900" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500 mb-1">Adresse</p>
                      <p className="text-lg text-neutral-900">{restaurant.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Opening Hours */}
            {openingHours && openingHours.length > 0 && (
              <div>
                <h2 className="text-3xl font-serif font-bold text-neutral-900 mb-8">
                  Horaires d'ouverture
                </h2>
                <div className="space-y-4">
                  {openingHours.map((hours: any) => (
                    <div key={hours.id} className="flex justify-between items-center py-3 border-b border-neutral-200">
                      <span className="font-medium text-neutral-900">
                        {daysOfWeek[hours.dayOfWeek]}
                      </span>
                      <span className="text-neutral-600">
                        {hours.isClosed ? (
                          "Fermé"
                        ) : (
                          `${hours.openTime} - ${hours.closeTime}`
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Advertisements Banner - MENU tier only */}
      {restaurant.subscriptionTier === "menu" && restaurant.showAds && advertisements && advertisements.length > 0 && (
        <section className="py-12 bg-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {advertisements.map((ad: any) => (
                <a
                  key={ad.id}
                  href={ad.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <div className="aspect-video overflow-hidden bg-white">
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 text-sm text-neutral-600 text-center">{ad.title}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-neutral-400 text-sm">
            © {new Date().getFullYear()} {restaurant.name}. Tous droits réservés.
          </p>
          <p className="text-neutral-500 text-xs mt-2">
            Propulsé par <span className="font-semibold">PRONTO</span>
          </p>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        {restaurant.whatsapp && (
          <a
            href={`https://wa.me/${restaurant.whatsapp.replace(/\s/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Contacter sur WhatsApp"
          >
            <Phone className="h-6 w-6" />
          </a>
        )}
        <button
          onClick={() => setIsChatOpen(true)}
          className="w-14 h-14 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          aria-label="Ouvrir le chatbot"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>

      {/* Chatbot Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 rounded-none">
          <DialogHeader className="px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                Assistant {restaurant.name}
              </DialogTitle>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-neutral-500 hover:text-neutral-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-neutral-500 mt-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                <p>Bonjour ! Comment puis-je vous aider ?</p>
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-900"
                  }`}
                >
                  <div className="text-sm prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-neutral-200">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Posez votre question..."
                className="flex-1 rounded-none border-neutral-300 focus-visible:ring-neutral-900"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || chatMutation.isPending}
                className="bg-neutral-900 hover:bg-neutral-800 rounded-none px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reservation Dialog */}
      {restaurant.featuresEnabled?.reservations && (
        <Dialog open={isReservationOpen} onOpenChange={setIsReservationOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">Réserver une table</DialogTitle>
            </DialogHeader>
            <ReservationFlow restaurantId={restaurant.id} restaurantName={restaurant.name} />
          </DialogContent>
        </Dialog>
      )}

      {/* Event Registration Dialog */}
      {selectedEvent && (
        <Dialog open={isEventRegistrationOpen} onOpenChange={setIsEventRegistrationOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">
                S'inscrire à {selectedEvent.title}
              </DialogTitle>
            </DialogHeader>
            <EventRegistrationFlow
              event={selectedEvent}
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
