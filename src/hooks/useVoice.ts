import { useCallback, useEffect, useRef, useState } from "react";
import { BCP47, type Language } from "@/lib/i18n";
import { getSettings } from "@/lib/storage";

export function speak(text: string, lang: Language): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const settings = getSettings();
      u.lang = BCP47[lang];
      u.rate = settings.voiceSpeed;
      u.volume = settings.voiceVolume;
      // Try to pick a matching voice
      const voices = window.speechSynthesis.getVoices();
      const match =
        voices.find((v) => v.lang === BCP47[lang]) ||
        voices.find((v) => v.lang.startsWith(lang));
      if (match) u.voice = match;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    } catch {
      resolve();
    }
  });
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: { results: { 0: { transcript: string } }[] }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor():
  | (new () => SpeechRecognitionInstance)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceInputSupported() {
  return getRecognitionCtor() !== null;
}

export function useVoiceListen(lang: Language) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const resolverRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* noop */
      }
    };
  }, []);

  const listen = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        resolve("");
        return;
      }
      const rec = new Ctor();
      rec.lang = BCP47[lang];
      rec.continuous = false;
      rec.interimResults = false;
      resolverRef.current = resolve;

      rec.onresult = (ev) => {
        const text = ev.results[0]?.[0]?.transcript ?? "";
        resolverRef.current?.(text);
        resolverRef.current = null;
      };
      rec.onerror = () => {
        resolverRef.current?.("");
        resolverRef.current = null;
      };
      rec.onend = () => {
        setListening(false);
        if (resolverRef.current) {
          resolverRef.current("");
          resolverRef.current = null;
        }
      };
      try {
        rec.start();
        recRef.current = rec;
        setListening(true);
      } catch {
        resolve("");
      }
    });
  }, [lang]);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  return { listening, listen, stop };
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* noop */
    }
  }
}
