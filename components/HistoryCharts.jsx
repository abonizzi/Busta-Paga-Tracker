"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { periodoLabel, formatEuro, formatOre } from "@/lib/format";

const TOOLTIP_STYLE = {
  backgroundColor: "#0f141b",
  border: "1px solid #2a3441",
  borderRadius: 8,
  fontSize: 12,
};

export default function HistoryCharts({ payslips, gridClassName = "grid-cols-1 gap-4" }) {
  if (!payslips || payslips.length === 0) return null;

  const nettoLordoData = payslips.map((p) => ({
    periodo: periodoLabel(p),
    Netto: p.netto_in_busta,
    Lordo: p.lordo_totale,
  }));

  const ultima = payslips[payslips.length - 1];
  const rateiData = [
    {
      voce: "Ferie",
      Maturato: ultima.saldi_ferie?.maturato_ore ?? 0,
      Goduto: ultima.saldi_ferie?.goduto_ore ?? 0,
      Saldo: ultima.saldi_ferie?.saldo_ore ?? 0,
    },
    {
      voce: "ROL/PAR",
      Maturato: ultima.saldi_rol_par?.maturato_ore ?? 0,
      Goduto: ultima.saldi_rol_par?.goduto_ore ?? 0,
      Saldo: ultima.saldi_rol_par?.saldo_ore ?? 0,
    },
    {
      voce: "Banca ore",
      Maturato: ultima.saldi_flessibilita?.maturato_ore ?? 0,
      Goduto: ultima.saldi_flessibilita?.goduto_ore ?? 0,
      Saldo: ultima.saldi_flessibilita?.saldo_ore ?? 0,
    },
  ];

  return (
    <div className={`grid ${gridClassName}`}>
      <div className="rounded-2xl border border-base-700 bg-base-900 p-3">
        <h3 className="text-sm font-medium text-slate-300 mb-2 px-1">
          Andamento Netto vs Lordo
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={nettoLordoData} margin={{ left: -20, right: 10 }}>
            <CartesianGrid stroke="#1c2430" vertical={false} />
            <XAxis dataKey="periodo" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => formatEuro(value)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Lordo" stroke="#67e8f9" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Netto" stroke="#34d399" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-base-700 bg-base-900 p-3">
        <h3 className="text-sm font-medium text-slate-300 mb-2 px-1">
          Ratei: Maturato vs Goduto vs Saldo (ultima busta)
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rateiData} margin={{ left: -20, right: 10 }}>
            <CartesianGrid stroke="#1c2430" vertical={false} />
            <XAxis dataKey="voce" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => formatOre(value)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Maturato" fill="#67e8f9" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Goduto" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Saldo" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
