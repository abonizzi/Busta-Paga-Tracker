"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  CloudOff,
  RefreshCw,
  Unplug,
  Monitor,
  Smartphone,
  WandSparkles,
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import InstallAppButton from "@/components/InstallAppButton";

const STATUS_META = {
  checking: { icon: RefreshCw, className: "text-slate-300 bg-base-850 border-base-700", spin: true },
  connected: { icon: CheckCircle2, className: "text-good bg-good/10 border-good/30" },
  disconnected: { icon: CloudOff, className: "text-slate-300 bg-base-850 border-base-700" },
  error: { icon: AlertTriangle, className: "text-bad bg-bad/10 border-bad/30" },
};

function StatusBanner() {
  const { status, statusMessage, retry } = useSettings();
  const meta = STATUS_META[status] || STATUS_META.disconnected;
  const Icon = meta.icon;

  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${meta.className}`}>
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${meta.spin ? "animate-spin" : ""}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">
          {status === "connected" && "Sincronizzato"}
          {status === "checking" && "Verifica in corso…"}
          {status === "disconnected" && "Non collegato"}
          {status === "error" && "Errore di sincronizzazione"}
        </p>
        <p className="text-sm opacity-90 mt-0.5">{statusMessage}</p>
      </div>
      {status !== "checking" && (
        <button
          onClick={retry}
          className="text-xs underline opacity-80 shrink-0"
        >
          Riprova
        </button>
      )}
    </div>
  );
}

function SupabaseForm() {
  const { config, connect, disconnect, status } = useSettings();
  const [url, setUrl] = useState(config?.url || "");
  const [anonKey, setAnonKey] = useState(config?.anonKey || "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await connect({ url, anonKey });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Project URL Supabase</label>
        <input
          type="url"
          required
          placeholder="https://xxxxxxxx.supabase.co"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-xl bg-base-850 border border-base-700 px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Chiave anon public</label>
        <input
          type="password"
          required
          placeholder="eyJhbGciOi..."
          value={anonKey}
          onChange={(e) => setAnonKey(e.target.value)}
          className="w-full rounded-xl bg-base-850 border border-base-700 px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
        />
        <p className="text-xs text-slate-500 mt-1">
          Si trova su Supabase in Project Settings → API. Usa solo la chiave{" "}
          <b>anon public</b>, mai la service_role.
        </p>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          disabled={submitting || status === "checking"}
          className="flex-1 rounded-xl bg-accent text-base-950 font-medium py-2.5 disabled:opacity-50"
        >
          {submitting ? "Verifica…" : "Collega e sincronizza"}
        </button>
        {config?.source === "settings" && (
          <button
            type="button"
            onClick={disconnect}
            className="rounded-xl border border-base-700 px-3 flex items-center gap-1.5 text-sm text-slate-300"
          >
            <Unplug className="h-4 w-4" /> Scollega
          </button>
        )}
      </div>
    </form>
  );
}

function LayoutPrefSelector() {
  const { layoutPref, setLayoutPref } = useSettings();

  const options = [
    { id: "auto", label: "Automatico", icon: WandSparkles, hint: "Si adatta allo schermo" },
    { id: "mobile", label: "Mobile", icon: Smartphone, hint: "Layout compatto" },
    { id: "desktop", label: "Desktop", icon: Monitor, hint: "Layout esteso" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = layoutPref === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setLayoutPref(opt.id)}
            className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition ${
              active
                ? "border-accent bg-accent/10 text-accent-soft"
                : "border-base-700 bg-base-850 text-slate-400"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  return (
    <main className="max-w-md sm:max-w-2xl lg:max-w-2xl mx-auto px-4 pb-24 pt-6 flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <Link href="/" className="p-2 -ml-2 rounded-full active:bg-base-800">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Impostazioni</h1>
      </header>

      <Section
        title="Sincronizzazione Supabase"
        description="Collega il tuo progetto Supabase per salvare e sincronizzare le buste paga tra più dispositivi (telefono, computer, ecc.). Basta inserire le stesse chiavi su ogni dispositivo."
      >
        <StatusBanner />
        <SupabaseForm />
      </Section>

      <Section
        title="Aspetto"
        description="Scegli come vuoi visualizzare la dashboard su questo dispositivo."
      >
        <LayoutPrefSelector />
      </Section>

      <Section
        title="Installazione"
        description="Installa l'app sulla schermata Home per usarla come un'app nativa, senza barra del browser."
      >
        <InstallAppButton />
      </Section>
    </main>
  );
}
