"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import {
  getEffectiveSupabaseConfig,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  getStoredLayoutPref,
  saveStoredLayoutPref,
} from "@/lib/settingsStore";

const SettingsContext = createContext(null);

// Traduce gli errori tecnici di Supabase in messaggi comprensibili, così
// l'utente capisce SUBITO cosa non va durante il collegamento.
function describeSupabaseError(err) {
  const msg = (err?.message || "").toLowerCase();

  if (err?.name === "TypeError" || msg.includes("failed to fetch")) {
    return "URL non raggiungibile. Controlla di aver copiato l'indirizzo del progetto da Supabase (Project Settings > API) senza spazi o refusi.";
  }
  if (msg.includes("invalid api key") || msg.includes("invalid apikey")) {
    return "Chiave anon non valida. Ricontrolla di aver copiato la chiave 'anon public' e non un'altra.";
  }
  if (err?.code === "42P01" || msg.includes("does not exist")) {
    return "Tabella 'payslips' non trovata. Hai eseguito lo script schema.sql nel tuo progetto Supabase?";
  }
  if (
    err?.code === "42501" ||
    msg.includes("row-level security") ||
    msg.includes("permission denied")
  ) {
    return "Permessi insufficienti (Row Level Security). Assicurati di aver eseguito la versione più recente di schema.sql, che abilita l'accesso con la chiave anon.";
  }
  if (msg.includes("invalid url") || msg.includes("is not a valid url")) {
    return "L'indirizzo inserito non è un URL valido. Deve essere del tipo https://xxxxx.supabase.co";
  }
  return err?.message || "Errore sconosciuto durante il collegamento.";
}

export function SettingsProvider({ children }) {
  const [config, setConfig] = useState(null); // { url, anonKey, source }
  const [status, setStatus] = useState("checking"); // checking | connected | disconnected | error
  const [statusMessage, setStatusMessage] = useState("");
  const [layoutPref, setLayoutPrefState] = useState("auto"); // auto | mobile | desktop
  const [client, setClient] = useState(null);

  const testConnection = useCallback(async (cfg) => {
    if (!cfg?.url || !cfg?.anonKey) {
      setStatus("disconnected");
      setStatusMessage("Nessuna configurazione Supabase impostata.");
      setClient(null);
      return { ok: false };
    }

    setStatus("checking");
    setStatusMessage("Verifica della connessione in corso…");

    try {
      const supabaseClient = createSupabaseBrowserClient(cfg.url, cfg.anonKey);
      const { error } = await supabaseClient
        .from("payslips")
        .select("id")
        .limit(1);

      if (error) {
        setStatus("error");
        setStatusMessage(describeSupabaseError(error));
        setClient(null);
        return { ok: false, error };
      }

      setStatus("connected");
      setStatusMessage(
        cfg.source === "env"
          ? "Connesso tramite le variabili d'ambiente configurate su Netlify."
          : "Connesso e sincronizzato con il tuo progetto Supabase."
      );
      setClient(supabaseClient);
      return { ok: true };
    } catch (err) {
      setStatus("error");
      setStatusMessage(describeSupabaseError(err));
      setClient(null);
      return { ok: false, error: err };
    }
  }, []);

  // Al primo avvio: carica config da localStorage/env e testa subito.
  useEffect(() => {
    const initial = getEffectiveSupabaseConfig();
    setConfig(initial);
    setLayoutPrefState(getStoredLayoutPref());
    testConnection(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = useCallback(
    async ({ url, anonKey }) => {
      const trimmedUrl = (url || "").trim().replace(/\/+$/, "");
      const trimmedKey = (anonKey || "").trim();
      const cfg = { url: trimmedUrl, anonKey: trimmedKey, source: "settings" };

      const result = await testConnection(cfg);
      if (result.ok) {
        saveStoredSupabaseConfig({ url: trimmedUrl, anonKey: trimmedKey });
        setConfig(cfg);
      }
      return result;
    },
    [testConnection]
  );

  const disconnect = useCallback(() => {
    clearStoredSupabaseConfig();
    const fallback = getEffectiveSupabaseConfig(); // può tornare quella da env, se presente
    setConfig(fallback);
    if (fallback) {
      testConnection(fallback);
    } else {
      setStatus("disconnected");
      setStatusMessage("Disconnesso. Nessuna sincronizzazione attiva.");
      setClient(null);
    }
  }, [testConnection]);

  const retry = useCallback(() => {
    if (config) testConnection(config);
  }, [config, testConnection]);

  const setLayoutPref = useCallback((pref) => {
    setLayoutPrefState(pref);
    saveStoredLayoutPref(pref);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        config,
        status, // checking | connected | disconnected | error
        statusMessage,
        client, // istanza Supabase pronta all'uso, o null se non connesso
        connect,
        disconnect,
        retry,
        layoutPref,
        setLayoutPref,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings deve essere usato dentro <SettingsProvider>");
  }
  return ctx;
}
