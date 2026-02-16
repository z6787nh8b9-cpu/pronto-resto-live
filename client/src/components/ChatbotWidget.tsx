import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, X, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Bonjour ! Je suis RISE AI™, votre assistant virtuel PRONTO. Comment puis-je vous aider aujourd'hui ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestType, setRequestType] = useState<"call_request" | "issue_report">("call_request");
  const [requestData, setRequestData] = useState({ name: "", email: "", phone: "", message: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Quels sont les tarifs de PRONTO ?",
    "Comment fonctionne l'essai gratuit ?",
    "Combien de temps pour créer mon site ?",
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
            ? "✅ Merci ! Votre demande d'appel a bien été enregistrée. Nous vous recontacterons très prochainement."
            : "✅ Merci pour votre signalement ! Notre équipe va l'étudier rapidement.",
        },
      ]);
      setShowRequestForm(false);
      setRequestData({ name: "", email: "", phone: "", message: "" });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 h-20 w-20 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 z-50 bg-transparent border-none cursor-pointer"
          style={{
            animation: 'chatbotPulse 2s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes chatbotFrames {
              0%, 100% { background-image: url('https://files.manuscdn.com/user_upload_by_module/session_file/99899876/qdHdlqxJDrcPieHz.png'); }
              25% { background-image: url('https://files.manuscdn.com/user_upload_by_module/session_file/99899876/DGisotQskbdxgMVc.png'); }
              50% { background-image: url('https://files.manuscdn.com/user_upload_by_module/session_file/99899876/oFlNfKqUXBqweiVF.png'); }
              75% { background-image: url('https://files.manuscdn.com/user_upload_by_module/session_file/99899876/oUpwZebeGHEroreA.png'); }
            }
            @keyframes chatbotPulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
          `}</style>
          <div 
            className="w-full h-full rounded-full"
            style={{
              backgroundImage: 'url(https://files.manuscdn.com/user_upload_by_module/session_file/99899876/qdHdlqxJDrcPieHz.png)',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              animation: 'chatbotFrames 1.2s steps(1) infinite',
            }}
          />
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 sm:bottom-6 h-[500px] max-h-[85vh] shadow-2xl z-50 flex flex-col border-2 border-pronto-primary">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: '#C75B4B' }}>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-white" />
              <div>
                <h3 className="font-semibold text-white">Assistance PRONTO</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <p className="text-xs text-white/90">En ligne</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
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
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <input
                type="text"
                placeholder="Nom"
                value={requestData.name}
                onChange={(e) => setRequestData({ ...requestData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-foreground bg-background"
              />
              <input
                type="email"
                placeholder="Email"
                value={requestData.email}
                onChange={(e) => setRequestData({ ...requestData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-foreground bg-background"
              />
              {requestType === "call_request" && (
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={requestData.phone}
                  onChange={(e) => setRequestData({ ...requestData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-foreground bg-background"
                />
              )}
              <textarea
                placeholder="Votre message..."
                value={requestData.message}
                onChange={(e) => setRequestData({ ...requestData, message: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-foreground bg-background"
                rows={3}
              />
              <Button
                onClick={() => {
                  if (requestData.message.trim()) {
                    requestMutation.mutate({
                      type: requestType,
                      name: requestData.name || undefined,
                      email: requestData.email || undefined,
                      phone: requestData.phone || undefined,
                      message: requestData.message,
                    });
                  }
                }}
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
                  RISE IA
                </a>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Anonyme • Sans rétention de données • Protégé
              </p>
            </div>
          </div>
          )}
        </Card>
      )}
    </>
  );
}
