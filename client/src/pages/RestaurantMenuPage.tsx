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
import { AdvertisementDisplay, DishItemAd } from "@/components/AdvertisementDisplay";

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

  // Get active advertisements (only for MENU tier)
  const { data: advertisements } = trpc.public.getActiveAdvertisements.useQuery(
    undefined,
    { enabled: restaurant?.subscriptionTier === "menu" && restaurant?.showAds }
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

  // Séparer les publicités dish_item des autres formats
  const dishItemAds = advertisements?.filter((ad: any) => ad.format === "dish_item") || [];
  const otherFormatAds = advertisements?.filter((ad: any) => ad.format !== "dish_item") || [];

  return (
    <div className="min-h-screen bg-background relative">
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

      {/* Hero section avec image de fond */}
      <section className="relative z-10 py-16 md:py-24 overflow-hidden">
        {/* Image de fond avec blur */}
        {restaurant.heroImageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${restaurant.heroImageUrl})`,
              filter: 'blur(8px)',
              transform: 'scale(1.1)' // Pour éviter les bords blancs du blur
            }}
          />
        )}
        
        {/* Overlay sombre pour lisibilité */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Contenu */}
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">Notre Menu</h2>
            <p className="text-lg text-white/90 drop-shadow-md">{restaurant.description}</p>
          </div>
        </div>
      </section>

      {/* Filtres */}
      <section className="relative z-10 py-6 border-b">
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
      <section className="relative z-10 py-12">
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
                      <>
                        {categoryItems.map((item, index) => (
                          <>
                            {/* Insérer un dish_item ad tous les 4 plats si disponible */}
                            {index > 0 && index % 4 === 0 && dishItemAds[Math.floor(index / 4) - 1] && (
                              <DishItemAd key={`ad-${dishItemAds[Math.floor(index / 4) - 1].id}`} advertisement={dishItemAds[Math.floor(index / 4) - 1]} />
                            )}
                            {/* Plat normal */}
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
                          </>
                        ))}
                        
                        {/* Ajouter les dish_item ads restants à la fin de chaque catégorie */}
                        {dishItemAds.slice(Math.floor(categoryItems.length / 4)).map((ad: any) => (
                          <DishItemAd key={`ad-${ad.id}`} advertisement={ad} />
                        ))}
                      </>
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
      <footer className="relative z-10 border-t py-8 mt-12 bg-background">
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

      {/* Advertisements - MENU tier only (tous formats sauf dish_item) */}
      {restaurant.subscriptionTier === "menu" && restaurant.showAds && otherFormatAds && otherFormatAds.length > 0 && (
        <AdvertisementDisplay advertisements={otherFormatAds} currentPage="menu" />
      )}


    </div>
  );
}
