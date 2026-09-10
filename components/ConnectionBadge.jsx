"use client";

import Link from "next/link";
import { CheckCircle2, CloudOff, AlertTriangle, RefreshCw } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const STATUS_MAP = {
  checking: {
    icon: RefreshCw,
    label: "Verifica…",
    className: "text-slate-400 border-base-700 bg-base-850",
    spin: true,
  },
  connected: {
    icon: CheckCircle2,
    label: "Sincronizzato",
    className: "text-good border-good/30 bg-good/10",
  },
  disconnected: {
    icon: CloudOff,
    label: "Non collegato",
    className: "text-slate-400 border-base-700 bg-base-850",
  },
  error: {
    icon: AlertTriangle,
    label: "Errore sync",
    className: "text-bad border-bad/30 bg-bad/10",
  },
};

export default function ConnectionBadge() {
  const { status } = useSettings();
  const meta = STATUS_MAP[status] || STATUS_MAP.disconnected;
  const Icon = meta.icon;

  return (
    <Link
      href="/settings"
      className={`flex items-center gap-1.5 text-xs font-medium rounded-full border px-2.5 py-1 ${meta.className}`}
    >
      <Icon className={`h-3.5 w-3.5 ${meta.spin ? "animate-spin" : ""}`} />
      {meta.label}
    </Link>
  );
}
