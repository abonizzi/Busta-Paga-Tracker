"use client";

import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, CheckCircle2, XCircle, Lock } from "lucide-react";
import Link from "next/link";
import { mapParsedToRow } from "@/lib/mapPayslip";
import { usePayslips } from "@/context/PayslipsContext";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadCard({ client, connected }) {
  const { addPayslip } = usePayslips();
  const pdfInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(null); // { total, done, currentName }

  // Elabora un singolo file: estrazione AI, upload su Storage, insert su DB.
  async function processSingleFile(file) {
    const base64 = await fileToBase64(file);
    const mediaType = file.type || "application/pdf";

    const res = await fetch("/api/parse-payslip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileBase64: base64, mediaType }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "estrazione AI fallita");
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${Date.now()}_${safeName}`;

    const { error: uploadError } = await client.storage
      .from("payslips")
      .upload(storagePath, file, { contentType: mediaType, upsert: false });
    if (uploadError) throw new Error(`salvataggio file fallito: ${uploadError.message}`);

    const row = mapParsedToRow(data.parsed, {
      filePath: storagePath,
      fileName: file.name,
      fileType: mediaType,
    });

    const { data: inserted, error: insertError } = await client
      .from("payslips")
      .insert(row)
      .select()
      .single();
    if (insertError) throw new Error(`sincronizzazione dati fallita: ${insertError.message}`);

    addPayslip(inserted);
  }

  async function handleFiles(e, inputRef) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!connected || !client) {
      setStatus("error");
      setMessage("Collega prima Supabase dalle Impostazioni per poter salvare le buste paga.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setStatus("loading");
    setProgress({ total: files.length, done: 0, currentName: files[0].name });

    const errori = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress((p) => ({ ...p, currentName: file.name }));
      try {
        await processSingleFile(file);
      } catch (err) {
        errori.push({ name: file.name, message: err.message });
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    const successi = files.length - errori.length;
    if (errori.length === 0) {
      setStatus("success");
      setMessage(
        files.length === 1
          ? "Busta paga caricata, analizzata e sincronizzata."
          : `${files.length} buste paga caricate e sincronizzate.`
      );
    } else if (successi === 0) {
      setStatus("error");
      setMessage(`Nessun file caricato. Errore su ${errori.map((e) => e.name).join(", ")}.`);
    } else {
      setStatus("error");
      setMessage(
        `${successi} di ${files.length} caricate. Errore su: ${errori.map((e) => e.name).join(", ")}.`
      );
    }

    if (inputRef.current) inputRef.current.value = "";
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
      setProgress(null);
    }, 6000);
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

  if (status !== "idle") {
    const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className="rounded-2xl border border-base-700 bg-base-900 p-4">
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-base-600 py-8 px-4 text-center">
          {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-accent" />}
          {status === "success" && <CheckCircle2 className="h-8 w-8 text-good" />}
          {status === "error" && <XCircle className="h-8 w-8 text-bad" />}

          {status === "loading" && progress && progress.total > 1 ? (
            <>
              <span className="font-medium">
                Elaborazione {progress.done + 1} di {progress.total}
              </span>
              <span className="text-sm text-slate-400 truncate max-w-full">{progress.currentName}</span>
              <div className="w-full h-1.5 rounded-full bg-base-700 overflow-hidden mt-1">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <span className="font-medium">
                {status === "loading" && "Analisi in corso…"}
                {status === "success" && "Fatto!"}
                {status === "error" && "Errore"}
              </span>
              <span className="text-sm text-slate-400">{message}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-base-700 bg-base-900 p-4">
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={(e) => handleFiles(e, pdfInputRef)}
        className="hidden"
        id="payslip-upload-pdf"
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e, photoInputRef)}
        className="hidden"
        id="payslip-upload-photo"
      />

      <p className="text-sm font-medium text-slate-300 mb-1 text-center">Carica busta paga</p>
      <p className="text-xs text-slate-500 mb-3 text-center">Puoi selezionare più file insieme</p>

      <div className="grid grid-cols-2 gap-3">
        <label
          htmlFor="payslip-upload-pdf"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-base-600 py-6 px-3 text-center active:scale-[0.99] transition cursor-pointer"
        >
          <FileText className="h-7 w-7 text-accent" />
          <span className="font-medium text-sm">File PDF</span>
          <span className="text-xs text-slate-400">Anche più di uno</span>
        </label>

        <label
          htmlFor="payslip-upload-photo"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-base-600 py-6 px-3 text-center active:scale-[0.99] transition cursor-pointer"
        >
          <ImageIcon className="h-7 w-7 text-accent" />
          <span className="font-medium text-sm">Foto</span>
          <span className="text-xs text-slate-400">Anche più di una</span>
        </label>
      </div>
    </div>
  );
}
