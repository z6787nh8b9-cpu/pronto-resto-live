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
import { ThemeWrapper } from "@/components/ThemeWrapper";

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

  // Set theme attribute on body
  useEffect(() => {
    if (restaurant?.theme) {
      const themeName = restaurant.theme || 'pronto-service';
      document.body.setAttribute('data-theme', themeName);
    }
    return () => {
      document.body.removeAttribute('data-theme');
    };
  }, [restaurant?.theme]);

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

  const theme = restaurant.theme || 'pronto-service';
  const signatureDishes = menuData?.items?.slice(0, 6) || [];

  return (
    <ThemeWrapper theme={theme}>
      {/* Hero Section */}
      <section className="theme-hero">
        {restaurant.heroImageUrl && (
          <div className="absolute inset-0">
            <img
              src={restaurant.heroImageUrl}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}
        
        <div className="theme-hero-content relative z-10">
          {restaurant.logoUrl && (
            <img src={restaurant.logoUrl} alt={restaurant.name} className="theme-hero-logo" />
          )}
          <h1 className="theme-hero-title">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="theme-hero-description">{restaurant.description}</p>
          )}
          
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Button size="lg" onClick={() => navigate(`/${slug}/menu`)} className="bg-accent hover:bg-accent-hover">
              Voir le menu complet
            </Button>
            {restaurant.featuresEnabled?.reservations && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setIsReservationOpen(true)}
              >
                <CalendarDays className="mr-2 h-5 w-5" />
                Réserver une table
              </Button>
            )}
          </div>

          {/* Language Selector */}
          <div className="mt-6">
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
            />
          </div>
        </div>
      </section>

      {/* Plats Signatures */}
      {signatureDishes.length > 0 && (
        <section className="theme-section">
          <h2 className="theme-section-title">Nos Spécialités</h2>
          
          <div className="theme-dishes-grid">
            {signatureDishes.map((dish) => (
              <div key={dish.id} className="theme-dish-card">
                {dish.imageUrl && (
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="theme-dish-image"
                  />
                )}
                <div className="theme-dish-content">
                  <div className="theme-dish-header">
                    <h3 className="theme-dish-name">{dish.name}</h3>
                    <span className="theme-dish-price">{Number(dish.price).toFixed(2)}€</span>
                  </div>
                  {dish.description && (
                    <p className="theme-dish-description">{dish.description}</p>
                  )}
                  <div className="theme-dish-badges">
                    {dish.isVegetarian && <span className="theme-badge">🌱 Végétarien</span>}
                    {dish.isVegan && <span className="theme-badge">🌿 Vegan</span>}
                    {dish.isGlutenFree && <span className="theme-badge">🌾 Sans gluten</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate(`/${slug}/menu`)}>
              Voir le menu complet
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      )}

      {/* Événements */}
      {restaurant.featuresEnabled?.events && events && events.length > 0 && (
        <section className="theme-section" style={{ background: 'var(--theme-bg-secondary)' }}>
          <h2 className="theme-section-title">Événements à venir</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {events.map((event) => {
              const eventDate = new Date(event.eventDate);
              const availableSpots = event.maxAttendees - event.currentAttendees;
              const isFull = availableSpots <= 0;

              return (
                <Card key={event.id} className="overflow-hidden">
                  {event.imageUrl && (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardContent className="p-6">
                    <h4 className="text-xl font-semibold mb-2">{event.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {eventDate.toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{eventDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {availableSpots} place{availableSpots > 1 ? "s" : ""} disponible{availableSpots > 1 ? "s" : ""}
                          </span>
                        </div>
                        {parseFloat(event.price) > 0 && (
                          <Badge variant="secondary">{event.price}€</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsEventRegistrationOpen(true);
                      }}
                      disabled={isFull}
                    >
                      {isFull ? "Complet" : "S'inscrire"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Galerie Photos (PREMIUM) */}
      {galleryPhotos && galleryPhotos.length > 0 && (
        <section className="theme-section">
          <h2 className="theme-section-title">Notre univers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {galleryPhotos.map((photo) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-lg aspect-square">
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || "Photo du restaurant"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {photo.caption && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <p className="text-white p-4 text-sm">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Informations Pratiques */}
      <section className="theme-section" style={{ background: 'var(--theme-bg-secondary)' }}>
        <h2 className="theme-section-title">Nous trouver</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Horaires d'ouverture */}
          {openingHours && openingHours.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horaires d'ouverture
                </h4>
                <div className="space-y-2">
                  {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map((day, index) => {
                    const dayHours = openingHours.find((h) => h.dayOfWeek === index);
                    return (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-medium">{day}</span>
                        {dayHours?.isClosed ? (
                          <span className="text-muted-foreground">Fermé</span>
                        ) : dayHours?.openTime && dayHours?.closeTime ? (
                          <span className="text-muted-foreground">
                            {dayHours.openTime} - {dayHours.closeTime}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Non défini</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

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
        </div>
      </section>

      {/* Footer */}
      <footer className="theme-footer">
        <div className="theme-footer-branding">
          <a href="https://pronto.page" target="_blank" rel="noopener noreferrer" className="theme-footer-pronto">
            Propulsé par <strong>PRONTO</strong>
          </a>
          <div className="theme-footer-altmachine">
            Une application de <img src="/altmachine-logo.png" alt="AltMachine" />
          </div>
        </div>
      </footer>

      {/* Bouton WhatsApp flottant */}
      {restaurant.whatsapp && (
        <a
          href={`https://wa.me/${restaurant.whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="theme-whatsapp-btn"
          aria-label="Contacter sur WhatsApp"
        >
          <Phone className="h-6 w-6 text-white" />
        </a>
      )}

      {/* Bouton Chatbot flottant */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="theme-chatbot-btn"
        aria-label="Ouvrir le chatbot"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </button>

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

      {/* Reservation Dialog */}
      <Dialog open={isReservationOpen} onOpenChange={setIsReservationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Réserver une table</DialogTitle>
          </DialogHeader>
          <ReservationFlow 
            restaurantId={restaurant.id} 
            restaurantName={restaurant.name}
            onClose={() => setIsReservationOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Event Registration Dialog */}
      <Dialog open={isEventRegistrationOpen} onOpenChange={setIsEventRegistrationOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inscription à l'événement</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <EventRegistrationFlow 
              event={selectedEvent}
              restaurantId={restaurant.id} 
              restaurantName={restaurant.name}
              onClose={() => setIsEventRegistrationOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Advertisement Banner (MENU tier only) */}
      {restaurant.subscriptionTier === "menu" && restaurant.showAds && advertisements && advertisements.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200/60 backdrop-blur-sm shadow-2xl z-[9999]">
          <div className="container max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2 text-xs font-medium tracking-wide flex-shrink-0" style={{ fontFamily: 'Montserrat, sans-serif', color: '#B8860B' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                PARTENAIRE
              </div>
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 items-center justify-center">
                  {advertisements.map((ad) => (
                    <a
                      key={ad.id}
                      href={ad.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 px-6 py-3 rounded-xl bg-white/80 hover:bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex-shrink-0 hover:scale-105"
                    >
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="h-20 w-20 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                      />
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>{ad.title}</span>
                        <span className="text-xs text-slate-500 group-hover:text-pronto-primary transition-colors flex items-center gap-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Découvrir
                          <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              <div className="w-20 flex-shrink-0"></div>
            </div>
          </div>
        </div>
      )}
    </ThemeWrapper>
  );
}
