import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/storage";
import { t } from "@/lib/i18n";
import { speak, stopSpeaking, vibrate } from "@/hooks/useVoice";
import { supabase } from "@/integrations/supabase/client";
import { Camera as CameraIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const search = z.object({
  mode: z.enum(["detect", "read"]).default("detect"),
});

export const Route = createFileRoute("/camera")({
  component: CameraPage,
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Camera — IntelliGlass AI" },
      {
        name: "description",
        content:
          "Use your camera with IntelliGlass AI to describe what is in front of you or read printed text aloud.",
      },
    ],
  }),
});

function CameraPage() {
  const { mode } = Route.useSearch();
  const [lang] = useLanguage();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const intro =
          mode === "detect"
            ? t("describeScene", lang)
            : t("readText", lang);
        speak(intro, lang);
      } catch (e) {
        console.error(e);
        setError(t("permissionCamera", lang));
        speak(t("permissionCamera", lang), lang);
      }
    };
    start();
    return () => {
      stopSpeaking();
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, [lang, mode]);

  const capture = async () => {
    if (!videoRef.current || busy) return;
    setBusy(true);
    setResult("");
    vibrate(40);
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      return;
    }
    ctx.drawImage(video, 0, 0);
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.85);
    await speak(t("thinking", lang), lang);
    try {
      const { data, error: err } = await supabase.functions.invoke("vision", {
        body: { imageBase64, mode, language: lang },
      });
      if (err) throw err;
      const text = (data as { result?: string; error?: string })?.result ?? "";
      const e2 = (data as { error?: string })?.error;
      if (e2) {
        toast.error(e2);
        await speak(e2, lang);
      } else if (text) {
        setResult(text);
        // Vibrate for safety hazards in detect mode
        if (mode === "detect" && /vehicle|car|truck|stair|door|hole|step|hazard|caution/i.test(text)) {
          vibrate([100, 50, 100, 50, 100]);
        }
        await speak(text, lang);
      } else {
        await speak(t("noText", lang), lang);
      }
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title={mode === "detect" ? t("describeScene", lang) : t("readText", lang)}
      showBack
    >
      <div className="relative flex-1 overflow-hidden rounded-3xl bg-black shadow-[var(--shadow-warm)]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 text-center text-primary-foreground">
            {error}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <button
          onClick={capture}
          disabled={busy}
          className="flex items-center justify-center gap-3 rounded-2xl py-5 text-lg font-bold text-primary-foreground shadow-[var(--shadow-warm)] disabled:opacity-60 active:scale-[0.98]"
          style={{ background: "var(--gradient-primary)" }}
        >
          {busy ? <RefreshCw className="h-6 w-6 animate-spin" /> : <CameraIcon className="h-6 w-6" />}
          {busy
            ? t("thinking", lang)
            : mode === "detect"
              ? t("describeScene", lang)
              : t("readText", lang)}
        </button>
        {result && (
          <div
            role="status"
            aria-live="polite"
            className="max-h-40 overflow-auto rounded-2xl bg-card p-4 text-sm text-card-foreground"
          >
            {result}
          </div>
        )}
        <button
          onClick={() => navigate({ to: "/" })}
          className="text-sm text-muted-foreground underline"
        >
          ← Home
        </button>
      </div>
    </AppShell>
  );
}
