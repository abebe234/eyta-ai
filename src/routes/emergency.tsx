import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/lib/storage";
import { useSettings } from "@/lib/storage";
import { speak, vibrate } from "@/hooks/useVoice";
import { t } from "@/lib/i18n";
import { AlertTriangle, MapPin, Phone, Send } from "lucide-react";

export const Route = createFileRoute("/emergency")({
  component: Emergency,
  head: () => ({
    meta: [
      { title: "Emergency — IntelliGlass AI" },
      {
        name: "description",
        content:
          "Send an emergency message with your live location to your saved contacts using IntelliGlass AI.",
      },
    ],
  }),
});

function Emergency() {
  const [lang] = useLanguage();
  const [settings] = useSettings();
  const [coords, setCoords] = useState<GeolocationPosition | null>(null);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    speak(t("emergencySent", lang), lang);
    vibrate([200, 100, 200]);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords(pos),
        (err) => setGeoError(err.message),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  }, [lang]);

  const locationUrl = coords
    ? `https://maps.google.com/?q=${coords.coords.latitude},${coords.coords.longitude}`
    : "";

  const messageText = coords
    ? `IntelliGlass AI Emergency: I need help. My location: ${locationUrl}`
    : `IntelliGlass AI Emergency: I need help. (Location unavailable)`;

  const sendSms = (phone: string) => {
    const url = `sms:${encodeURIComponent(phone)}?&body=${encodeURIComponent(messageText)}`;
    window.location.href = url;
  };

  const callContact = (phone: string) => {
    window.location.href = `tel:${encodeURIComponent(phone)}`;
  };

  return (
    <AppShell title={t("emergency", lang)} showBack>
      <div
        className="rounded-3xl p-6 text-destructive-foreground shadow-[var(--shadow-warm)]"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-10 w-10" />
          <div>
          <p className="text-xs uppercase tracking-widest opacity-80">IntelliGlass AI</p>
            <h2 className="text-2xl font-bold">{t("emergency", lang)}</h2>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="break-all">
            {coords
              ? `${coords.coords.latitude.toFixed(5)}, ${coords.coords.longitude.toFixed(5)}`
              : geoError || "Locating…"}
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {settings.emergencyContacts.length === 0 ? (
          <div className="rounded-2xl bg-card p-4 text-sm text-card-foreground">
            No emergency contacts yet. Add some in Settings.
          </div>
        ) : (
          settings.emergencyContacts.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm"
            >
              <div>
                <p className="font-semibold text-card-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
              </div>
              <div className="flex gap-2">
                <button
                  aria-label={`Call ${c.name}`}
                  onClick={() => callContact(c.phone)}
                  className="rounded-full bg-secondary p-3 text-secondary-foreground hover:bg-muted"
                >
                  <Phone className="h-5 w-5" />
                </button>
                <button
                  aria-label={`Send SMS to ${c.name}`}
                  onClick={() => sendSms(c.phone)}
                  className="rounded-full bg-primary p-3 text-primary-foreground"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
