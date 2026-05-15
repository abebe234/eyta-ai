import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LANG_NAMES, t, type Language } from "@/lib/i18n";
import { getStoredLanguage, setStoredLanguage } from "@/lib/storage";
import { speak, stopSpeaking, useVoiceListen, vibrate } from "@/hooks/useVoice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mic, Camera, ScanLine, Languages } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "IntelliGlass AI — Voice Assistant for the Visually Impaired" },
      {
        name: "description",
        content:
          "IntelliGlass AI is a fully voice-driven assistant in English, Amharic, and Afaan Oromo that helps visually impaired users navigate, read, and stay safe.",
      },
    ],
  }),
});

function Home() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [lastReply, setLastReply] = useState("");
  const greetedRef = useRef(false);

  const activeLang: Language = lang ?? "en";
  const { listen } = useVoiceListen(activeLang);

  // Auto greet on first launch and prompt language picker
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const stored = getStoredLanguage();
    if (!stored) {
      setShowLangPicker(true);
      setTimeout(() => {
        speak(
          "Welcome to IntelliGlass AI. Please choose your language. English, Amharic, or Afaan Oromo.",
          "en",
        );
      }, 500);
    } else {
      setLang(stored);
      setTimeout(() => speak(t("welcome", stored) + " " + t("tapToSpeak", stored), stored), 400);
    }
    return () => stopSpeaking();
  }, []);

  const pickLanguage = async (l: Language) => {
    setLang(l);
    setStoredLanguage(l);
    setShowLangPicker(false);
    vibrate(40);
    await speak(t("languageSet", l), l);
  };

  const handleVoiceCommand = async (text: string) => {
    const normalized = text.toLowerCase().trim();

    if (/(switch|change).*(amharic|amharigna|አማርኛ)/.test(normalized) || /አማርኛ/.test(text)) {
      await pickLanguage("am");
      return;
    }
    if (/(switch|change).*(english)/.test(normalized)) {
      await pickLanguage("en");
      return;
    }
    if (/(switch|change).*(oromo|afaan)/.test(normalized) || /afaan oromoo/i.test(text)) {
      await pickLanguage("om");
      return;
    }

    if (/(in front|describe|see|scene|ፊቴ|fuula|where am i|object)/i.test(text)) {
      await speak(t("describeScene", activeLang), activeLang);
      navigate({ to: "/camera", search: { mode: "detect" } });
      return;
    }
    if (/(read|text|አንብብ|dubbisi)/i.test(text)) {
      await speak(t("readText", activeLang), activeLang);
      navigate({ to: "/camera", search: { mode: "read" } });
      return;
    }
    if (/(emergency|help me|sos|አደጋ|gargaarsa|balaa)/i.test(text)) {
      navigate({ to: "/emergency" });
      return;
    }
    if (/(setting|ማስተካከያ|sajoo)/i.test(text)) {
      navigate({ to: "/settings" });
      return;
    }
    if (/(location|where am i|ቦታ|iddoo)/i.test(text)) {
      navigate({ to: "/location" });
      return;
    }

    setStatus("thinking");
    try {
      const { data, error } = await supabase.functions.invoke("voice-assistant", {
        body: { message: text, language: activeLang },
      });
      if (error) throw error;
      const reply = (data as { reply?: string; error?: string })?.reply ?? "";
      const errMsg = (data as { error?: string })?.error;
      if (errMsg) {
        toast.error(errMsg);
        await speak(errMsg, activeLang);
      } else if (reply) {
        setLastReply(reply);
        setStatus("speaking");
        await speak(reply, activeLang);
      }
    } catch (e) {
      console.error(e);
      const msg = (e as Error).message ?? "Something went wrong.";
      toast.error(msg);
    } finally {
      setStatus("idle");
    }
  };

  const tapMic = async () => {
    if (showLangPicker) return;
    stopSpeaking();
    vibrate(30);
    setStatus("listening");
    await speak(t("listening", activeLang), activeLang);
    const text = await listen();
    if (!text) {
      setStatus("idle");
      await speak(t("notUnderstood", activeLang), activeLang);
      return;
    }
    await handleVoiceCommand(text);
  };

  if (showLangPicker) {
    return (
      <AppShell withHeader withBottomNav={false}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Languages className="h-16 w-16 text-primary" aria-hidden />
          <h2 className="text-2xl font-bold text-foreground">Choose your language</h2>
          <p className="text-base text-muted-foreground">
            ቋንቋ ይምረጡ · Afaan filadhu
          </p>
          <div className="flex w-full flex-col gap-4">
            {(Object.keys(LANG_NAMES) as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => pickLanguage(l)}
                className="w-full rounded-2xl py-6 text-2xl font-bold text-primary-foreground shadow-[var(--shadow-warm)] active:scale-[0.98] transition"
                style={{ background: "var(--gradient-primary)" }}
              >
                {LANG_NAMES[l]}
              </button>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const promptLine =
    activeLang === "am"
      ? 'ይበሉ "ጽሑፍ አንብብ" ወይም "የት ነኝ?"'
      : activeLang === "om"
        ? 'Jedhi "Barreeffama dubbisi" ykn "Eessan jira?"'
        : 'Say "Read text" or "Where am I?"';

  return (
    <AppShell withHeader withBottomNav>
      {/* Tap to Speak card */}
      <section
        className="rounded-3xl bg-card px-6 py-8 shadow-sm"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col items-center gap-5 text-center">
          <button
            onClick={tapMic}
            aria-label={t("tapToSpeak", activeLang)}
            className="relative flex h-20 w-20 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-warm)] transition active:scale-95"
            style={{ background: "var(--primary)" }}
          >
            {status === "listening" && (
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
            )}
            <Mic className="h-9 w-9" aria-hidden />
          </button>
          <div>
            <p className="text-2xl font-extrabold text-foreground" aria-live="polite">
              {status === "listening"
                ? t("listening", activeLang)
                : status === "thinking"
                  ? t("thinking", activeLang)
                  : t("tapToSpeak", activeLang)}
            </p>
            <p className="mt-2 text-base text-muted-foreground">{promptLine}</p>
          </div>
          {lastReply && (
            <p className="max-h-28 w-full overflow-auto rounded-xl bg-secondary px-4 py-3 text-left text-sm text-secondary-foreground">
              {lastReply}
            </p>
          )}
        </div>
      </section>

      {/* Action rows */}
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
