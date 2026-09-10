// Tutte le funzioni qui sotto toccano localStorage, quindi vanno chiamate
// solo lato client (mai durante il render server di Next.js).

const CONN_KEY = "buste-paga:supabase-config";
const LAYOUT_KEY = "buste-paga:layout-pref";

export function getStoredSupabaseConfig() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.url || !parsed?.anonKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredSupabaseConfig(config) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONN_KEY, JSON.stringify(config));
}

export function clearStoredSupabaseConfig() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CONN_KEY);
}

// Config "effettiva": priorità a quanto configurato manualmente nelle
// Impostazioni, altrimenti fallback alle variabili d'ambiente pubbliche
// impostate in fase di deploy (utile per chi vuole un'app mono-utente
// senza passare dalla schermata Impostazioni).
export function getEffectiveSupabaseConfig() {
  const stored = getStoredSupabaseConfig();
  if (stored) return { ...stored, source: "settings" };

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, source: "env" };
  }

  return null;
}

export function getStoredLayoutPref() {
  if (typeof window === "undefined") return "auto";
  return window.localStorage.getItem(LAYOUT_KEY) || "auto";
}

export function saveStoredLayoutPref(pref) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAYOUT_KEY, pref);
}
