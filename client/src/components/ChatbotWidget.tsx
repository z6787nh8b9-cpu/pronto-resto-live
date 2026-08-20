import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, X, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { executeRecaptcha } from "@/lib/recaptcha";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour, je suis l’assistant PRONTO. Je peux vous aider à comprendre comment préparer et publier votre vitrine.",
    },
  ]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestType, setRequestType] = useState<"call_request" | "issue_report">("call_request");
  const [requestData, setRequestData] = useState({ name: "", email: "", phone: "", message: "" });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const suggestedQuestions = [
    "Comment PRONTO s’adapte-t-il à mon activité ?",
    "Quels contenus puis-je préparer dans un catalogue ?",
    "Comment demander une démonstration ?",
  ];

  const chatMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data: { response: string }) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    },
  });

  const requestMutation = trpc.chatbotRequests.submit.useMutation({
    onSuccess: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: requestType === "call_request" 
            ? "Merci, votre demande d’appel a bien été enregistrée. Nous reviendrons vers vous avec la suite."
            : "Merci pour votre signalement. Notre équipe en prendra connaissance.",
        },
      ]);
      setShowRequestForm(false);
      setRequestData({ name: "", email: "", phone: "", message: "" });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, prefersReducedMotion]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      requestAnimationFrame(() => closeButtonRef.current?.focus());
      return;
    }
    if (wasOpenRef.current) {
      triggerRef.current?.focus();
      wasOpenRef.current = false;
    }
  }, [isOpen]);

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled])") ?? []);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setShowSuggestions(false);

    chatMutation.mutate({ message: input });
  };

  const handleSuggestedQuestion = (question: string) => {
    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setShowSuggestions(false);

    chatMutation.mutate({ message: question });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRequestSubmit = async () => {
    if (!requestData.message.trim()) return;
    try {
      const recaptchaToken = await executeRecaptcha("submit_assistance_request");
      requestMutation.mutate({
        type: requestType,
        name: requestData.name || undefined,
        email: requestData.email || undefined,
        phone: requestData.phone || undefined,
        message: requestData.message,
        recaptchaToken,
      });
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "La vérification anti-spam est momentanément indisponible. Veuillez réessayer dans un instant." }]);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir l’assistance PRONTO"
          aria-haspopup="dialog"
          className="fixed bottom-4 right-4 h-16 w-16 rounded-full border-none bg-transparent shadow-2xl transition-transform duration-300 hover:scale-110 sm:bottom-6 sm:right-6 sm:h-20 sm:w-20 z-50 cursor-pointer"
          style={{
            animation: prefersReducedMotion ? "none" : "chatbotPulse 2s ease-in-out infinite",
          }}
        >
          <style>{`
            @keyframes chatbotFrames {
              0%, 100% { background-image: url('/assets/chatbot-1_1848865b.png'); }
              25% { background-image: url('/assets/chatbot-2_3ea45b9c.png'); }
              50% { background-image: url('/assets/chatbot-3_c895e799.png'); }
              75% { background-image: url('/assets/chatbot-4_ea804970.png'); }
            }
            @keyframes chatbotPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
          `}</style>
          <div 
            className="w-full h-full rounded-full"
            style={{
              backgroundImage: 'url(/assets/chatbot-1_1848865b.png)',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              animation: prefersReducedMotion ? "none" : "chatbotFrames 1.2s steps(1) infinite",
            }}
          />
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pronto-assistance-title" onKeyDown={handleDialogKeyDown}>
        <Card className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 sm:bottom-6 h-[500px] max-h-[85vh] shadow-2xl z-50 flex flex-col border-2 border-pronto-primary">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: '#C75B4B' }}>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-white" />
              <div>
                <h3 id="pronto-assistance-title" className="font-semibold text-white">Assistance PRONTO</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <p className="text-xs text-white/90">En ligne</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              ref={closeButtonRef}
              onClick={() => setIsOpen(false)}
              aria-label="Fermer l’assistance"
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-pronto-primary text-black border-2 border-pronto-primary/30 shadow-sm"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {/* Questions suggérées */}
            {showSuggestions && messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center mb-2">Questions fréquentes :</p>
                {suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full text-left justify-start text-sm h-auto py-2 px-3 hover:bg-pronto-primary/10 hover:border-pronto-primary"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            )}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground">RISE AI™ réfléchit...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Action buttons */}
          {!showRequestForm && (
            <div className="px-4 py-2 border-t bg-card flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  setRequestType("call_request");
                  setShowRequestForm(true);
                }}
              >
                📞 Demander un appel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  setRequestType("issue_report");
                  setShowRequestForm(true);
                }}
              >
                ⚠️ Signaler
              </Button>
            </div>
          )}

          {/* Request form */}
          {showRequestForm && (
            <div className="p-4 border-t bg-card space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">
                  {requestType === "call_request" ? "📞 Demande d'appel" : "⚠️ Signalement"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRequestForm(false)}
                  aria-label="Revenir aux actions d’assistance"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <input
                type="text"
                aria-label="Nom"
                placeholder="Nom"
                maxLength={120}
                value={requestData.name}
                onChange={(e) => setRequestData({ ...requestData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-foreground bg-background"
              />
              <input
                type="email"
                aria-label="Email"
                placeholder="Email"
                maxLength={320}
                value={requestData.email}
                onChange={(e) => setRequestData({ ...requestData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-foreground bg-background"
              />
              {requestType === "call_request" && (
                <input
                  type="tel"
                  aria-label="Téléphone"
                  placeholder="Téléphone"
                  maxLength={40}
                  value={requestData.phone}
                  onChange={(e) => setRequestData({ ...requestData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-foreground bg-background"
                />
              )}
              <textarea
                aria-label="Votre message"
                placeholder="Votre message..."
                maxLength={2000}
                value={requestData.message}
                onChange={(e) => setRequestData({ ...requestData, message: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-foreground bg-background"
                rows={3}
              />
              <Button
                onClick={handleRequestSubmit}
                disabled={!requestData.message.trim() || requestMutation.isPending}
                className="w-full bg-pronto-primary hover:bg-pronto-primary/90"
              >
                {requestMutation.isPending ? "Envoi..." : "Envoyer"}
              </Button>
            </div>
          )}

          {/* Input */}
          {!showRequestForm && (
            <div className="p-4 border-t bg-card">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                maxLength={2000}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pronto-primary text-sm text-foreground bg-background"
                disabled={chatMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
                size="icon"
                aria-label="Envoyer le message"
                className="bg-pronto-primary hover:bg-pronto-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {/* Footer avec mentions légales */}
            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground">
                Propulsé par{" "}
                <a
                  href="https://agencerise.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-pronto-primary hover:underline"
                >
                  RISE IA™
                </a>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Évitez de partager des informations sensibles
              </p>
            </div>
          </div>
          )}
        </Card>
        </div>
      )}
    </>
  );
}
