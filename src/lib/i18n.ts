export type Language = "en" | "am" | "om";

export const LANG_NAMES: Record<Language, string> = {
  en: "English",
  am: "አማርኛ",
  om: "Afaan Oromoo",
};

export const BCP47: Record<Language, string> = {
  en: "en-US",
  am: "am-ET",
  om: "om-ET",
};

export type Phrase =
  | "welcome"
  | "chooseLanguage"
  | "languageSet"
  | "tapToSpeak"
  | "listening"
  | "thinking"
  | "openCamera"
  | "describeScene"
  | "readText"
  | "emergency"
  | "emergencySent"
  | "settings"
  | "noText"
  | "permissionMic"
  | "permissionCamera"
  | "notUnderstood"
  | "switchedLanguage";

export const PHRASES: Record<Phrase, Record<Language, string>> = {
  welcome: {
    en: "Welcome to IntelliGlass AI.",
    am: "ወደ IntelliGlass AI እንኳን በደህና መጡ።",
    om: "Baga gara IntelliGlass AI dhuftan.",
  },
  chooseLanguage: {
    en: "Please choose your language. Tap once for English, twice for Amharic, three times for Afaan Oromo.",
    am: "እባክዎ ቋንቋዎን ይምረጡ።",
    om: "Maaloo afaan kee filadhu.",
  },
  languageSet: {
    en: "English selected. Tap the large red button and ask me anything.",
    am: "አማርኛ ተመረጠ። ትልቁን ቀይ ቁልፍ ይጫኑ እና ይጠይቁኝ።",
    om: "Afaan Oromoo filatame. Qabduu diimaa guddaa tuqi gaaffii kee gaafadhu.",
  },
  tapToSpeak: {
    en: "Tap to speak",
    am: "ለመናገር ይጫኑ",
    om: "Dubbachuuf tuqi",
  },
  listening: {
    en: "Listening",
    am: "በመስማት ላይ",
    om: "Dhaggeeffachaa jira",
  },
  thinking: {
    en: "Thinking",
    am: "በማሰብ ላይ",
    om: "Yaadaa jira",
  },
  openCamera: {
    en: "Camera",
    am: "ካሜራ",
    om: "Kaameraa",
  },
  describeScene: {
    en: "What is in front of me",
    am: "ፊቴ ላይ ያለው ምንድነው",
    om: "Fuula koo dura maaltu jira",
  },
  readText: {
    en: "Read this text",
    am: "ይህን ጽሑፍ አንብብ",
    om: "Barreeffama kana dubbisi",
  },
  emergency: {
    en: "Emergency",
    am: "አደጋ",
    om: "Balaa",
  },
  emergencySent: {
    en: "Emergency message ready. Confirm to send.",
    am: "የአደጋ መልዕክት ዝግጁ ነው። ለመላክ ያረጋግጡ።",
    om: "Ergaan balaa qophii dha. Ergaaf mirkaneessi.",
  },
  settings: {
    en: "Settings",
    am: "ማስተካከያ",
    om: "Sajoo",
  },
  noText: {
    en: "I cannot find any readable text.",
    am: "የሚነበብ ጽሑፍ ማግኘት አልቻልኩም።",
    om: "Barreeffama dubbifamu hin argine.",
  },
  permissionMic: {
    en: "Please allow microphone access to use voice.",
    am: "ድምፅን ለመጠቀም ማይክሮፎን ይፍቀዱ።",
    om: "Sagalee fayyadamuuf maaykiroofoonii hayyami.",
  },
  permissionCamera: {
    en: "Please allow camera access.",
    am: "የካሜራ መዳረሻን ይፍቀዱ።",
    om: "Hayyama kaameraa kenni.",
  },
  notUnderstood: {
    en: "I did not catch that. Please try again.",
    am: "አልሰማሁም። እባክዎ እንደገና ይሞክሩ።",
    om: "Hin hubadhu. Maaloo irra deebiʼi.",
  },
  switchedLanguage: {
    en: "Switched to English.",
    am: "ወደ አማርኛ ተቀይሯል።",
    om: "Gara Afaan Oromootti jijjiirame.",
  },
};

export function t(p: Phrase, lang: Language) {
  return PHRASES[p][lang];
}
