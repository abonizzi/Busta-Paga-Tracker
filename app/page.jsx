"use client";

import { Wallet, TrendingUp, Coins, ReceiptText } from "lucide-react";
import UploadCard from "@/components/UploadCard";
import StatCard from "@/components/StatCard";
import NettoLordoChart from "@/components/charts/NettoLordoChart";
import HistoryTable from "@/components/HistoryTable";
import DetailModal from "@/components/DetailModal";
import AppHeader from "@/components/AppHeader";
import EmptyYearState from "@/components/EmptyYearState";
import Link from "next/link";
import { useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { usePayslips } from "@/context/PayslipsContext";
import { formatEuro } from "@/lib/format";
import { calcLordoMedioMensile, getLatestPayslip } from "@/lib/ral";

export default function Page() {
  const { client, status } = useSettings();
  const { payslips, allPayslips, selectedYear, loading } = usePayslips();
  const [selected, setSelected] = useState(null);
  const connected = status === "connected";

  const ultima = getLatestPayslip(payslips);
  const nettoMedio =
    payslips.length > 0
      ? payslips.reduce((sum, p) => sum + (p.netto_in_busta || 0), 0) / payslips.length
      : null;
  const lordoMedio = calcLordoMedioMensile(payslips);

  return (
    <main className="max-w-md sm:max-w-2xl lg:max-w-6xl mx-auto px-4 pb-28 pt-6 flex flex-col gap-5">
      <AppHeader icon={ReceiptText} title="Buste Paga" subtitle="Dashboard personale" />

      <UploadCard client={client} connected={connected} />

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
      ) : payslips.length === 0 ? (
        <EmptyYearState hasAnyData={allPayslips.length > 0} selectedYear={selectedYear} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              icon={Wallet}
              label="Ultimo netto"
              value={formatEuro(ultima.netto_in_busta)}
              sub={ultima.mese && ultima.anno ? `${ultima.mese}/${ultima.anno}` : null}
            />
            <StatCard
              icon={TrendingUp}
              label="Netto medio"
              value={formatEuro(nettoMedio)}
              sub={`su ${payslips.length} bust${payslips.length === 1 ? "a" : "e"}`}
              accent="text-good"
            />
            <StatCard
              icon={Coins}
              label="Lordo medio mensile"
              value={formatEuro(lordoMedio)}
              sub="bonus inclusi"
              accent="text-accent-soft"
            />
          </div>

          <NettoLordoChart payslips={payslips} />

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
