import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function AdminMagicLogin() {
  const [, setLocation] = useLocation();
  const loginMutation = trpc.adminAuth.loginWithEmail.useMutation();

  useEffect(() => {
    // Get email from URL query params
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");

    if (!email) {
      setLocation("/admin/login");
      return;
    }

    // Attempt automatic login
    loginMutation.mutate(
      { email },
      {
        onSuccess: () => {
          // Redirect to admin panel
          window.location.href = "/admin";
        },
        onError: (error) => {
          console.error("Magic login failed:", error);
          // Redirect to login page on error
          setLocation("/admin/login");
        },
      }
    );
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connexion en cours...
        </h2>
        <p className="text-gray-600">
          Vous allez être redirigé vers le panel administrateur
        </p>
      </div>
    </div>
  );
}
