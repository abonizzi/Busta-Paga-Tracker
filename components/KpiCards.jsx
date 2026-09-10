"use client";

import { Wallet, TrendingUp, Palmtree, CalendarClock, Clock3 } from "lucide-react";
import { formatEuro, formatOre, formatGiorni } from "@/lib/format";

function Kpi({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-base-700 bg-base-900 p-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className={`h-4 w-4 ${accent || "text-accent"}`} />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-xl font-semibold truncate">{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}

export default function KpiCards({ payslips, gridClassName = "grid-cols-2 gap-3" }) {
  if (!payslips || payslips.length === 0) return null;

  const ultima = payslips[payslips.length - 1];
  const nettoMedio =
    payslips.reduce((sum, p) => sum + (p.netto_in_busta || 0), 0) / payslips.length;

  const saldoFerieOre = ultima.saldi_ferie?.saldo_ore ?? null;
  const saldoRolOre = ultima.saldi_rol_par?.saldo_ore ?? null;
  const flessMaturato = ultima.saldi_flessibilita?.maturato_ore ?? null;
  const flessGoduto = ultima.saldi_flessibilita?.goduto_ore ?? null;

  return (
    <div className={`grid ${gridClassName}`}>
      <Kpi
        icon={Wallet}
        label="Ultimo netto"
        value={formatEuro(ultima.netto_in_busta)}
        sub={ultima.mese && ultima.anno ? `${ultima.mese}/${ultima.anno}` : null}
      />
      <Kpi
        icon={TrendingUp}
        label="Netto medio"
        value={formatEuro(nettoMedio)}
        sub={`su ${payslips.length} bust${payslips.length === 1 ? "a" : "e"}`}
        accent="text-good"
      />
      <Kpi
        icon={Palmtree}
        label="Ferie residue"
        value={formatOre(saldoFerieOre)}
        sub={formatGiorni(saldoFerieOre)}
        accent="text-warn"
      />
      <Kpi
        icon={CalendarClock}
        label="ROL / PAR residui"
        value={formatOre(saldoRolOre)}
        sub={formatGiorni(saldoRolOre)}
        accent="text-warn"
      />
      <Kpi
        icon={Clock3}
        label="Banca ore maturate"
        value={formatOre(flessMaturato)}
        sub={`Godute: ${formatOre(flessGoduto)}`}
        accent="text-accent-soft"
      />
    </div>
  );
}
