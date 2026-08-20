import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon, Clock, Users, MapPin, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { executeRecaptcha } from "@/lib/recaptcha";

interface ReservationFlowProps {
  restaurantId: number;
  businessName: string;
  onClose?: () => void;
}

export function ReservationFlow({ restaurantId, businessName, onClose }: ReservationFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [selectedZone, setSelectedZone] = useState<string | undefined>(undefined);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const { data: zones } = trpc.reservations.getPublicZones.useQuery({ restaurantId });
  const { data: settings } = trpc.reservations.getPublicSettings.useQuery({ restaurantId });
  const { data: availableSlots } = trpc.reservations.getAvailableSlots.useQuery(
    {
      restaurantId,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
      partySize: parseInt(partySize),
    },
    { enabled: !!selectedDate }
  );

  const createReservation = trpc.reservations.create.useMutation({
    onSuccess: () => {
      toast.success("Réservation confirmée ! Vous recevrez un email de confirmation.");
      setStep(7); // Success step
    },
    onError: () => {
      toast.error("Erreur lors de la réservation. Veuillez réessayer.");
    },
  });

  const handleNext = () => {
    if (step === 1 && !selectedDate) {
      toast.error("Veuillez sélectionner une date");
      return;
    }
    if (step === 2 && !selectedTime) {
      toast.error("Veuillez sélectionner une heure");
      return;
    }
    if (step === 3 && !partySize) {
      toast.error("Veuillez indiquer le nombre de personnes");
      return;
    }
    if (step === 5 && (!customerName || !customerEmail || !customerPhone)) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Informations manquantes");
      return;
    }

    const reservationDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":");
    reservationDateTime.setHours(parseInt(hours), parseInt(minutes));

    try {
      const recaptchaToken = await executeRecaptcha("create_reservation");
      createReservation.mutate({
        restaurantId,
        zoneId: selectedZone ? parseInt(selectedZone) : undefined,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        reservationDate: reservationDateTime.toISOString(),
        partySize: parseInt(partySize),
        specialRequests: specialRequests.trim() || undefined,
        recaptchaToken,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Protection anti-spam indisponible");
    }
  };

  const minDate = addDays(new Date(), settings?.minAdvanceHours ? Math.ceil(settings.minAdvanceHours / 24) : 0);
  const maxDate = addDays(new Date(), settings?.advanceBookingDays || 30);

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    return isBefore(date, minDate) || isBefore(maxDate, date);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                s < step
                  ? "bg-green-500 text-white"
                  : s === step
                  ? "bg-pronto-primary text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-pronto-primary transition-all duration-300"
            style={{ width: `${((step - 1) / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {step === 1 && (
              <>
                <CalendarIcon className="w-5 h-5" />
                Choisissez une date
              </>
            )}
            {step === 2 && (
              <>
                <Clock className="w-5 h-5" />
                Choisissez une heure
              </>
            )}
            {step === 3 && (
              <>
                <Users className="w-5 h-5" />
                Nombre de personnes
              </>
            )}
            {step === 4 && (
              <>
                <MapPin className="w-5 h-5" />
                Préférence de zone
              </>
            )}
            {step === 5 && (
              <>
                <User className="w-5 h-5" />
                Vos coordonnées
              </>
            )}
            {step === 6 && (
              <>
                <Check className="w-5 h-5" />
                Confirmation
              </>
            )}
            {step === 7 && (
              <>
                <Check className="w-5 h-5 text-green-500" />
                Réservation confirmée !
              </>
            )}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Sélectionnez la date de votre visite"}
            {step === 2 && "Sélectionnez l'heure souhaitée"}
            {step === 3 && "Pour combien de personnes ?"}
            {step === 4 && "Avez-vous une préférence de zone ? (optionnel)"}
            {step === 5 && "Comment pouvons-nous vous contacter ?"}
            {step === 6 && "Vérifiez les détails de votre réservation"}
            {step === 7 && "Merci pour votre réservation !"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Date Selection */}
          {step === 1 && (
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                locale={fr}
                className="rounded-md border"
              />
            </div>
          )}

          {/* Step 2: Time Selection */}
          {step === 2 && (
            <div className="grid grid-cols-3 gap-3">
              {availableSlots && availableSlots.length > 0 ? (
                availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedTime === slot ? "default" : "outline"}
                    onClick={() => setSelectedTime(slot)}
                    className="h-12"
                  >
                    {slot}
                  </Button>
                ))
              ) : (
                <p className="col-span-3 text-center text-muted-foreground">
                  Aucun créneau disponible pour cette date
                </p>
              )}
            </div>
          )}

          {/* Step 3: Party Size */}
          {step === 3 && (
            <div className="space-y-4">
              <Label htmlFor="partySize">Nombre de personnes</Label>
              <Select value={partySize} onValueChange={setPartySize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: settings?.maxPartySize || 12 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? "personne" : "personnes"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 4: Zone Selection */}
          {step === 4 && (
            <div className="space-y-4">
              {zones && zones.length > 0 ? (
                <>
                  <Label>Sélectionnez une zone (optionnel)</Label>
                  <div className="grid gap-3">
                    <Button
                      variant={selectedZone === undefined ? "default" : "outline"}
                      onClick={() => setSelectedZone(undefined)}
                      className="justify-start"
                    >
                      Aucune préférence
                    </Button>
                    {zones.map((zone) => (
                        <Button
                          key={zone.id}
                          variant={selectedZone === zone.id.toString() ? "default" : "outline"}
                          onClick={() => setSelectedZone(zone.id.toString())}
                          className="justify-start"
                        >
                          {zone.name} (capacité : {zone.capacity} personnes)
                        </Button>
                      ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground">
                  Aucune zone spécifique disponible. Continuez pour finaliser votre réservation.
                </p>
              )}
            </div>
          )}

          {/* Step 5: Customer Information */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom complet <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jean Dupont"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jean.dupont@example.com"
                  maxLength={254}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Téléphone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requests">Demandes spéciales (optionnel)</Label>
                <Textarea
                  id="requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Allergies, régime alimentaire, occasion spéciale..."
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {/* Step 6: Confirmation */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Établissement</span>
                  <span className="font-semibold">{businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-semibold">
                    {selectedDate && format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heure</span>
                  <span className="font-semibold">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre de personnes</span>
                  <span className="font-semibold">{partySize}</span>
                </div>
                {selectedZone && zones && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zone</span>
                    <span className="font-semibold">
                      {zones.find((z) => z.id.toString() === selectedZone)?.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom</span>
                  <span className="font-semibold">{customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-semibold">{customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Téléphone</span>
                  <span className="font-semibold">{customerPhone}</span>
                </div>
                {specialRequests && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">Demandes spéciales</span>
                    <p className="mt-1">{specialRequests}</p>
                  </div>
                )}
              </div>
              {settings?.cancellationPolicy && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Politique d'annulation</h4>
                  <p className="text-sm text-muted-foreground">{settings.cancellationPolicy}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 7: Success */}
          {step === 7 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg">
                Votre réservation a été enregistrée avec succès !
              </p>
              <p className="text-muted-foreground">
                Un email de confirmation a été envoyé à <strong>{customerEmail}</strong>
              </p>
              {settings?.autoConfirm ? (
                <p className="text-green-600 font-semibold">
                  Votre réservation est confirmée automatiquement.
                </p>
              ) : (
                <p className="text-orange-600">
                  Votre réservation est en attente de confirmation par l’établissement.
                </p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 7 && (
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              )}
              {step < 6 && (
                <Button onClick={handleNext} className="flex-1">
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              {step === 6 && (
                <Button onClick={handleSubmit} className="flex-1" disabled={createReservation.isPending}>
                  {createReservation.isPending ? "Envoi en cours..." : "Confirmer la réservation"}
                </Button>
              )}
            </div>
          )}

          {step === 7 && onClose && (
            <Button onClick={onClose} className="w-full">
              Fermer
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
