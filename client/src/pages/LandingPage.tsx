import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, MessageSquare, Palette, Smartphone, Zap, Star, ArrowRight } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/pronto-logo.png" alt="PRONTO" className="h-8" />
            <span className="text-2xl font-display font-bold text-pronto-primary">PRONTO</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#fonctionnalites" className="text-sm hover:text-pronto-primary transition-colors">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-sm hover:text-pronto-primary transition-colors">
              Tarifs
            </a>
            <a href="#temoignages" className="text-sm hover:text-pronto-primary transition-colors">
              Témoignages
            </a>
            <Button variant="outline" size="sm" onClick={() => window.location.href = getLoginUrl()}>
              Connexion
            </Button>
            <Button size="sm" className="bg-pronto-primary hover:bg-pronto-primary/90">
              Essai gratuit
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-pronto-beige/20 to-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="text-pronto-primary border-pronto-primary">
                ✨ Nouveau : Chatbot IA RISE AI™ intégré
              </Badge>
              <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight">
                Votre restaurant,
                <br />
                <span className="text-pronto-primary">en ligne en 5 minutes</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Créez une page web élégante pour votre restaurant avec menu interactif et chatbot IA. 
                Aucune compétence technique requise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-pronto-primary hover:bg-pronto-primary/90 text-lg">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg">
                  Voir une démo
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                ✓ Essai gratuit 14 jours • ✓ Sans carte bancaire • ✓ Support 7j/7
              </p>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-pronto-primary/20 to-pronto-accent/20 rounded-2xl border-4 border-white shadow-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop" 
                  alt="Restaurant moderne" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20 bg-card/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">
              Tout ce dont votre restaurant a besoin
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une solution complète pour présenter votre établissement et interagir avec vos clients
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-pronto-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-pronto-primary/10 flex items-center justify-center mb-4">
                  <Palette className="h-6 w-6 text-pronto-primary" />
                </div>
                <CardTitle>Personnalisation totale</CardTitle>
                <CardDescription>
                  Choisissez vos couleurs, polices et style pour refléter l'identité de votre restaurant
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-pronto-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-pronto-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-pronto-primary" />
                </div>
                <CardTitle>Chatbot IA RISE AI™</CardTitle>
                <CardDescription>
                  Répondez automatiquement aux questions de vos clients 24/7 avec notre IA avancée
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-pronto-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-pronto-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-pronto-primary" />
                </div>
                <CardTitle>100% Responsive</CardTitle>
                <CardDescription>
                  Votre site s'adapte parfaitement à tous les écrans : mobile, tablette et ordinateur
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-pronto-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-pronto-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-pronto-primary" />
                </div>
                <CardTitle>Menu interactif</CardTitle>
                <CardDescription>
                  Présentez vos plats avec photos, descriptions, allergènes et informations nutritionnelles
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-pronto-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-pronto-primary/10 flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-pronto-primary" />
                </div>
                <CardTitle>Mise à jour facile</CardTitle>
                <CardDescription>
                  Modifiez votre menu et vos informations en quelques clics depuis votre dashboard
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-pronto-primary transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-pronto-primary/10 flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-pronto-primary" />
                </div>
                <CardTitle>Statistiques détaillées</CardTitle>
                <CardDescription>
                  Suivez les visites, les conversations IA et l'engagement de vos clients
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">
              Des tarifs simples et transparents
            </h2>
            <p className="text-xl text-muted-foreground">
              Choisissez la formule adaptée à vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Basic</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">19€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-pronto-primary mt-0.5 flex-shrink-0" />
                    <span>Page web personnalisée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-pronto-primary mt-0.5 flex-shrink-0" />
                    <span>Menu interactif illimité</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-pronto-primary mt-0.5 flex-shrink-0" />
                    <span>Chatbot IA RISE AI™</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-pronto-primary mt-0.5 flex-shrink-0" />
                    <span>Statistiques de base</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-sm">⚠️ Publicité PRONTO affichée</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  Commencer
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-4 border-pronto-primary hover:shadow-xl transition-shadow relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-pronto-primary text-white">Recommandé</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Premium</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">29€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-pronto-primary mt-0.5 flex-shrink-0" />
                    <span>Tout du plan Basic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-pronto-primary mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">Sans publicité</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-pronto-primary mt-0.5 flex-shrink-0" />
                    <span>Statistiques avancées</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-pronto-primary mt-0.5 flex-shrink-0" />
                    <span>Support prioritaire</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-pronto-primary mt-0.5 flex-shrink-0" />
                    <span>Nom de domaine personnalisé</span>
                  </li>
                </ul>
                <Button className="w-full bg-pronto-primary hover:bg-pronto-primary/90">
                  Commencer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="temoignages" className="py-20 bg-card/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-muted-foreground">
              Découvrez ce que nos clients disent de PRONTO
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "PRONTO a transformé notre présence en ligne. Le chatbot IA répond à nos clients même quand nous sommes fermés !"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-pronto-primary/20 flex items-center justify-center">
                    <span className="font-semibold text-pronto-primary">HN</span>
                  </div>
                  <div>
                    <p className="font-semibold">Hôtel des Nacres</p>
                    <p className="text-sm text-muted-foreground">Restaurant gastronomique</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Mise en place ultra-rapide et interface intuitive. Nos clients adorent le menu interactif avec les allergènes !"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-pronto-primary/20 flex items-center justify-center">
                    <span className="font-semibold text-pronto-primary">BV</span>
                  </div>
                  <div>
                    <p className="font-semibold">Bella Vista</p>
                    <p className="text-sm text-muted-foreground">Pizzeria italienne</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Le meilleur investissement pour notre restaurant. Les statistiques nous aident à comprendre nos clients."
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-pronto-primary/20 flex items-center justify-center">
                    <span className="font-semibold text-pronto-primary">LV</span>
                  </div>
                  <div>
                    <p className="font-semibold">La Voile Rouge</p>
                    <p className="text-sm text-muted-foreground">Restaurant de plage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-pronto-primary to-pronto-accent text-white">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Prêt à transformer votre restaurant ?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Rejoignez des centaines de restaurants qui ont choisi PRONTO pour leur présence en ligne
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg">
              Essayer gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg bg-transparent border-white text-white hover:bg-white hover:text-pronto-primary">
              Contacter l'équipe
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card/50">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/pronto-logo.png" alt="PRONTO" className="h-6" />
                <span className="text-xl font-display font-bold text-pronto-primary">PRONTO</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La solution web pour restaurants modernes
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-pronto-primary">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-pronto-primary">Tarifs</a></li>
                <li><a href="#" className="hover:text-pronto-primary">Exemples</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-pronto-primary">Documentation</a></li>
                <li><a href="#" className="hover:text-pronto-primary">Contact</a></li>
                <li><a href="#" className="hover:text-pronto-primary">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Légal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-pronto-primary">CGU</a></li>
                <li><a href="#" className="hover:text-pronto-primary">Confidentialité</a></li>
                <li><a href="#" className="hover:text-pronto-primary">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2026 PRONTO. Tous droits réservés.</p>
            <p>
              Créé avec 🤍 par{" "}
              <a href="https://agencerise.fr" target="_blank" rel="noopener noreferrer" className="text-pronto-primary hover:underline">
                l'Agence Rise
              </a>
              {" "}• By ALTMachine
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
