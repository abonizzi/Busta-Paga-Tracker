import { createClient } from "@supabase/supabase-js";

// L'app ora parla con Supabase SEMPRE dal browser (client-side), usando la
// ANON KEY, sia che questa provenga dalle Impostazioni (localStorage, utile
// per sincronizzare più dispositivi sullo stesso progetto Supabase) sia che
// provenga dalle variabili d'ambiente NEXT_PUBLIC_* impostate in fase di
// deploy (comodo per un'app mono-utente senza passare da Impostazioni).
//
// Questo è sicuro perché la ANON KEY è pensata per essere pubblica: la
// protezione reale dei dati va garantita via Row Level Security su
// Supabase. Nello schema.sql incluso in questo progetto la RLS è aperta in
// lettura/scrittura per semplicità mono-utente: chiunque conosca URL + anon
// key può leggere/scrivere i dati. Va bene per un uso personale o
// familiare, ma NON condividere pubblicamente queste due informazioni.
//
// L'endpoint API server-side (/api/parse-payslip) NON tocca più Supabase:
// si occupa solo di inviare il file a Claude e restituire il JSON estratto.
// Il salvataggio (upload file + insert riga) avviene lato client, con il
// client creato qui sotto.

let cachedClient = null;
let cachedKey = null;

export function createSupabaseBrowserClient(url, anonKey) {
  if (!url || !anonKey) {
    throw new Error("URL o chiave anon Supabase mancanti.");
  }

  const cacheId = `${url}::${anonKey}`;
  if (cachedClient && cachedKey === cacheId) {
    return cachedClient;
  }

  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  cachedKey = cacheId;
  return cachedClient;
}
