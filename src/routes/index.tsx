import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { LANG_NAMES, t, type Language } from "@/lib/i18n";
import { getStoredLanguage, setStoredLanguage } from "@/lib/storage";
import { speak, stopSpeaking, useVoiceListen, vibrate } from "@/hooks/useVoice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mic, Camera, BookOpen, AlertTriangle, Settings as SettingsIcon, Languages } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "EYTA AI — Voice Assistant for the Visually Impaired" },
      {
        name: "description",
        content:
          "EYTA AI is a fully voice-driven assistant in English, Amharic, and Afaan Oromo that helps visually impaired users navigate, read, and stay safe.",
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
      // Slight delay so voices load
      setTimeout(() => {
        speak(
          "Welcome to EYTA AI. Please choose your language. English, Amharic, or Afaan Oromo.",
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

    // Local language switching
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

    // Local intents → navigate
    if (/(in front|describe|see|scene|ፊቴ|fuula)/i.test(text)) {
      await speak(t("describeScene", activeLang), activeLang);
      navigate({ to: "/camera", search: { mode: "detect" } });
      return;
    }
    if (/(read|text|አንብብ|dubbisi)/i.test(text)) {
      await speak(t("readText", activeLang), activeLang);
      navigate({ to: "/camera", search: { mode: "read" } });
      return;
    }
    if (/(emergency|help me|አደጋ|gargaarsa|balaa)/i.test(text)) {
      navigate({ to: "/emergency" });
      return;
    }
    if (/(setting|ማስተካከያ|sajoo)/i.test(text)) {
      navigate({ to: "/settings" });
      return;
    }

    // Otherwise → AI assistant
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
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Languages className="h-16 w-16 text-primary" aria-hidden />
          <h1 className="text-3xl font-bold text-foreground">EYTA AI</h1>
          <p className="text-base text-muted-foreground">
            Choose your language · ቋንቋ ይምረጡ · Afaan filadhu
          </p>
          <div className="flex w-full flex-col gap-4">
            {(Object.keys(LANG_NAMES) as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => pickLanguage(l)}
                className="w-full rounded-2xl bg-primary py-6 text-2xl font-bold text-primary-foreground shadow-[var(--shadow-warm)] active:scale-[0.98] transition"
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

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">EYTA AI</p>
          <p className="text-sm text-foreground/70">{LANG_NAMES[activeLang]}</p>
        </div>
        <button
          aria-label={t("settings", activeLang)}
          onClick={() => navigate({ to: "/settings" })}
          className="rounded-full bg-secondary p-3 text-secondary-foreground hover:bg-muted"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-8">
        <button
          onClick={tapMic}
          aria-label={t("tapToSpeak", activeLang)}
          className="relative flex h-56 w-56 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-warm)] transition active:scale-95"
          style={{ background: "var(--gradient-primary)" }}
        >
          {status === "listening" && (
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
          )}
          <Mic className="h-24 w-24" aria-hidden />
        </button>
        <p className="text-lg font-semibold text-foreground" aria-live="polite">
          {status === "listening"
            ? t("listening", activeLang)
            : status === "thinking"
              ? t("thinking", activeLang)
              : t("tapToSpeak", activeLang)}
        </p>
        {lastReply && (
          <p className="max-h-32 overflow-auto rounded-xl bg-card px-4 py-3 text-center text-sm text-card-foreground shadow-sm">
            {lastReply}
          </p>
        )}
      </div>

      <nav className="mt-8 grid grid-cols-3 gap-3">
        <ActionTile
          to="/camera"
          search={{ mode: "detect" as const }}
          label={t("describeScene", activeLang)}
          icon={<Camera className="h-7 w-7" />}
        />
        <ActionTile
          to="/camera"
          search={{ mode: "read" as const }}
          label={t("readText", activeLang)}
          icon={<BookOpen className="h-7 w-7" />}
        />
        <ActionTile
          to="/emergency"
          label={t("emergency", activeLang)}
          icon={<AlertTriangle className="h-7 w-7" />}
          danger
        />
      </nav>
    </AppShell>
  );
}

function ActionTile({
  to,
  label,
  icon,
  danger,
  search,
}: {
  to: "/camera" | "/emergency";
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  search?: { mode: "detect" | "read" };
}) {
  const className = `flex flex-col items-center justify-center gap-2 rounded-2xl px-2 py-4 text-center text-xs font-semibold transition active:scale-95 ${
    danger
      ? "bg-destructive text-destructive-foreground"
      : "bg-card text-card-foreground shadow-sm hover:bg-muted"
  }`;
  if (to === "/camera" && search) {
    return (
      <Link to="/camera" search={search} className={className} aria-label={label}>
        {icon}
        <span>{label}</span>
      </Link>
    );
  }
  return (
    <Link to={to} className={className} aria-label={label}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
