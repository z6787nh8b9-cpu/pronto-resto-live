import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="pronto-shell w-full max-w-xl p-1.5">
          <div className="flex flex-col items-center rounded-[calc(1.5rem-0.375rem)] bg-card p-8 text-center sm:p-12">
            <AlertTriangle
              size={44}
              className="mb-6 flex-shrink-0 text-pronto-primary"
            />

            <p className="pronto-eyebrow">Reprise sécurisée</p>
            <h2 className="mt-5 text-4xl">Cette page a besoin d’être relancée.</h2>

            <p className="mt-4 max-w-md leading-7 text-muted-foreground">Aucune donnée n’a été modifiée. Vous pouvez réessayer ou revenir à l’accueil pour reprendre votre parcours.</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => window.location.reload()} className={cn("flex items-center justify-center gap-2 rounded-full bg-pronto-primary px-5 py-3 text-primary-foreground transition-transform duration-500 hover:-translate-y-0.5 hover:bg-pronto-primary-deep active:scale-[0.98]")}>
              <RotateCcw size={16} />
              Réessayer
            </button>
            <a href="/" className="flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-secondary">Retour à l’accueil <ArrowRight size={16} /></a>
            </div>
          </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
