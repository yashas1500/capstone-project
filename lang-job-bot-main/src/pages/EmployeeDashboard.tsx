import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Send, Mic, Volume2, VolumeX, Languages } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: (event: Event) => void;
  start(): void;
  stop(): void;
  abort(): void;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionClass = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognitionClass();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: Event) => {
        setIsListening(false);
        toast({
          title: "Error",
          description: "Speech recognition failed. Please try again.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = (event: Event) => {
        setIsListening(false);
      };
    }
  }, [toast]);

  useEffect(() => {
    if (recognitionRef.current && language) {
      const langMap: { [key: string]: string } = {
        en: 'en-IN',
        hi: 'hi-IN',
        pa: 'pa-IN',
      };
      recognitionRef.current.lang = langMap[language] || 'en-IN';
    }
  }, [language]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap: { [key: string]: string } = {
        en: 'en-IN',
        hi: 'hi-IN',
        pa: 'pa-IN',
      };
      utterance.lang = langMap[language];
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast({
        title: "Not supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: {
          messages: [...messages, userMessage],
          language,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      speakText(data.message);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Job Assistant</h1>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[140px]">
                <Languages className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
                <SelectItem value="pa">ਪੰਜਾਬੀ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col max-w-4xl">
        <Card className="flex-1 p-6 mb-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  {language === "hi"
                    ? "नमस्ते! मैं आपकी नौकरी खोजने में कैसे मदद कर सकता हूँ?"
                    : language === "pa"
                    ? "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੀ ਨੌਕਰੀ ਲੱਭਣ ਵਿੱਚ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?"
                    : "Hello! How can I help you find the perfect job?"}
                </h2>
                <p className="text-muted-foreground">
                  {language === "hi"
                    ? "अपने कौशल और प्राथमिकताओं के बारे में मुझे बताएं"
                    : language === "pa"
                    ? "ਆਪਣੇ ਹੁਨਰ ਅਤੇ ਤਰਜੀਹਾਂ ਬਾਰੇ ਮੈਨੂੰ ਦੱਸੋ"
                    : "Tell me about your skills and preferences"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </Card>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={startListening}
            disabled={isListening || isLoading}
          >
            <Mic className={`h-4 w-4 ${isListening ? "text-red-500" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={isSpeaking ? stopSpeaking : undefined}
            disabled={!isSpeaking}
          >
            {isSpeaking ? (
              <VolumeX className="h-4 w-4 text-red-500" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              language === "hi"
                ? "अपना संदेश टाइप करें..."
                : language === "pa"
                ? "ਆਪਣਾ ਸੁਨੇਹਾ ਟਾਈਪ ਕਰੋ..."
                : "Type your message..."
            }
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
