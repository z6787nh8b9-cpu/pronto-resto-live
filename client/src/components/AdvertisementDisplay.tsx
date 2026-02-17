import { useState, useEffect } from "react";
import { X, Crown } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface Advertisement {
  id: number;
  title: string;
  description?: string | null;
  format: "pastille" | "footer" | "fullpage" | "popup" | "dish_item";
  imageUrl?: string | null;
  linkUrl?: string | null;
  targetPage: "landing" | "restaurant_page" | "menu" | "all";
  content?: any;
  isActive: boolean;
  displayOrder: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

interface AdvertisementDisplayProps {
  advertisements: Advertisement[];
  currentPage: "landing" | "restaurant_page" | "menu";
}

export function AdvertisementDisplay({ advertisements, currentPage }: AdvertisementDisplayProps) {
  const [popupAd, setPopupAd] = useState<Advertisement | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Filtrer les publicités selon la page cible et les dates
  const now = new Date();
  const filteredAds = advertisements.filter((ad) => {
    // Vérifier la page cible
    if (ad.targetPage !== "all" && ad.targetPage !== currentPage) return false;
    
    // Vérifier si la publicité est active
    if (!ad.isActive) return false;
    
    // Vérifier la date de début
    if (ad.startDate) {
      const startDate = new Date(ad.startDate);
      if (now < startDate) return false;
    }
    
    // Vérifier la date de fin
    if (ad.endDate) {
      const endDate = new Date(ad.endDate);
      if (now > endDate) return false;
    }
    
    return true;
  });

  // Séparer par format
  const pastilleAds = filteredAds.filter((ad) => ad.format === "pastille");
  const footerAds = filteredAds.filter((ad) => ad.format === "footer");
  const fullpageAds = filteredAds.filter((ad) => ad.format === "fullpage");
  const popupAds = filteredAds.filter((ad) => ad.format === "popup");

  // Gérer l'affichage du pop-up avec délai
  useEffect(() => {
    if (popupAds.length > 0) {
      const firstPopup = popupAds[0];
      const delay = firstPopup.content?.displayDelay || 3000; // 3 secondes par défaut

      const timer = setTimeout(() => {
        setPopupAd(firstPopup);
        setIsPopupOpen(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [popupAds.length]);

  return (
    <>
      {/* Pastille - Badge dans un coin */}
      {pastilleAds.map((ad) => {
        const position = ad.content?.position || "bottom-right";
        const positionClasses = {
          "top-left": "top-4 left-4",
          "top-right": "top-4 right-4",
          "bottom-left": "bottom-4 left-4",
          "bottom-right": "bottom-4 right-4",
        };

        return (
          <a
            key={ad.id}
            href={ad.linkUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`fixed ${positionClasses[position as keyof typeof positionClasses]} z-40 group`}
            style={{ width: "80px", height: "80px" }}
          >
            {ad.imageUrl ? (
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover rounded-full shadow-lg group-hover:shadow-xl transition-shadow border-4 border-white"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg group-hover:shadow-xl transition-shadow border-4 border-white flex items-center justify-center">
                <span className="text-white text-xs font-bold text-center px-2">
                  {ad.content?.text || ad.title}
                </span>
              </div>
            )}
          </a>
        );
      })}

      {/* Footer - Bannière fixe en bas */}
      {footerAds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200/60 backdrop-blur-sm shadow-2xl">
          <div className="container max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                PARTENAIRE
              </div>
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 items-center justify-center">
                  {footerAds.map((ad) => (
                    <a
                      key={ad.id}
                      href={ad.linkUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 px-6 py-3 rounded-xl bg-white/80 hover:bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex-shrink-0 hover:scale-105"
                    >
                      {ad.imageUrl && (
                        <img
                          src={ad.imageUrl}
                          alt={ad.title}
                          className="h-12 w-12 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                        />
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                          {ad.title}
                        </span>
                        {ad.description && (
                          <span className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">
                            {ad.description}
                          </span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullpage - Arrière-plan avec overlay */}
      {fullpageAds.length > 0 && fullpageAds[0].imageUrl && (
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <img
            src={fullpageAds[0].imageUrl}
            alt={fullpageAds[0].title}
            className="w-full h-full object-cover"
            style={{ opacity: fullpageAds[0].content?.overlayOpacity || 0.15 }}
          />
        </div>
      )}

      {/* Pop-up - Modal temporaire */}
      {popupAd && (
        <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
          <DialogContent className="max-w-md">
            <button
              onClick={() => setIsPopupOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            {popupAd.imageUrl && (
              <div className="aspect-video overflow-hidden rounded-lg mb-4">
                <img
                  src={popupAd.imageUrl}
                  alt={popupAd.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">{popupAd.title}</h3>
            {popupAd.description && (
              <p className="text-neutral-600 mb-4">{popupAd.description}</p>
            )}
            {popupAd.content?.text && (
              <p className="text-neutral-700 mb-4">{popupAd.content.text}</p>
            )}
            {popupAd.linkUrl && (
              <a
                href={popupAd.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full text-center bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {popupAd.content?.buttonText || "En savoir plus"}
              </a>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// Composant spécial pour les "dish_item" - à intégrer dans la liste des plats
interface DishItemAdProps {
  advertisement: Advertisement;
}

export function DishItemAd({ advertisement }: DishItemAdProps) {
  return (
    <a
      href={advertisement.linkUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow bg-gradient-to-br from-[#8B9D83] to-[#6B7D63] border-2 border-[#D4AF37]/30">
        <CardContent className="p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-2">
                <h3 className="text-lg font-semibold text-white">
                  {advertisement.content?.name || advertisement.title}
                </h3>
                {/* Badge Partenariat avec couronne */}
                <div className="flex items-center gap-1 bg-[#D4AF37] text-white px-2 py-1 rounded-full text-[10px] font-bold tracking-wide flex-shrink-0">
                  <Crown className="h-3 w-3" />
                  <span>PARTENARIAT</span>
                </div>
              </div>
              {advertisement.description && (
                <p className="text-sm text-white/90 mb-2">{advertisement.description}</p>
              )}
              {advertisement.content?.partnerName && (
                <p className="text-xs text-white/70">
                  <span className="font-medium">Partenaire :</span> {advertisement.content.partnerName}
                </p>
              )}
            </div>
            <div className="text-right">
              {advertisement.content?.price && (
                <p className="text-xl font-bold text-[#D4AF37]">
                  {advertisement.content.price}
                </p>
              )}
              {advertisement.imageUrl && (
                <img
                  src={advertisement.imageUrl}
                  alt={advertisement.title}
                  className="mt-2 w-24 h-24 object-cover rounded-md transition-transform duration-300 group-hover:scale-110"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
