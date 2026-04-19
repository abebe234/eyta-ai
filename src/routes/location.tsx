import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MapPin } from "lucide-react";
import { speak } from "@/hooks/useVoice";
import { getStoredLanguage } from "@/lib/storage";

export const Route = createFileRoute("/location")({
  component: LocationPage,
  head: () => ({
    meta: [
      { title: "Location — EYTA AI" },
      { name: "description", content: "Hear your current location read aloud." },
    ],
  }),
});

function LocationPage() {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(pos.coords);
        const lang = getStoredLanguage() ?? "en";
        speak(
          `Your location is latitude ${pos.coords.latitude.toFixed(4)}, longitude ${pos.coords.longitude.toFixed(4)}.`,
          lang,
        );
      },
      (e) => setError(e.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return (
    <AppShell withHeader withBottomNav>
      <section
        className="rounded-3xl bg-card px-6 py-8 text-center shadow-sm"
        style={{ border: "1px solid var(--border)" }}
      >
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "var(--primary)" }}
        >
          <MapPin className="h-10 w-10 text-white" aria-hidden />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold text-foreground">My Location</h2>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {coords && (
          <div className="mt-4 space-y-1 text-base text-foreground">
            <p>
              <span className="font-semibold">Latitude:</span> {coords.latitude.toFixed(5)}
            </p>
            <p>
              <span className="font-semibold">Longitude:</span> {coords.longitude.toFixed(5)}
            </p>
            <p className="text-sm text-muted-foreground">
              Accuracy: ±{Math.round(coords.accuracy)} m
            </p>
          </div>
        )}
        {!coords && !error && (
          <p className="mt-4 text-sm text-muted-foreground">Locating you…</p>
        )}
      </section>
    </AppShell>
  );
}
