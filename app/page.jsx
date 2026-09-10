"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ReceiptText, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import UploadCard from "@/components/UploadCard";
import KpiCards from "@/components/KpiCards";
import HistoryCharts from "@/components/HistoryCharts";
import HistoryTable from "@/components/HistoryTable";
import DetailModal from "@/components/DetailModal";
import ConnectionBadge from "@/components/ConnectionBadge";
import { useSettings } from "@/context/SettingsContext";

// Classi Tailwind scelte in base alla preferenza di layout impostata in
// Impostazioni: "auto" segue il viewport reale (mobile-first + breakpoint
// md/lg), "mobile"/"desktop" forzano la larghezza indipendentemente dallo
// schermo, utile ad es. per chi vuole sempre la vista compatta anche su un
// monitor grande, o viceversa.
function useLayoutClasses(layoutPref) {
  if (layoutPref === "mobile") {
    return {
      container: "max-w-md",
      kpiGrid: "grid-cols-2",
      chartsGrid: "grid-cols-1",
    };
  }
  if (layoutPref === "desktop") {
    return {
      container: "max-w-6xl",
      kpiGrid: "grid-cols-5",
      chartsGrid: "grid-cols-2",
    };
  }
  // auto
  return {
    container: "max-w-md sm:max-w-2xl lg:max-w-6xl",
    kpiGrid: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    chartsGrid: "grid-cols-1 lg:grid-cols-2",
  };
}

export default function Page() {
  const { client, status, layoutPref } = useSettings();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const layout = useLayoutClasses(layoutPref);
  const connected = status === "connected";

  const loadPayslips = useCallback(async () => {
    if (!client) {
      setPayslips([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await client
        .from("payslips")
        .select("*")
        .order("anno", { ascending: true })
        .order("mese", { ascending: true });

      if (!error) setPayslips(data || []);
    } catch (err) {
      console.error("Errore nel caricamento delle buste paga:", err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    loadPayslips();
  }, [loadPayslips]);

  function handleUploaded(nuova) {
    setPayslips((prev) => [...prev, nuova]);
  }

  return (
    <main className={`${layout.container} mx-auto px-4 pb-24 pt-6 flex flex-col gap-5 transition-all`}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <ReceiptText className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Buste Paga</h1>
            <p className="text-xs text-slate-500 leading-tight">Dashboard personale</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionBadge />
          <button
            onClick={loadPayslips}
            className="p-2 rounded-full border border-base-700 active:bg-base-800"
            aria-label="Aggiorna"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/settings"
            className="p-2 rounded-full border border-base-700 active:bg-base-800"
            aria-label="Impostazioni"
          >
            <SettingsIcon className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <UploadCard client={client} connected={connected} onUploaded={handleUploaded} />

      {!connected && payslips.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-base-700 p-8 text-center flex flex-col items-center gap-2">
          <p className="text-sm text-slate-400">
            Collega la sincronizzazione per vedere qui la tua dashboard.
          </p>
          <Link
            href="/settings"
            className="text-sm font-medium text-accent-soft border border-accent/30 rounded-full px-4 py-1.5 mt-1"
          >
            Vai alle Impostazioni
          </Link>
        </div>
      ) : loading && payslips.length === 0 ? (
        <div className="text-center text-sm text-slate-500 py-8">Caricamento storico…</div>
      ) : (
        <>
          <KpiCards payslips={payslips} gridClassName={`${layout.kpiGrid} gap-3`} />

          <HistoryCharts payslips={payslips} gridClassName={`${layout.chartsGrid} gap-4`} />

          <section>
            <h2 className="text-sm font-medium text-slate-300 mb-2 px-1">Storico buste paga</h2>
            <HistoryTable payslips={payslips} onSelect={setSelected} />
          </section>
        </>
      )}

      <DetailModal payslip={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
