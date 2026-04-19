import { useEffect, useState } from "react";
import type { Language } from "./i18n";

const KEY = "eyta-language";

export function getStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "en" || v === "am" || v === "om" ? v : null;
}

export function setStoredLanguage(l: Language) {
  localStorage.setItem(KEY, l);
  window.dispatchEvent(new CustomEvent("eyta-lang", { detail: l }));
}

export function useLanguage(): [Language, (l: Language) => void] {
  const [lang, setLang] = useState<Language>("en");
  useEffect(() => {
    const stored = getStoredLanguage();
    if (stored) setLang(stored);
    const handler = (e: Event) => setLang((e as CustomEvent).detail);
    window.addEventListener("eyta-lang", handler);
    return () => window.removeEventListener("eyta-lang", handler);
  }, []);
  return [lang, (l: Language) => { setStoredLanguage(l); setLang(l); }];
}

export interface Settings {
  voiceSpeed: number; // 0.5 - 1.5
  voiceVolume: number; // 0 - 1
  vibration: boolean;
  emergencyContacts: { name: string; phone: string }[];
}

const SETTINGS_KEY = "eyta-settings";
const DEFAULT_SETTINGS: Settings = {
  voiceSpeed: 1,
  voiceVolume: 1,
  vibration: true,
  emergencyContacts: [],
};

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("eyta-settings", { detail: s }));
}

export function useSettings(): [Settings, (s: Settings) => void] {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    setS(getSettings());
    const h = (e: Event) => setS((e as CustomEvent).detail);
    window.addEventListener("eyta-settings", h);
    return () => window.removeEventListener("eyta-settings", h);
  }, []);
  return [s, (next: Settings) => { saveSettings(next); setS(next); }];
}
