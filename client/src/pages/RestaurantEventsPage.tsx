import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { CalendarDays, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EventRegistrationFlow } from "@/components/EventRegistrationFlow";
import { PublicVitrineChrome } from "@/components/PublicVitrineChrome";
import { PublicAttribution } from "@/components/PublicAttribution";
import { ThemeWrapper, resolveStorefrontTheme } from "@/components/ThemeWrapper";
import { usePublicSeo } from "@/lib/public-seo";

function EventCard({ event, onRegister }: { event: any; onRegister: (event: any) => void }) {
  const availableSpots = Math.max(0, event.maxAttendees - event.currentAttendees);
  const isFull = availableSpots === 0;
  const price = Number(event.price || 0);

  return (
    <article className="group rounded-[2rem] bg-black/[0.05] p-1.5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
      <div className="h-full overflow-hidden rounded-[calc(2rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
        {event.imageUrl ? (
          <div className="aspect-[16/10] overflow-hidden">
            <img src={event.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.035]" />
          </div>
        ) : (
          <div className="aspect-[16/10] bg-[radial-gradient(circle_at_20%_0%,#dec6a9_0%,#684333_48%,#2b160c_100%)]" />
        )}
        <div className="p-6 sm:p-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8b5a3c]">
            {new Date(event.eventDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#2b160c]">{event.title}</h2>
          {event.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#6c5548]">{event.description}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#6c5548]">
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" aria-hidden="true" />{new Date(event.eventDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" aria-hidden="true" />{isFull ? "Complet" : `${availableSpots} place${availableSpots > 1 ? "s" : ""}`}</span>
          </div>
          <div className="mt-7 flex items-center justify-between gap-4">
            <p className="font-serif text-xl font-semibold text-[#2b160c]">{price > 0 ? `${price.toFixed(2)} ${event.currency || "EUR"}` : "Entrée libre"}</p>
            <Button onClick={() => onRegister(event)} disabled={isFull} className="group/button rounded-full bg-[#2b160c] px-5 py-5 text-sm text-[#fff8ea] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#553322] active:scale-[0.98]">
              {isFull ? "Complet" : "S’inscrire"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function RestaurantEventsPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { data: restaurant, isLoading } = trpc.public.getRestaurant.useQuery({ slug }, { enabled: Boolean(slug) });
  const { data: events = [] } = trpc.events.getPublicEvents.useQuery({ restaurantId: restaurant?.id || 0 }, { enabled: Boolean(restaurant?.id) });

  usePublicSeo({
    title: restaurant ? `Événements — ${restaurant.name}` : "Événements — PRONTO",
    description: restaurant ? `Découvrez les prochains événements de ${restaurant.name}.` : "Découvrez les prochains événements de cet établissement.",
    pathname: slug ? `/${slug}/events` : "/events",
    imageUrl: restaurant?.heroImageUrl || restaurant?.logoUrl,
  });

  if (isLoading) return <main className="min-h-[100dvh] bg-[#fbf8f3] px-6 py-24 text-[#2b160c]"><p className="mx-auto max-w-6xl text-sm font-medium">Chargement des événements…</p></main>;
  if (!restaurant) return <main className="min-h-[100dvh] bg-[#fbf8f3] px-6 py-24 text-[#2b160c]"><p className="mx-auto max-w-6xl text-sm font-medium">Cet établissement n’est pas disponible.</p></main>;

  const theme = resolveStorefrontTheme(restaurant.theme, restaurant.subscriptionTier);

  return (
    <ThemeWrapper theme={theme}>
      <PublicVitrineChrome name={restaurant.name} logoUrl={restaurant.logoUrl}>
        <div className="flex items-center gap-1.5"><button type="button" onClick={() => navigate(`/${slug}`)} className="h-10 rounded-[1rem] px-3 text-sm font-medium text-foreground transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.05] active:scale-[0.98]">Accueil</button><button type="button" onClick={() => navigate(`/${slug}/menu`)} className="h-10 rounded-[1rem] px-3 text-sm font-medium text-foreground transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.05] active:scale-[0.98]">Menu</button></div>
      </PublicVitrineChrome>
      <main className="min-h-[100dvh] bg-[#fbf8f3] px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
        <section className="mx-auto max-w-7xl">
          <div className="max-w-3xl py-10 sm:py-16">
            <p className="inline-flex rounded-full bg-[#2b160c]/[0.06] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#7a4a32]">Agenda de l’établissement</p>
            <h1 className="mt-5 font-serif text-5xl font-bold tracking-[-0.04em] text-[#2b160c] sm:text-7xl">Les prochains rendez-vous.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#6c5548] sm:text-lg">Retrouvez les expériences, rencontres et temps forts proposés par {restaurant.name}.</p>
          </div>
          {events.length > 0 ? <div className="grid grid-cols-1 gap-6 pb-10 md:grid-cols-2 xl:grid-cols-3">{events.map((event: any) => <EventCard key={event.id} event={event} onRegister={setSelectedEvent} />)}</div> : <div className="rounded-[2rem] bg-[#2b160c]/[0.05] p-1.5"><div className="rounded-[calc(2rem-0.375rem)] bg-white px-6 py-16 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]"><p className="font-serif text-3xl font-bold text-[#2b160c]">Aucun rendez-vous programmé.</p><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6c5548]">Revenez prochainement pour découvrir les prochains temps forts de l’établissement.</p><Button onClick={() => navigate(`/${slug}`)} className="mt-7 rounded-full bg-[#2b160c] px-6 text-[#fff8ea]">Retour à la vitrine</Button></div></div>}
        </section>
      </main>
      <footer className="border-t border-[#2b160c]/10 bg-[#fbf8f3] px-5 py-8 text-center text-[#2b160c]"><PublicAttribution /></footer>
      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[580px]"><DialogHeader><DialogTitle>Inscription à l’événement</DialogTitle></DialogHeader>{selectedEvent && <EventRegistrationFlow event={selectedEvent} restaurantId={restaurant.id} onClose={() => setSelectedEvent(null)} />}</DialogContent>
      </Dialog>
    </ThemeWrapper>
  );
}
