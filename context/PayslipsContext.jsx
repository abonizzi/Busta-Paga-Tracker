"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useSettings } from "./SettingsContext";
import { getStoredYear, saveStoredYear } from "@/lib/settingsStore";

const PayslipsContext = createContext(null);

export function PayslipsProvider({ children }) {
  const { client, status } = useSettings();
  const [allPayslips, setAllPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYearState] = useState("all");
  const [yearInitialized, setYearInitialized] = useState(false);

  const reload = useCallback(async () => {
    if (!client) {
      setAllPayslips([]);
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

      if (!error) setAllPayslips(data || []);
    } catch (err) {
      console.error("Errore nel caricamento delle buste paga:", err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Anni disponibili tra le buste caricate, dal più recente al più vecchio.
  const years = useMemo(() => {
    const set = new Set(allPayslips.map((p) => p.anno).filter((y) => y != null));
    return [...set].sort((a, b) => b - a);
  }, [allPayslips]);

  // Al primo caricamento dei dati sceglie l'anno di default: quello salvato
  // sul dispositivo se ancora valido, altrimenti l'anno più recente disponibile.
  useEffect(() => {
    if (yearInitialized || years.length === 0) return;
    const stored = getStoredYear();
    if (stored === "all" || (typeof stored === "number" && years.includes(stored))) {
      setSelectedYearState(stored);
    } else {
      setSelectedYearState(years[0]);
    }
    setYearInitialized(true);
  }, [years, yearInitialized]);

  function setSelectedYear(year) {
    setSelectedYearState(year);
    saveStoredYear(year);
  }

  // Le buste paga già filtrate per l'anno selezionato: tutte le schermate
  // dell'app leggono questa lista, quindi si aggiornano automaticamente.
  const payslips = useMemo(() => {
    if (selectedYear === "all") return allPayslips;
    return allPayslips.filter((p) => p.anno === selectedYear);
  }, [allPayslips, selectedYear]);

  function addPayslip(nuova) {
    setAllPayslips((prev) => [...prev, nuova]);
    // Se la nuova busta è di un anno diverso da quello selezionato, passa
    // automaticamente a quell'anno così la vedi subito.
    if (nuova?.anno && selectedYear !== "all" && nuova.anno !== selectedYear) {
      setSelectedYear(nuova.anno);
    }
  }

  async function deletePayslip(payslip) {
    if (!client || !payslip?.id) {
      return { ok: false, error: "Sincronizzazione non collegata." };
    }
    try {
      if (payslip.file_path) {
        await client.storage.from("payslips").remove([payslip.file_path]);
      }

      const { error } = await client.from("payslips").delete().eq("id", payslip.id);
      if (error) throw error;

      setAllPayslips((prev) => prev.filter((p) => p.id !== payslip.id));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || "Errore sconosciuto durante la cancellazione." };
    }
  }

  return (
    <PayslipsContext.Provider
      value={{
        payslips, // già filtrate per l'anno selezionato
        allPayslips, // tutte, non filtrate (usate raramente)
        years,
        selectedYear,
        setSelectedYear,
        loading,
        reload,
        addPayslip,
        deletePayslip,
        connected: status === "connected",
      }}
    >
      {children}
    </PayslipsContext.Provider>
  );
}

export function usePayslips() {
  const ctx = useContext(PayslipsContext);
  if (!ctx) {
    throw new Error("usePayslips deve essere usato dentro <PayslipsProvider>");
  }
  return ctx;
}
