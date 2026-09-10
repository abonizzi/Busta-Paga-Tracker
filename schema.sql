-- ============================================================
-- SCHEMA SUPABASE: Dashboard Buste Paga
-- Incolla questo intero script nell'SQL Editor di Supabase
-- (Project > SQL Editor > New query) ed esegui "Run".
-- ============================================================

-- Estensione per generare UUID
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabella principale: una riga per ogni busta paga caricata
-- ------------------------------------------------------------
create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Riferimento al file originale in Storage
  file_path text,
  file_name text,

  -- Periodo
  mese integer,
  anno integer,

  -- Dati contrattuali
  ccnl text,
  livello text,
  paga_oraria numeric,
  ore_ordinarie_mese numeric,
  giorni_lavorati numeric,

  -- Retribuzione fissa
  minimo_tabellare numeric,
  scatti_anzianita numeric,
  indennita_mansione numeric,
  indennita_mensa numeric,
  totale_lordo_fisso numeric,

  -- Voci variabili (array di oggetti {descrizione, importo_lordo})
  voci_variabili jsonb default '[]'::jsonb,

  -- Welfare / ticket
  giorni_ticket numeric,
  valore_unitario_ticket numeric,
  totale_ticket numeric,

  -- Previdenza e fisco
  imponibile_inps numeric,
  contributi_inps numeric,
  imponibile_irpef numeric,
  irpef_lorda numeric,
  detrazioni_lavoro_dipendente numeric,
  ulteriori_detrazioni numeric,
  irpef_netta numeric,
  addizionale_regionale numeric,
  addizionale_comunale numeric,
  totale_trattenute numeric,

  -- Totali
  lordo_totale numeric,
  netto_in_busta numeric,

  -- Saldi orari e ratei (salvati come jsonb per flessibilità)
  saldi_ferie jsonb default '{}'::jsonb,
  saldi_rol_par jsonb default '{}'::jsonb,
  saldi_flessibilita jsonb default '{}'::jsonb,

  -- Progressivi e TFR
  imponibile_inps_progressivo numeric,
  imponibile_irpef_progressivo numeric,
  irpef_pagata_progressiva numeric,
  retribuzione_utile_tfr numeric,
  tfr_trasferito_fondo numeric,

  -- JSON completo così come restituito da Claude, per audit/debug
  dati_completi jsonb
);

-- Indice utile per ordinare/filtrare per periodo
create index if not exists payslips_periodo_idx
  on public.payslips (anno desc, mese desc);

-- ------------------------------------------------------------
-- Row Level Security
--
-- ATTENZIONE - modello di sicurezza "personale/familiare":
-- Questa app parla con Supabase direttamente dal browser usando la
-- ANON KEY (niente server, niente login), per permettere di collegare
-- più dispositivi allo stesso progetto Supabase semplicemente inserendo
-- URL + anon key nelle Impostazioni dell'app.
--
-- Per farlo funzionare, le policy qui sotto APRONO lettura e scrittura a
-- chiunque possieda URL + anon key del tuo progetto. Va bene per uso
-- personale o familiare, ma:
--   - NON pubblicare mai URL e anon key in luoghi pubblici (repo pubblici,
--     screenshot, chat pubbliche, ecc.);
--   - se in futuro vuoi condividere l'app con persone non fidate, aggiungi
--     Supabase Auth (login) e una colonna user_id con policy per-utente al
--     posto di quelle "using (true)" qui sotto.
-- ------------------------------------------------------------
alter table public.payslips enable row level security;

drop policy if exists "Nessun accesso diretto dal client" on public.payslips;
drop policy if exists "Accesso anon in lettura" on public.payslips;
drop policy if exists "Accesso anon in scrittura" on public.payslips;

create policy "Accesso anon in lettura"
  on public.payslips
  for select
  using (true);

create policy "Accesso anon in scrittura"
  on public.payslips
  for insert
  with check (true);

-- ------------------------------------------------------------
-- Storage: bucket privato per i file originali (PDF/immagini)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('payslips', 'payslips', false)
on conflict (id) do nothing;

drop policy if exists "Nessun accesso diretto al bucket payslips" on storage.objects;
drop policy if exists "Upload anon bucket payslips" on storage.objects;
drop policy if exists "Lettura anon bucket payslips" on storage.objects;

create policy "Upload anon bucket payslips"
  on storage.objects
  for insert
  with check (bucket_id = 'payslips');

create policy "Lettura anon bucket payslips"
  on storage.objects
  for select
  using (bucket_id = 'payslips');

-- Nota: upload e lettura avvengono ora direttamente dal browser con la
-- ANON KEY inserita nelle Impostazioni dell'app (o nelle variabili
-- d'ambiente NEXT_PUBLIC_* se preferisci un deploy mono-utente senza
-- passare da Impostazioni).
