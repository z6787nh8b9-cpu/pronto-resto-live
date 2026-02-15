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

/**
 * PRONTO Router - Clean URL Structure
 * 
 * Routes:
 * /                              → Landing page
 * /admin                         → Super Admin Dashboard
 * /admin/restaurants/:id         → Admin: Manage specific restaurant
 * /:slug                         → Public restaurant page
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
      
      {/* Public restaurant page */}
      <Route path="/:slug" component={PublicRestaurantPage} />
      
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
