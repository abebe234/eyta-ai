import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LANG_NAMES, t, type Language } from "@/lib/i18n";
import { getStoredLanguage, setStoredLanguage } from "@/lib/storage";
import { speak, stopSpeaking, useVoiceListen, vibrate } from "@/hooks/useVoice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mic, Camera, ScanLine, Play } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "EYTA AI — Voice Assistant for the Visually Impaired" },
      {
        name: "description",
        content:
          "EYTA AI is a fully hands-free voice assistant in English, Amharic, and Afaan Oromo that helps visually impaired users navigate, read, and stay safe.",
      },
    ],
  }),
});

function Home() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language | null>(null);
  const [needsStart, setNeedsStart] = useState(false);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [lastReply, setLastReply] = useState("");
  const startedRef = useRef(false);
  const stopLoopRef = useRef(false);

  const activeLang: Language = lang ?? "en";
  const { listen } = useVoiceListen(activeLang);
  const langRef = useRef<Language>(activeLang);
  useEffect(() => {
    langRef.current = activeLang;
  }, [activeLang]);

  // ---- Conversation loop (fully hands-free) ----
  const runConversationLoop = async (l: Language) => {
    stopLoopRef.current = false;
    // First prompt
    await speak(t("welcome", l) + " " + t("describeScene", l) + "?", l);
    let silentRounds = 0;
    while (!stopLoopRef.current) {
      setStatus("listening");
      vibrate(20);
      const text = await listen();
      if (stopLoopRef.current) break;
      if (!text) {
        silentRounds++;
        setStatus("idle");
        if (silentRounds >= 3) {
          await speak(t("notUnderstood", langRef.current), langRef.current);
          silentRounds = 0;
        }
        continue;
      }
      silentRounds = 0;
      const handled = await handleVoiceCommand(text);
      if (handled === "navigated") break; // route changed, stop loop
    }
  };

  const detectLanguageCommand = async (text: string): Promise<Language | null> => {
    const n = text.toLowerCase().trim();
    if (/(amharic|amharigna)/.test(n) || /አማርኛ/.test(text)) return "am";
    if (/english|englizegna|እንግሊዝኛ/i.test(text)) return "en";
    if (/(oromo|afaan)/.test(n) || /afaan oromoo/i.test(text)) return "om";
    return null;
  };

  const handleVoiceCommand = async (text: string): Promise<"continue" | "navigated"> => {
    // Language switching at any time
    const newLang = await detectLanguageCommand(text);
    if (newLang && newLang !== langRef.current) {
      setLang(newLang);
      setStoredLanguage(newLang);
      langRef.current = newLang;
      await speak(t("languageSet", newLang), newLang);
      return "continue";
    }

    if (/(in front|describe|see|scene|ፊቴ|fuula|where am i|object)/i.test(text)) {
      await speak(t("describeScene", langRef.current), langRef.current);
      stopLoopRef.current = true;
      navigate({ to: "/camera", search: { mode: "detect" } });
      return "navigated";
    }
    if (/(read|text|አንብብ|dubbisi)/i.test(text)) {
      await speak(t("readText", langRef.current), langRef.current);
      stopLoopRef.current = true;
      navigate({ to: "/camera", search: { mode: "read" } });
      return "navigated";
    }
    if (/(emergency|help me|sos|አደጋ|gargaarsa|balaa)/i.test(text)) {
      stopLoopRef.current = true;
      navigate({ to: "/emergency" });
      return "navigated";
    }
    if (/(setting|ማስተካከያ|sajoo)/i.test(text)) {
      stopLoopRef.current = true;
      navigate({ to: "/settings" });
      return "navigated";
    }
    if (/(location|where am i|ቦታ|iddoo)/i.test(text)) {
      stopLoopRef.current = true;
      navigate({ to: "/location" });
      return "navigated";
    }
    if (/(stop|quiet|ዝም|cal|cal'isi)/i.test(text)) {
      stopLoopRef.current = true;
      stopSpeaking();
      setStatus("idle");
      return "continue";
    }

    setStatus("thinking");
    try {
      const { data, error } = await supabase.functions.invoke("voice-assistant", {
        body: { message: text, language: langRef.current },
      });
      if (error) throw error;
      const reply = (data as { reply?: string; error?: string })?.reply ?? "";
      const errMsg = (data as { error?: string })?.error;
      if (errMsg) {
        toast.error(errMsg);
        await speak(errMsg, langRef.current);
      } else if (reply) {
        setLastReply(reply);
        setStatus("speaking");
        await speak(reply, langRef.current);
      }
    } catch (e) {
      console.error(e);
      const msg = (e as Error).message ?? "Something went wrong.";
      toast.error(msg);
    } finally {
      setStatus("idle");
    }
    return "continue";
  };

  // ---- Language detection on first launch (voice-only) ----
  const detectInitialLanguage = async (): Promise<Language> => {
    // Greet in all three languages briefly, then listen
    await speak(
      "Welcome to EYTA AI. Say English, Amharic, or Afaan Oromo to choose your language.",
      "en",
    );
    for (let i = 0; i < 3; i++) {
      setStatus("listening");
      const text = await listen();
      const picked = await detectLanguageCommand(text);
      if (picked) return picked;
      await speak("Please say English, Amharic, or Afaan Oromo.", "en");
    }
    return "en"; // fallback
  };

  const startEverything = async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setNeedsStart(false);
    let l = getStoredLanguage();
    if (!l) {
      l = await detectInitialLanguage();
      setLang(l);
      setStoredLanguage(l);
      langRef.current = l;
      await speak(t("languageSet", l), l);
    } else {
      setLang(l);
      langRef.current = l;
    }
    await runConversationLoop(l);
  };

  // Try to auto-start on mount. Browsers may block audio/mic without a gesture;
  // in that case we expose a single fullscreen Start button.
  useEffect(() => {
    let cancelled = false;
    const tryAutoStart = async () => {
      try {
        // Probe TTS — if speechSynthesis is allowed to speak, we're good to go.
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          setNeedsStart(true);
          return;
        }
        // Attempt mic permission silently; if it throws, we need a user gesture.
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        await startEverything();
      } catch {
        if (!cancelled) setNeedsStart(true);
      }
    };
    tryAutoStart();
    return () => {
      cancelled = true;
      stopLoopRef.current = true;
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Fallback: one-time Start screen if browser blocks autoplay ----
  if (needsStart) {
    return (
      <AppShell withHeader withBottomNav={false}>
        <button
          onClick={startEverything}
          className="flex flex-1 flex-col items-center justify-center gap-6 rounded-3xl text-center text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
          aria-label="Start EYTA AI"
        >
          <Play className="h-20 w-20" aria-hidden />
          <span className="text-3xl font-extrabold">Tap anywhere to start</span>
          <span className="px-6 text-base opacity-90">
            EYTA AI will then run completely hands-free.
          </span>
        </button>
      </AppShell>
    );
  }

  const promptLine =
    activeLang === "am"
      ? "ይናገሩ — በማንኛውም ጊዜ።"
      : activeLang === "om"
        ? "Dubbadhu — yeroo kamiyyuu."
        : "Just speak — anytime.";

  return (
    <AppShell withHeader withBottomNav>
      {/* Always-listening status card */}
      <section
        className="rounded-3xl bg-card px-6 py-8 shadow-sm"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col items-center gap-5 text-center">
          <div
            className="relative flex h-20 w-20 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-warm)]"
            style={{ background: "var(--primary)" }}
            aria-hidden
          >
            {status === "listening" && (
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
            )}
            <Mic className="h-9 w-9" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-foreground" aria-live="polite">
              {status === "listening"
                ? t("listening", activeLang)
                : status === "thinking"
                  ? t("thinking", activeLang)
                  : status === "speaking"
                    ? "…"
                    : t("listening", activeLang)}
            </p>
            <p className="mt-2 text-base text-muted-foreground">{promptLine}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {LANG_NAMES[activeLang]}
            </p>
          </div>
          {lastReply && (
            <p className="max-h-28 w-full overflow-auto rounded-xl bg-secondary px-4 py-3 text-left text-sm text-secondary-foreground">
              {lastReply}
            </p>
          )}
        </div>
      </section>

      {/* Action rows (still tappable for sighted helpers) */}
      <div className="mt-5 flex flex-col gap-4">
        <ActionRow
          to="/camera"
          search={{ mode: "read" as const }}
          title="Text Reader"
          subtitle="Read text from camera"
          icon={<Camera className="h-7 w-7 text-white" aria-hidden />}
        />
        <ActionRow
          to="/camera"
          search={{ mode: "detect" as const }}
          title="Object Recognition"
          subtitle="Identify objects & symbols"
          icon={<ScanLine className="h-7 w-7 text-white" aria-hidden />}
        />
        <ActionRow
          to="/emergency"
          title="Emergency"
          subtitle="Call for help instantly"
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92Z" />
            </svg>
          }
        />
      </div>
    </AppShell>
  );
}

function ActionRow({
  to,
  title,
  subtitle,
  icon,
  search,
}: {
  to: "/camera" | "/emergency";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  search?: { mode: "detect" | "read" };
}) {
  const className =
    "flex items-center gap-4 rounded-3xl bg-card px-4 py-4 shadow-sm active:scale-[0.99] transition";
  const inner = (
    <>
      <div
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl"
        style={{ background: "var(--primary)" }}
      >
        {icon}
      </div>
      <div className="min-w-0 text-left">
        <p className="text-lg font-bold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </>
  );
  if (to === "/camera" && search) {
    return (
      <Link
        to="/camera"
        search={search}
        className={className}
        aria-label={title}
        style={{ border: "1px solid var(--border)" }}
      >
        {inner}
      </Link>
    );
  }
  return (
    <Link
      to={to}
      className={className}
      aria-label={title}
      style={{ border: "1px solid var(--border)" }}
    >
      {inner}
    </Link>
  );
}
