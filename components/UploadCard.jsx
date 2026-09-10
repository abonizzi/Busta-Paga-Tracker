"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, CheckCircle2, XCircle, Lock } from "lucide-react";
import Link from "next/link";
import { mapParsedToRow } from "@/lib/mapPayslip";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadCard({ client, connected, onUploaded }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!connected || !client) {
      setStatus("error");
      setMessage("Collega prima Supabase dalle Impostazioni per poter salvare le buste paga.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setStatus("loading");
    setMessage("Estrazione dati in corso con l'AI…");

    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type || "application/pdf";

      // 1. Estrazione dati tramite l'endpoint server (chiave Gemini segreta)
      const res = await fetch("/api/parse-payslip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64: base64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(`Estrazione AI fallita: ${data.error || "errore sconosciuto"}`);
      }

      // 2. Upload del file originale nel bucket privato "payslips" su Supabase
      setMessage("Salvataggio del file su Supabase…");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${Date.now()}_${safeName}`;

      const { error: uploadError } = await client.storage
        .from("payslips")
        .upload(storagePath, file, { contentType: mediaType, upsert: false });

      if (uploadError) {
        throw new Error(`Salvataggio file fallito: ${uploadError.message}`);
      }

      // 3. Insert della riga con i dati estratti
      setMessage("Sincronizzazione dei dati…");
      const row = mapParsedToRow(data.parsed, { filePath: storagePath, fileName: file.name });

      const { data: inserted, error: insertError } = await client
        .from("payslips")
        .insert(row)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Sincronizzazione dati fallita: ${insertError.message}`);
      }

      setStatus("success");
      setMessage("Busta paga caricata, analizzata e sincronizzata.");
      onUploaded?.(inserted);
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Errore imprevisto.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    }
  }

  if (!connected) {
    return (
      <div className="rounded-2xl border border-base-700 bg-base-900 p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-base-800 flex items-center justify-center shrink-0">
          <Lock className="h-4 w-4 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0 text-sm">
          <p className="font-medium">Sincronizzazione non collegata</p>
          <p className="text-slate-500 text-xs mt-0.5">
            Collega Supabase per iniziare a caricare le buste paga.
          </p>
        </div>
        <Link
          href="/settings"
          className="text-xs font-medium text-accent-soft border border-accent/30 rounded-full px-3 py-1.5 shrink-0"
        >
          Collega
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-base-700 bg-base-900 p-4">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={handleFile}
        className="hidden"
        id="payslip-upload"
      />
      <label
        htmlFor="payslip-upload"
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-base-600 py-8 px-4 text-center active:scale-[0.99] transition cursor-pointer"
      >
        {status === "loading" ? (
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        ) : status === "success" ? (
          <CheckCircle2 className="h-8 w-8 text-good" />
        ) : status === "error" ? (
          <XCircle className="h-8 w-8 text-bad" />
        ) : (
          <UploadCloud className="h-8 w-8 text-accent" />
        )}

        <span className="font-medium">
          {status === "idle" && "Carica busta paga"}
          {status === "loading" && "Analisi in corso…"}
          {status === "success" && "Fatto!"}
          {status === "error" && "Errore"}
        </span>
        <span className="text-sm text-slate-400">
          {message || "PDF o foto dal rullino · tocca per selezionare"}
        </span>
      </label>
    </div>
  );
}
