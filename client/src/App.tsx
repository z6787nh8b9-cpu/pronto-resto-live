import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useTenant } from "./hooks/useTenant";
import SuperAdmin from "./pages/SuperAdmin";
import AdminManageRestaurant from "./pages/AdminManageRestaurant";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import PublicRestaurantPage from "./pages/PublicRestaurantPage";
import PreviewPublicPage from "./pages/PreviewPublicPage";
import LandingPage from "./pages/LandingPage";

function Router() {
  const tenant = useTenant();

  // Admin subdomain - show Super Admin dashboard
  if (tenant.isAdmin) {
    return (
      <Switch>
        <Route path="/" component={SuperAdmin} />
        <Route path="/admin/manage/:id" component={AdminManageRestaurant} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Restaurant subdomain
  if (tenant.isRestaurant) {
    // Dashboard route
    if (tenant.isDashboard) {
      return (
        <Switch>
          <Route path="/dashboard" component={RestaurantDashboard} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      );
    }

    // Public page
    return (
      <Switch>
          <Route path="/" component={PublicRestaurantPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Default fallback - Landing page with preview routes
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/admin" component={SuperAdmin} />
      <Route path="/admin/manage/:id" component={AdminManageRestaurant} />
      <Route path="/preview/:slug" component={PreviewPublicPage} />
      <Route path="/preview/:slug/dashboard" component={RestaurantDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
