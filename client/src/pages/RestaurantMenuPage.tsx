import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Phone, X, Send, Leaf, WheatOff } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import ReactMarkdown from "react-markdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";

export default function RestaurantMenuPage() {
  const params: { slug?: string } = useParams();
  const [, navigate] = useLocation();
  const slug = params.slug || "";
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [sessionId] = useState(() => nanoid());
  const [filters, setFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
  });

  // Get restaurant data
  const { data: restaurant, isLoading } = trpc.public.getRestaurant.useQuery(
    { slug },
    { enabled: !!slug }
  );

  // Translation hook
  const { currentLanguage, setCurrentLanguage, translate } = useTranslation(restaurant?.id);

  // Get menu data
  const { data: menuData } = trpc.public.getMenu.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id }
  );

  // Get active advertisements
  const { data: advertisements } = trpc.public.getActiveAdvertisements.useQuery();

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

  const categories = menuData?.categories || [];
  const allItems = menuData?.items || [];
  
  // Apply filters
  const items = allItems.filter((item) => {
    if (filters.vegetarian && !item.isVegetarian) return false;
    if (filters.vegan && !item.isVegan) return false;
    if (filters.glutenFree && !item.isGlutenFree) return false;
    return true;
  });
  
  const toggleFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const primaryColor = restaurant.primaryColor || "#ef4444";
  const accentColor = restaurant.accentColor || "#fbbf24";

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
          
          <div className="flex items-center gap-2">
            {/* Sélecteur de langue si PRO ou PREMIUM */}
            {(restaurant.subscriptionTier === "pro" || restaurant.subscriptionTier === "premium") && (
              <LanguageSelector
                currentLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
              />
            )}
            
            {/* Bouton retour à l'accueil si PREMIUM */}
            {restaurant.subscriptionTier === "premium" && (
              <Button variant="ghost" onClick={() => navigate(`/${slug}`)}>
                Accueil
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero section minimaliste */}
      <section className="relative py-12 md:py-16" style={{ backgroundColor: `${primaryColor}15` }}>
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Notre Menu</h2>
            <p className="text-lg text-muted-foreground">{restaurant.description}</p>
          </div>
        </div>
      </section>

      {/* Filtres */}
      <section className="py-6 border-b">
        <div className="container">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={filters.vegetarian ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter("vegetarian")}
              className="gap-2"
            >
              <Leaf className="h-4 w-4" />
              Végétarien
            </Button>
            <Button
              variant={filters.vegan ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter("vegan")}
              className="gap-2"
            >
              <Leaf className="h-4 w-4" />
              Vegan
            </Button>
            <Button
              variant={filters.glutenFree ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter("glutenFree")}
              className="gap-2"
            >
              <WheatOff className="h-4 w-4" />
              Sans gluten
            </Button>
          </div>
        </div>
      </section>

      {/* Menu avec tabs horizontales */}
      <section className="py-12">
        <div className="container max-w-5xl">
          {categories.length > 0 ? (
            <Tabs defaultValue={categories[0]?.id.toString()} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-8">
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id.toString()} className="whitespace-nowrap">
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => {
                const categoryItems = items.filter((item) => item.categoryId === category.id);
                return (
                  <TabsContent key={category.id} value={category.id.toString()} className="space-y-4">
                    {categoryItems.length > 0 ? (
                      categoryItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-3 mb-2">
                                  <h3 className="text-lg font-semibold">{item.name}</h3>
                                  <div className="flex gap-1">
                                    {item.isVegetarian && (
                                      <Badge variant="secondary" className="text-xs gap-1">
                                        <Leaf className="h-3 w-3" /> Végé
                                      </Badge>
                                    )}
                                    {item.isVegan && (
                                      <Badge variant="secondary" className="text-xs gap-1">
                                        <Leaf className="h-3 w-3" /> Vegan
                                      </Badge>
                                    )}
                                    {item.isGlutenFree && (
                                      <Badge variant="secondary" className="text-xs gap-1">
                                        <WheatOff className="h-3 w-3" /> Sans gluten
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                )}
                                {item.allergens && (
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Allergènes :</span> {item.allergens}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold" style={{ color: primaryColor }}>
                                  {Number(item.price).toFixed(2)}€
                                </p>
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="mt-2 w-24 h-24 object-cover rounded-md"
                                  />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Aucun plat dans cette catégorie</p>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucune catégorie disponible pour le moment</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
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
                      href={ad.linkUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 px-6 py-3 rounded-xl bg-white/80 hover:bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex-shrink-0 hover:scale-105"
                    >
                      {ad.imageUrl && (
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="h-20 w-20 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                        />
                      )}
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
    </div>
  );
}
