"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Browser SpeechRecognition, not the Gemini realtime pipeline described as
 * a stretch goal in docs/ARCHITECTURE.md — that needs an API key/provider
 * decision this project hasn't made. This is a zero-dependency, zero-key
 * stand-in: it feeds transcribed text into the same chat pipeline text
 * input already uses, so upgrading later doesn't change anything downstream.
 */
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionLike)
    | undefined
    ?? null;
}

function subscribeNever() {
  return () => {};
}

export function VoiceButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const supported = useSyncExternalStore(
    subscribeNever,
    () => getSpeechRecognitionCtor() !== null,
    () => false
  );
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function toggleListening() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = () => {
      toast.error("Couldn't hear that — try again?");
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  if (!supported) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="outline" size="icon" disabled aria-label="Voice input unavailable">
              <MicOff className="size-4" />
            </Button>
          }
        />
        <TooltipContent>Voice input needs Chrome, Edge, or Safari</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleListening}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      className={cn(listening && "border-destructive text-destructive")}
    >
      <Mic className={cn("size-4", listening && "animate-pulse")} />
    </Button>
  );
}
