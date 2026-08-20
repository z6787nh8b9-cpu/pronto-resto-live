import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const NotFound = lazy(() => import("@/pages/NotFound"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const AdminManageRestaurant = lazy(() => import("./pages/AdminManageRestaurant"));
const RestaurantDashboard = lazy(() => import("./pages/RestaurantDashboard"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const RestaurantHomePage = lazy(() => import("./pages/RestaurantHomePage"));
const RestaurantMenuPage = lazy(() => import("./pages/RestaurantMenuPage"));
const RestaurantEventsPage = lazy(() => import("./pages/RestaurantEventsPage"));
const BusinessPublicPage = lazy(() => import("./pages/BusinessPublicPage"));
const RestaurantLogin = lazy(() => import("./pages/RestaurantLogin"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const AdminInvite = lazy(() => import("./pages/AdminInvite"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminMagicLogin = lazy(() => import("./pages/AdminMagicLogin"));

function RouteLoading() {
  return (
    <main className="min-h-[100dvh] bg-[#fbf8f3] px-6 py-10 text-[#301d15]" role="status" aria-live="polite">
      <p className="mx-auto max-w-6xl text-sm font-medium">Chargement de votre espace PRONTO…</p>
    </main>
  );
}

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
    <Suspense fallback={<RouteLoading />}>
      <Switch>
      {/* Landing page */}
      <Route path="/" component={LandingPage} />
      
      {/* Restaurant owner login */}
      <Route path="/login-restaurant" component={RestaurantLogin} />

      {/* Password recovery confirmation */}
      <Route path="/reset-password" component={PasswordReset} />
      
      {/* Invitation acceptance */}
      <Route path="/invite/:token" component={InviteAccept} />
      
      {/* Admin invitation acceptance */}
      <Route path="/invite-admin/:token" component={AdminInvite} />
      
      {/* Admin login */}
      <Route path="/admin/login" component={AdminLogin} />
      
      {/* Admin magic login */}
      <Route path="/admin/magic-login" component={AdminMagicLogin} />
      
      {/* Super Admin routes */}
      <Route path="/admin/preview/:slug">{() => <BusinessPublicPage preview />}</Route>
      <Route path="/admin" component={SuperAdmin} />
      <Route path="/admin/restaurants/:id" component={AdminManageRestaurant} />
      
      {/* Restaurant dashboard - must come before public page to avoid conflict */}
      <Route path="/:slug/dashboard" component={RestaurantDashboard} />
      
      {/* Restaurant menu page (all tiers) */}
      <Route path="/b/:slug">{() => <BusinessPublicPage />}</Route>
      <Route path="/:slug/menu" component={RestaurantMenuPage} />
      <Route path="/:slug/events" component={RestaurantEventsPage} />
      
      {/* Restaurant home page (PREMIUM only, auto-redirects to /menu for MENU/PRO) */}
      <Route path="/:slug" component={RestaurantHomePage} />
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
