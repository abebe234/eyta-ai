import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLanguage, useSettings } from "@/lib/storage";
import { LANG_NAMES, type Language, t } from "@/lib/i18n";
import { speak } from "@/hooks/useVoice";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, LogIn, LogOut } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: Settings,
  head: () => ({
    meta: [
      { title: "Settings — EYTA AI" },
      {
        name: "description",
        content:
          "Adjust language, voice speed, vibration, and emergency contacts in EYTA AI.",
      },
    ],
  }),
});

function Settings() {
  const [lang, setLang] = useLanguage();
  const [settings, setSettings] = useSettings();
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const addContact = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setSettings({
      ...settings,
      emergencyContacts: [
        ...settings.emergencyContacts,
        { name: newName.trim(), phone: newPhone.trim() },
      ],
    });
    setNewName("");
    setNewPhone("");
  };

  const removeContact = (i: number) => {
    setSettings({
      ...settings,
      emergencyContacts: settings.emergencyContacts.filter((_, idx) => idx !== i),
    });
  };

  return (
    <AppShell title={t("settings", lang)} showBack>
      <section className="mt-2 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Language
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(LANG_NAMES) as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLang(l);
                speak(t("switchedLanguage", l), l);
              }}
              className={`rounded-2xl py-4 text-sm font-bold ${
                lang === l
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground"
              }`}
            >
              {LANG_NAMES[l]}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-3 rounded-2xl bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Voice
        </h2>
        <label className="block text-sm font-medium text-card-foreground">
          Speed: {settings.voiceSpeed.toFixed(2)}×
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={settings.voiceSpeed}
            onChange={(e) =>
              setSettings({ ...settings, voiceSpeed: parseFloat(e.target.value) })
            }
            className="mt-2 w-full accent-primary"
          />
        </label>
        <label className="block text-sm font-medium text-card-foreground">
          Volume: {Math.round(settings.voiceVolume * 100)}%
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.voiceVolume}
            onChange={(e) =>
              setSettings({ ...settings, voiceVolume: parseFloat(e.target.value) })
            }
            className="mt-2 w-full accent-primary"
          />
        </label>
        <button
          onClick={() => speak("This is how I will sound.", lang)}
          className="w-full rounded-xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground"
        >
          Test voice
        </button>
        <label className="flex items-center justify-between text-sm font-medium text-card-foreground">
          <span>Vibration alerts</span>
          <input
            type="checkbox"
            checked={settings.vibration}
            onChange={(e) => setSettings({ ...settings, vibration: e.target.checked })}
            className="h-5 w-5 accent-primary"
          />
        </label>
      </section>

      <section className="mt-6 space-y-3 rounded-2xl bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Emergency contacts
        </h2>
        {settings.emergencyContacts.map((c, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-secondary-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.phone}</p>
            </div>
            <button
              onClick={() => removeContact(i)}
              aria-label={`Remove ${c.name}`}
              className="rounded-full p-2 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="space-y-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Contact name"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Phone number"
            type="tel"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={addContact}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add contact
          </button>
        </div>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </h2>
        {userEmail ? (
          <div className="rounded-xl bg-card p-4">
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="mb-3 truncate text-base font-semibold text-card-foreground">{userEmail}</p>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                speak("Signed out.", lang);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground"
          >
            <LogIn className="h-5 w-5" /> Sign in
          </Link>
        )}
      </section>
    </AppShell>
  );
}
