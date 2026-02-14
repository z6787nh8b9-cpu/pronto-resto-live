import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Phone, Calendar, MapPin, Mail, X, Send } from "lucide-react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import ReactMarkdown from "react-markdown";

export default function PreviewPublicPage() {
  const params: { slug?: string } = useParams();
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
  const { data: restaurant } = trpc.public.getRestaurant.useQuery(
    { slug },
    { enabled: !!slug }
  );

  // Get menu data
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

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Chargement...</p>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative h-[70vh] bg-cover bg-center"
        style={{
          backgroundColor: restaurant.primaryColor || "#7D3A31",
          backgroundImage: restaurant.heroImageUrl ? `url(${restaurant.heroImageUrl})` : undefined,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        <div className="relative h-full container flex flex-col justify-center items-center text-center text-white px-4">
          {restaurant.logoUrl && (
            <div className="mb-8 animate-in fade-in duration-700">
              <img src={restaurant.logoUrl} alt={restaurant.name} className="h-28 md:h-32 object-contain drop-shadow-2xl" />
            </div>
          )}
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight animate-in slide-in-from-bottom-4 duration-700 delay-150">
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className="text-xl md:text-2xl max-w-3xl leading-relaxed font-light animate-in slide-in-from-bottom-4 duration-700 delay-300">
              {restaurant.description}
            </p>
          )}
        </div>
      </section>

      {/* Contact Bar */}
      <section className="bg-pronto-beige/20 border-b border-pronto-beige/40 shadow-sm">
        <div className="container py-6">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            {restaurant.address && (
              <div className="flex items-center gap-2.5 group">
                <MapPin className="h-5 w-5 text-pronto-primary group-hover:scale-110 transition-transform" />
                <span className="font-medium">{restaurant.address}</span>
              </div>
            )}
            {restaurant.phone && (
              <div className="flex items-center gap-2.5 group">
                <Phone className="h-5 w-5 text-pronto-primary group-hover:scale-110 transition-transform" />
                <a href={`tel:${restaurant.phone}`} className="hover:text-pronto-primary transition-colors font-medium">
                  {restaurant.phone}
                </a>
              </div>
            )}
            {restaurant.email && (
              <div className="flex items-center gap-2.5 group">
                <Mail className="h-5 w-5 text-pronto-primary group-hover:scale-110 transition-transform" />
                <a href={`mailto:${restaurant.email}`} className="hover:text-pronto-primary transition-colors font-medium">
                  {restaurant.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-display font-bold mb-4 text-pronto-primary">Notre Carte</h2>
          <div className="w-24 h-1 bg-pronto-accent mx-auto mb-4 rounded-full"></div>
          <p className="text-lg text-muted-foreground">Découvrez nos spécialités culinaires</p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-3 mb-10 flex-wrap">
          <Button
            variant={filters.vegetarian ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter("vegetarian")}
            className="gap-2 transition-all duration-200 hover:scale-105"
          >
            🌱 Végétarien
          </Button>
          <Button
            variant={filters.vegan ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter("vegan")}
            className="gap-2 transition-all duration-200 hover:scale-105"
          >
            🌿 Vegan
          </Button>
          <Button
            variant={filters.glutenFree ? "default" : "outline"}
            size="sm"
            onClick={() => toggleFilter("glutenFree")}
            className="gap-2 transition-all duration-200 hover:scale-105"
          >
            🌾 Sans gluten
          </Button>
          {(filters.vegetarian || filters.vegan || filters.glutenFree) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ vegetarian: false, vegan: false, glutenFree: false })}
              className="text-pronto-primary hover:text-pronto-primary/80"
            >
              ✖️ Réinitialiser
            </Button>
          )}
        </div>

        <Tabs defaultValue={categories[0]?.id.toString()} className="w-full max-w-7xl mx-auto">
          {/* Catégories redesignées - centrées et responsive */}
          <div className="w-full mb-10">
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 h-auto bg-transparent p-0">
              {categories.map((category) => {
                // Utiliser l'emoji de la base de données
                const icon = category.emoji || '🍴';
                
                // Afficher image (Premium) ou emoji (Basique)
                const isPremium = restaurant.subscriptionPlan === 'premium';
                const hasImage = isPremium && category.imageUrl;
                
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id.toString()}
                    className="h-auto py-6 px-4 flex flex-col items-center gap-3 bg-white border-2 border-pronto-beige/40 rounded-2xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 data-[state=active]:border-pronto-primary data-[state=active]:bg-pronto-primary/5 data-[state=active]:shadow-xl"
                  >
                    {hasImage ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                        <img 
                          src={category.imageUrl!} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                          style={{ display: 'block' }}
                        />
                      </div>
                    ) : (
                      <span className="text-4xl">{icon}</span>
                    )}
                    <span className="text-base font-bold text-center leading-tight">{category.name}</span>
                    {category.description && (
                      <span className="text-xs text-muted-foreground text-center line-clamp-2">{category.description}</span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id.toString()} className="mt-0">
              {category.description && (
                <div className="text-center mb-8">
                  <p className="text-lg text-muted-foreground italic max-w-2xl mx-auto">{category.description}</p>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items
                  .filter((item) => item.categoryId === category.id)
                  .map((item, index) => {
                    // Rotation des images placeholder
                    const placeholderImages = [
                      '/images/dishes/W5gXnLrRdPLc.jpg',
                      '/images/dishes/ogJuaBJP0oQ9.jpg',
                      '/images/dishes/GvHlZUdia5A7.jpg',
                      '/images/dishes/D7GUkqsqHopc.jpg',
                      '/images/dishes/7kjczpWYlPF6.jpg',
                      '/images/dishes/WoaxiacELVR3.jpg',
                    ];
                    const imageUrl = item.imageUrl || placeholderImages[index % placeholderImages.length];
                    
                    return (
                    <Card key={item.id} className={`overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 ${item.isFeatured ? 'border-yellow-400 ring-2 ring-yellow-400/30' : 'border-pronto-beige/20'}`}>
                      {/* Image du plat - correction de la bande blanche */}
                      <div className="relative h-56 bg-gray-100">
                        <img 
                          src={imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          style={{ display: 'block' }}
                        />
                        {/* Badge favori */}
                        {item.isFeatured && (
                          <div className="absolute top-3 left-3 bg-yellow-400 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-1">
                            ⭐ Favori
                          </div>
                        )}
                        {/* Prix en overlay */}
                        <div className="absolute top-3 right-3 bg-pronto-primary text-white px-3 py-1.5 rounded-full font-bold text-lg shadow-lg">
                          {item.price}€
                        </div>
                      </div>
                      
                      <CardContent className="p-5">
                        <div className="mb-3">
                          <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{item.description}</p>
                        )}

                        {/* Ingredients */}
                        {item.ingredients && (
                          <div className="mb-4 pb-4 border-b border-pronto-beige/30">
                            <p className="text-xs font-semibold text-pronto-primary mb-1.5">🌿 Ingrédients</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.ingredients}</p>
                          </div>
                        )}

                        {/* Dietary Options */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.isVegetarian && (
                            <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                              🌱 Végétarien
                            </Badge>
                          )}
                          {item.isVegan && (
                            <Badge variant="outline" className="text-xs bg-green-100 border-green-300 text-green-800">
                              🌿 Vegan
                            </Badge>
                          )}
                          {item.isGlutenFree && (
                            <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700">
                              🌾 Sans gluten
                            </Badge>
                          )}
                        </div>

                        {/* Allergens */}
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
                            <p className="text-xs font-semibold text-red-700 mb-2">⚠️ Allergènes présents</p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.allergens.map((allergen: string) => (
                                <Badge key={allergen} className="text-xs bg-red-100 text-red-800 border-red-200">
                                  {allergen}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Nutritional Info */}
                        {item.nutritionalInfo && (
                          <div className="mt-4 pt-4 border-t border-pronto-beige/30">
                            <p className="text-xs font-semibold text-pronto-primary mb-3">📊 Valeurs nutritionnelles</p>
                            <div className="grid grid-cols-4 gap-3 text-xs">
                              {item.nutritionalInfo.calories && (
                                <div className="text-center bg-pronto-beige/20 rounded-lg p-2">
                                  <p className="font-bold text-base">{item.nutritionalInfo.calories}</p>
                                  <p className="text-muted-foreground text-[10px]">kcal</p>
                                </div>
                              )}
                              {item.nutritionalInfo.protein && (
                                <div className="text-center bg-pronto-beige/20 rounded-lg p-2">
                                  <p className="font-bold text-base">{item.nutritionalInfo.protein}g</p>
                                  <p className="text-muted-foreground text-[10px]">Protéines</p>
                                </div>
                              )}
                              {item.nutritionalInfo.carbs && (
                                <div className="text-center bg-pronto-beige/20 rounded-lg p-2">
                                  <p className="font-bold text-base">{item.nutritionalInfo.carbs}g</p>
                                  <p className="text-muted-foreground text-[10px]">Glucides</p>
                                </div>
                              )}
                              {item.nutritionalInfo.fat && (
                                <div className="text-center bg-pronto-beige/20 rounded-lg p-2">
                                  <p className="font-bold text-base">{item.nutritionalInfo.fat}g</p>
                                  <p className="text-muted-foreground text-[10px]">Lipides</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )})}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Cet établissement utilise{" "}
            <a
              href="https://agencerise.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-pronto-primary hover:underline"
            >
              RISE AI™
            </a>
          </p>
          <p className="text-xs text-muted-foreground">Propulsé par RISE IA via Gemini 2.0 Flash</p>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        {/* WhatsApp Button */}
        {restaurant.whatsapp && (
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg"
            style={{ backgroundColor: "#25D366" }}
            onClick={() => window.open(`https://wa.me/${restaurant.whatsapp}`, "_blank")}
          >
            <Phone className="h-6 w-6 text-white" />
          </Button>
        )}

        {/* Reservation Button */}
        {restaurant.reservationUrl && (
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={() => window.open(restaurant.reservationUrl!, "_blank")}
          >
            <Calendar className="h-6 w-6" />
          </Button>
        )}

        {/* Chatbot Button */}
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          style={{ backgroundColor: restaurant.accentColor || "#FF9999" }}
          onClick={() => setIsChatOpen(true)}
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Chatbot Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>RISE AI™</DialogTitle>
                <p className="text-sm text-muted-foreground">Assistant virtuel</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsChatOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Bonjour ! Comment puis-je vous aider aujourd'hui ?</p>
              </div>
            )}

            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#C8956B] text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-sm">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground">En train d'écrire...</p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Posez votre question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={chatMutation.isPending}
                className="select-text"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' } as React.CSSProperties}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || chatMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Basic Plan Ad Banner */}
      {restaurant.subscriptionPlan === "basic" && (
        <div className="fixed top-0 left-0 right-0 bg-pronto-accent text-white text-center py-2 text-sm z-50">
          🎉 Passez à Premium pour retirer cette publicité et débloquer plus de fonctionnalités !
        </div>
      )}
    </div>
  );
}
