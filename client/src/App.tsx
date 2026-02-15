import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import SuperAdmin from "./pages/SuperAdmin";
import AdminManageRestaurant from "./pages/AdminManageRestaurant";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import PublicRestaurantPage from "./pages/PublicRestaurantPage";
import LandingPage from "./pages/LandingPage";
import RestaurantHomePage from "./pages/RestaurantHomePage";
import RestaurantMenuPage from "./pages/RestaurantMenuPage";

/**
 * PRONTO Router - Clean URL Structure
 * 
 * Routes:
 * /                              → Landing page
 * /admin                         → Super Admin Dashboard
 * /admin/restaurants/:id         → Admin: Manage specific restaurant
 * /:slug                         → Restaurant home page (PREMIUM only, redirects to /menu otherwise)
 * /:slug/menu                    → Restaurant menu (all tiers)
 * /:slug/dashboard               → Restaurant owner dashboard
 */
function Router() {
  return (
    <Switch>
      {/* Landing page */}
      <Route path="/" component={LandingPage} />
      
      {/* Super Admin routes */}
      <Route path="/admin" component={SuperAdmin} />
      <Route path="/admin/restaurants/:id" component={AdminManageRestaurant} />
      
      {/* Restaurant dashboard - must come before public page to avoid conflict */}
      <Route path="/:slug/dashboard" component={RestaurantDashboard} />
      
      {/* Restaurant menu page (all tiers) */}
      <Route path="/:slug/menu" component={RestaurantMenuPage} />
      
      {/* Restaurant home page (PREMIUM only, auto-redirects to /menu for MENU/PRO) */}
      <Route path="/:slug" component={RestaurantHomePage} />
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
