import { Fragment, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Phone, X, Send, Leaf, WheatOff, Search, Sparkles } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import ReactMarkdown from "react-markdown";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";
import { AdvertisementDisplay, DishItemAd } from "@/components/AdvertisementDisplay";
import { LoadingState } from "@/components/LoadingState";
import { PublicVitrineChrome } from "@/components/PublicVitrineChrome";

export default function RestaurantMenuPage() {
  const params: { slug?: string } = useParams();
  const [, navigate] = useLocation();
  const slug = params.slug || "";
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [heroImageFailed, setHeroImageFailed] = useState(false);
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

  useEffect(() => {
    setHeroImageFailed(false);
  }, [restaurant?.heroImageUrl]);

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
      <div className="min-h-screen bg-background"><LoadingState label="Ouverture de la vitrine" /></div>
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
  const hasDietaryMetadata = allItems.some((item) => item.isVegetarian || item.isVegan || item.isGlutenFree);
  
  // Apply filters
  const items = allItems.filter((item) => {
    if (filters.vegetarian && !item.isVegetarian) return false;
    if (filters.vegan && !item.isVegan) return false;
    if (filters.glutenFree && !item.isGlutenFree) return false;
    if (searchQuery.trim()) {
      const needle = searchQuery.trim().toLocaleLowerCase("fr-FR");
      const haystack = `${item.name} ${item.description || ""}`.toLocaleLowerCase("fr-FR");
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
  
  const toggleFilter = (filterName: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const primaryColor = restaurant.primaryColor || "#ef4444";
  const accentColor = restaurant.accentColor || "#fbbf24";
  const shouldShowHeroImage = Boolean(restaurant.heroImageUrl) && !heroImageFailed;

  // Séparer les publicités dish_item des autres formats
  const dishItemAds = advertisements?.filter((ad: any) => ad.format === "dish_item") || [];
  const otherFormatAds = advertisements?.filter((ad: any) => ad.format !== "dish_item") || [];
  
  // Détecter si une publicité fullpage est active
  const hasFullpageAd = advertisements?.some((ad: any) => ad.format === "fullpage") || false;

  return (
    <div className="min-h-[100dvh] bg-background relative">
      <PublicVitrineChrome name={restaurant.name} logoUrl={restaurant.logoUrl}>
        {(restaurant.subscriptionTier === "pro" || restaurant.subscriptionTier === "premium") && <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />}
        {restaurant.subscriptionTier === "premium" && <button type="button" onClick={() => navigate(`/${slug}`)} className="hidden h-10 rounded-[1rem] px-3 text-sm font-medium text-foreground transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.05] active:scale-[0.98] sm:inline-flex">Accueil</button>}
      </PublicVitrineChrome>

      {/* Hero de vitrine */}
      <section className="relative z-10 overflow-hidden pb-16 pt-32 md:pb-24 md:pt-40">
        {/* Image de fond avec blur */}
        {shouldShowHeroImage ? (
          <img src={restaurant.heroImageUrl!} alt="" aria-hidden="true" onError={() => setHeroImageFailed(true)} className="absolute inset-0 h-full w-full scale-110 object-cover blur-[8px]" />
        ) : <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,#7e4837_0%,#3e231c_46%,#160d0a_100%)]" />}
        
        <div className="absolute inset-0 bg-black/55" />
        
        {/* Contenu */}
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-white/85 backdrop-blur-sm"><Sparkles className="h-3.5 w-3.5" /> Vitrine PRONTO</span>
            <h2 className="mt-5 text-4xl text-white drop-shadow-lg md:text-5xl">Découvrez notre sélection</h2>
            {restaurant.description && <p className="mt-4 text-lg leading-8 text-white/90 drop-shadow-md">{restaurant.description}</p>}
          </div>
        </div>
      </section>

      {/* Recherche et filtres */}
      <section className={`relative z-10 py-6 border-b ${!hasFullpageAd ? 'bg-background' : ''}`}>
        <div className="container max-w-5xl">
          <div className="mx-auto max-w-xl">
            <div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher dans la sélection" className="h-12 rounded-2xl border-border/80 bg-card pl-11 shadow-sm" aria-label="Rechercher dans la sélection" /></div>
          </div>
          {hasDietaryMetadata && <div className="mt-4 flex flex-wrap justify-center gap-2">
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
          </div>}
        </div>
      </section>

      {/* Collections de la vitrine */}
      <section className={`relative z-10 py-12 ${!hasFullpageAd ? 'bg-background' : ''}`}>
        <div className="container max-w-5xl">
          {categories.length > 0 ? (
            <Tabs defaultValue={categories[0]?.id.toString()} className="w-full">
              <TabsList className="mb-8 flex w-full justify-start overflow-x-auto flex-nowrap rounded-2xl bg-secondary/70 p-1.5">
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id.toString()} className="whitespace-nowrap rounded-xl px-4 py-2.5">
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
                        {categoryItems.map((item, index) => {
                          const itemPrice = Number(item.price);
                          const hasPrice = Number.isFinite(itemPrice) && itemPrice > 0;
                          const allergens = Array.isArray(item.allergens) ? item.allergens.filter((allergen): allergen is string => typeof allergen === "string" && allergen.trim().length > 0) : [];
                          const hasAllergens = allergens.length > 0;
                          return (
                          <Fragment key={item.id}>
                            {/* Insérer un dish_item ad tous les 4 plats si disponible */}
                            {index > 0 && index % 4 === 0 && dishItemAds[Math.floor(index / 4) - 1] && (
                              <DishItemAd key={`ad-${dishItemAds[Math.floor(index / 4) - 1].id}`} advertisement={dishItemAds[Math.floor(index / 4) - 1]} />
                            )}
                            <Card className="overflow-hidden border-border/80 bg-card shadow-[0_1px_2px_oklch(0.22_0.025_53_/_0.05)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_oklch(0.22_0.025_53_/_0.09)]">
                          <CardContent className="p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start gap-3 mb-2">
                                  <h3 className="text-xl font-semibold tracking-[-0.02em]">{item.name}</h3>
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
                                  <p className="mb-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                                )}
                                {hasAllergens && (
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Allergènes :</span> {allergens.join(", ")}
                                  </p>
                                )}
                              </div>
                              <div className="shrink-0 text-right">
                                {hasPrice && <p className="text-xl font-bold" style={{ color: primaryColor }}>{itemPrice.toFixed(2)}€</p>}
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="mt-3 h-24 w-24 rounded-xl object-cover shadow-sm"
                                  />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                          </Fragment>
                          );
                        })}
                        
                        {/* Ajouter les dish_item ads restants à la fin de chaque catégorie */}
                        {dishItemAds.slice(Math.floor(categoryItems.length / 4)).map((ad: any) => (
                          <DishItemAd key={`ad-${ad.id}`} advertisement={ad} />
                        ))}
                      </>
                    ) : (
                      <p className="py-10 text-center text-muted-foreground">Aucun élément ne correspond à votre recherche dans cette collection.</p>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucune collection disponible pour le moment</p>
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
