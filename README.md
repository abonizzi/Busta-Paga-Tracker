# Buste Paga PWA

App installabile da smartphone (e utilizzabile anche da computer) per
caricare le buste paga (PDF o foto), estrarne automaticamente tutti i dati
con Claude e visualizzarle in una dashboard con grafici, storico e saldi di
ferie/ROL/banca ore. I dati vengono sincronizzati sul tuo progetto Supabase,
così puoi usare l'app da più dispositivi (telefono, computer, tablet) con
gli stessi dati.

## Come funziona la sincronizzazione (importante)

L'app **non ha un server con database proprio**: sei tu a collegarla al
*tuo* progetto Supabase personale, inserendo URL e chiave nella pagina
**Impostazioni** dell'app stessa (icona ingranaggio in alto a destra). Da
quel momento:

- ogni dispositivo su cui apri l'app e inserisci le stesse due informazioni
  vede e sincronizza gli stessi dati;
- l'unica parte che gira su un server è l'estrazione AI (per non esporre mai
  la chiave Gemini nel browser) — tutto il resto (upload file, storico,
  dashboard) parla direttamente con Supabase dal browser.

La pagina Impostazioni mostra sempre uno stato chiaro:
**Sincronizzato** (verde), **Non collegato** (grigio), **Errore di
sincronizzazione** (rosso, con il motivo specifico: URL sbagliato, chiave
non valida, tabella mancante, permessi insufficienti, ecc.) o **Verifica in
corso** durante il test di connessione.

> ⚠️ Nota di sicurezza: per permettere questa sincronizzazione multi-dispositivo
> senza login, lo `schema.sql` incluso apre lettura/scrittura a chiunque
> conosca URL + chiave anon del tuo progetto Supabase. Va benissimo per uso
> personale o familiare; non condividere pubblicamente queste due
> informazioni. Vedi i commenti in `schema.sql` se in futuro vuoi aggiungere
> un login vero e proprio.

## 1. Setup Supabase

1. Crea un progetto su [supabase.com](https://supabase.com) (piano gratuito va bene).
2. Vai su **SQL Editor > New query**, incolla il contenuto di `schema.sql` ed esegui **Run**.
   Questo crea la tabella `payslips` e il bucket privato `payslips` in Storage,
   con le policy che permettono l'accesso tramite chiave anon.
3. Vai su **Project Settings > API** e copia:
   - **Project URL** (tipo `https://xxxxx.supabase.co`)
   - **anon public** key

Ti serviranno per collegare l'app dalla schermata Impostazioni (vedi punto 5).

## 2. Chiave API Google Gemini (gratuita)

1. Vai su [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) e accedi con un account Google.
2. Clicca **"Create API key"** e copiala: ti servirà come variabile d'ambiente
   sul server (Netlify), perché questa deve restare sempre segreta e non va
   mai inserita nell'app dal browser.
3. L'app usa il modello `gemini-3.6-flash`, che rientra nella **fascia
   gratuita** di Google per un uso personale come questo (poche buste paga
   al mese).

   > ⚠️ **Nota sulla privacy**: con una chiave API "gratuita" (senza un
   > account con fatturazione attiva), Google può utilizzare i contenuti che
   > invii — quindi le tue buste paga, con stipendio, dati fiscali, ecc. —
   > per migliorare i propri modelli. Se preferisci che i tuoi dati non
   > vengano mai usati per l'addestramento, attiva la fatturazione su
   > [Google AI Studio](https://aistudio.google.com) (il costo resta comunque
   > minimo per questo volume di utilizzo) oppure valuta l'alternativa con
   > Claude (Anthropic), che su API a pagamento non addestra mai sui tuoi dati.

## 3. Chiave API Resend (per le Segnalazioni, gratuita)

1. Vai su [resend.com](https://resend.com) e crea un account gratuito.
2. Nel pannello, vai su **API Keys** → **Create API Key**, copiala.
3. Serve per il pulsante "Invia segnalazione" nelle Impostazioni: senza questa chiave, quel form non funziona (il resto dell'app funziona comunque normalmente).
4. Le email vengono inviate usando il mittente di test `onboarding@resend.dev`, che non richiede di verificare un dominio proprio. Se in futuro le segnalazioni finiscono in spam o smettono di arrivare, valuta di verificare un tuo dominio su Resend.

## 4. Sviluppo locale

```bash
npm install
cp .env.example .env.local   # inserisci almeno GEMINI_API_KEY
npm run dev
```

Apri `http://localhost:3000`, vai su Impostazioni e collega Supabase inserendo
URL e anon key. (Per testare la fotocamera da telefono in locale serve HTTPS:
usa il deploy su Netlify oppure un tunnel come `ngrok`.)

## 5. Deploy gratuito su Netlify

### Opzione A — da GitHub (consigliata, niente terminale)
1. Crea un repository su GitHub e carica tutti i file del progetto (anche via
   drag & drop dal browser, sezione "uploading an existing file").
2. Su [app.netlify.com](https://app.netlify.com) → **Add new site > Import an existing project** → collega GitHub e seleziona il repo.
   Netlify rileva Next.js automaticamente grazie a `netlify.toml`.
3. Prima del deploy, vai su **Site configuration > Environment variables** e aggiungi almeno:

   | Variabile | Obbligatoria? | Valore |
   |---|---|---|
   | `GEMINI_API_KEY` | Sì | la tua chiave Google Gemini |
   | `RESEND_API_KEY` | Solo per le Segnalazioni | la tua chiave Resend |
   | `NEXT_PUBLIC_SUPABASE_URL` | No (opzionale) | URL Supabase, se vuoi che sia già collegato al primo avvio |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No (opzionale) | anon key, come sopra |

   Se salti le due variabili opzionali, potrai comunque collegare Supabase in
   qualunque momento dalla pagina Impostazioni dell'app.
4. Avvia il deploy. Gli endpoint `/api/parse-payslip` e `/api/send-feedback` vengono pubblicati
   automaticamente come Netlify Function.

### Opzione B — da CLI (richiede Node.js in locale)
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set GEMINI_API_KEY xxxxxxxx...
netlify env:set RESEND_API_KEY re_xxxxxxxx...
netlify deploy --prod
```

## 6. Collegare Supabase dall'app (multi-dispositivo)

Su ogni dispositivo dove vuoi usare l'app:
1. Apri l'app → icona ingranaggio (Impostazioni).
2. Nella sezione "Sincronizzazione Supabase" incolla **Project URL** e
   **anon public key** (dal punto 1).
3. Tocca "Collega e sincronizza": l'app testa subito la connessione e mostra
   se è andata a buon fine o l'errore specifico.
4. Ripeti su ogni altro dispositivo con le stesse identiche chiavi: vedranno
   tutti gli stessi dati.

## 7. Installare l'app come web app (PWA)

Dalla pagina Impostazioni, sezione "Installazione", trovi un pulsante
"Installa l'app su questo dispositivo":
- **Android/Chrome**: il pulsante apre direttamente il prompt di installazione nativo.
- **iPhone/iPad (Safari)**: il pulsante mostra le istruzioni (Condividi → "Aggiungi a Home"), perché iOS non permette l'installazione automatica da pulsante.
- **Computer (Chrome/Edge)**: stessa cosa, l'app si installa come applicazione desktop con la sua icona.

Una volta installata, l'app si comporta come nativa (icona, schermo intero, nessuna barra del browser).

## 8. Aspetto: mobile, desktop o automatico

Sempre in Impostazioni, sezione "Aspetto", puoi scegliere:
- **Automatico** (default): la dashboard si adatta allo schermo (compatta su telefono, estesa su computer).
- **Mobile**: forza sempre il layout compatto, anche su schermi grandi.
- **Desktop**: forza sempre il layout esteso, anche su telefono.

La preferenza è salvata sul singolo dispositivo (non sincronizzata via Supabase).

## 9. Icone PWA

Il `manifest.json` referenzia `/public/icons/icon-192.png`, `icon-512.png` e
`icon-maskable-512.png`. Genera queste tre icone (logo a tua scelta) con un
tool come [realfavicongenerator.net](https://realfavicongenerator.net) o
[maskable.app](https://maskable.app/editor) e caricale in `public/icons/`
prima del deploy: senza queste immagini l'app funziona comunque, ma l'icona
sulla schermata Home userà un placeholder del browser.

## 10. Come funziona l'estrazione dati

1. Selezioni un PDF o una foto della busta paga dal telefono (o computer).
2. Il file viene convertito in Base64 e inviato a `/api/parse-payslip`
   (server), che chiama Google Gemini (`gemini-3.6-flash`) con un system
   prompt specializzato per buste paga CCNL Metalmeccanica Industria e
   restituisce il JSON estratto (dati contrattuali, retribuzione, fisco,
   ratei ferie/ROL/banca ore, progressivi/TFR).
3. Il browser carica il file originale nel bucket privato `payslips` e la
   riga con i dati estratti nella tabella `payslips`, direttamente sul tuo
   progetto Supabase, con la chiave anon configurata in Impostazioni.
4. La dashboard rilegge lo storico da Supabase e calcola KPI, grafici e dettagli.

## Struttura del progetto

```
app/
  api/parse-payslip/route.js   # SOLO estrazione AI (Gemini), nessun accesso a Supabase
  page.jsx                     # Dashboard principale
  ferie-rol/page.jsx           # Saldi Ferie/ROL + grafici
  ral/page.jsx                 # RAL reale, RAL ipotetica, paga oraria
  buoni-pasto/page.jsx         # Buoni pasto: totale, media, dettaglio mensile
  documenti/page.jsx           # Elenco file originali caricati
  settings/page.jsx            # collegamento Supabase, aspetto, installazione PWA
  layout.jsx, globals.css
components/
  Providers.jsx                 # wrapper client-side per i context
  AppHeader.jsx                  # header riutilizzabile (titolo, sync, refresh, impostazioni)
  BottomNav.jsx                   # barra di navigazione in basso
  StatCard.jsx                    # casella KPI riutilizzabile
  InfoSection.jsx                  # blocchi Section/Row per i dettagli
  UploadCard.jsx                 # upload file + salvataggio diretto su Supabase
  HistoryTable.jsx               # elenco storico
  DetailModal.jsx                 # dettaglio busta paga
  ConnectionBadge.jsx             # badge stato sync nell'header
  InstallAppButton.jsx            # pulsante installazione PWA
  charts/
    NettoLordoChart.jsx            # grafico Netto vs Lordo (Dashboard)
    RateiBarChart.jsx               # grafico Maturato/Goduto/Saldo (Ferie/ROL)
    SaldiTrendChart.jsx             # andamento saldi nel tempo (Ferie/ROL)
    TicketChart.jsx                  # valore buoni pasto mese per mese
context/
  SettingsContext.jsx            # stato globale: config Supabase, stato sync, layout
  PayslipsContext.jsx             # stato globale: buste paga caricate, condiviso tra le schermate
lib/
  supabase.js                    # crea il client Supabase browser (anon key)
  settingsStore.js                # persistenza localStorage (config + preferenze)
  mapPayslip.js                   # mappa il JSON di Gemini sulle colonne della tabella
  ral.js                           # calcolo RAL reale, RAL ipotetica, lordo medio
  buoniPasto.js                     # calcolo totale, media e giorni buoni pasto
  useInstallPrompt.js             # hook per il prompt di installazione PWA
  format.js                       # formattazione euro/ore/giorni
schema.sql                       # script da eseguire su Supabase (RLS per anon key)
netlify.toml                     # config deploy Netlify
```

## 11. Nuove funzionalità: Documenti, Ferie/ROL, RAL, Buoni Pasto

La barra in basso permette di navigare tra 5 schermate:

- **Dashboard**: ultimo netto, netto medio, lordo medio mensile, grafico Netto/Lordo, storico
- **Ferie/ROL**: saldo combinato Ferie+ROL, saldi singoli, banca ore, grafico Maturato/Goduto/Saldo e andamento nel tempo
- **RAL**: RAL reale, RAL ipotetica (con breakdown del calcolo) e paga oraria aggiornata
- **Ticket**: totale buoni pasto percepiti, media mensile, giorni totali, grafico e dettaglio mese per mese
- **Documenti**: elenco dei PDF/foto originali caricati, apribili tramite link temporaneo sicuro (valido 10 minuti)

### Eliminare una busta paga

Dalla Dashboard, tocca una riga dello storico per aprire il dettaglio: in fondo trovi il pulsante **"Elimina busta paga"**. Richiede una conferma esplicita (per evitare cancellazioni accidentali) e rimuove sia la riga dal database sia il file originale dal bucket Storage — l'operazione non è reversibile.

### Come vengono calcolate RAL reale e RAL ipotetica

- **RAL reale**: somma del lordo totale di tutte le buste caricate nello stesso anno dell'ultima busta. È un consuntivo parziale che cresce man mano che carichi nuove buste, non una proiezione.
- **RAL ipotetica**: (minimo tabellare + scatti di anzianità + indennità di mansione dell'ultima busta) × 13 mensilità, + il bonus produzione già documentato nell'anno (somma delle tranche presenti nelle buste caricate — se manca una tranche, il totale è provvisorio). L'indennità mensa/ticket è volutamente esclusa, perché per prassi non fa parte della RAL contrattuale.

Se la tua situazione contrattuale prevede regole diverse (altre voci da includere/escludere), la formula si trova in un unico punto del codice: `lib/ral.js`.

### Aggiornamento del database (solo se hai già eseguito schema.sql in passato)

Questa versione aggiunge una colonna `file_type` alla tabella (per riconoscere PDF vs foto nella schermata Documenti) e i permessi per poter eliminare le buste paga. Se il tuo progetto Supabase esiste già:
1. Vai su **SQL Editor > New query**
2. Incolla ed esegui solo il blocco "AGGIORNAMENTO SCHEMA" che trovi in fondo a `schema.sql` (non serve rieseguire tutto lo script)

## 12. Filtro per anno

In alto a destra, su ogni schermata, trovi un menu a tendina con gli anni disponibili (più l'opzione "Tutti gli anni"). Selezionando un anno, **tutta l'app si aggiorna di conseguenza**: Dashboard, Ferie/ROL, RAL, Ticket e Documenti mostrano solo i dati di quell'anno — utile per separare in automatico le buste 2026 da quelle 2027 e successive. La scelta viene ricordata sul dispositivo tra una sessione e l'altra. Caricando una nuova busta di un anno diverso da quello selezionato, l'app passa automaticamente su quell'anno per mostrartela subito.

## 13. Caricamento multiplo, Segnalazioni, mensilità RAL, proiezione Ferie/ROL

- **Caricamento multiplo**: nella Dashboard puoi selezionare più PDF (o più foto) insieme; l'app li elabora uno alla volta mostrando una barra di avanzamento ("Elaborazione 2 di 5…").
- **Segnalazioni**: dalle Impostazioni puoi scrivere un suggerimento o segnalare un problema, inviato via email a chi gestisce l'app (richiede `RESEND_API_KEY`, vedi punto 3).
- **Mensilità RAL**: dalle Impostazioni scegli se la RAL ipotetica va calcolata su 12, 13 o 14 mensilità. Con 14 selezionate, la quattordicesima è considerata uguale alla mensilità base.
- **Proiezione Ferie/ROL a fine anno**: nella pagina Ferie/ROL, un riquadro dedicato stima il saldo al 31 dicembre, assumendo che la maturazione mensile resti quella dell'ultima busta caricata e che non vengano prese ulteriori ferie/ROL da qui a fine anno.

## Note

- Il modello usato per l'estrazione è `gemini-3.6-flash`; per cambiarlo modifica
  la costante `GEMINI_MODEL` in `app/api/parse-payslip/route.js` (ad es. per
  passare a un modello Gemini più recente quando disponibile).
- Se in futuro preferisci tornare a Claude (Anthropic) — niente uso dei tuoi
  dati per l'addestramento nemmeno in fascia base — basta far riscrivere
  l'endpoint `/api/parse-payslip` per usare l'API Anthropic al posto di
  quella Gemini: l'architettura del resto dell'app non cambia.
- Se non colleghi mai Supabase, l'app resta utilizzabile ma non può salvare
  né mostrare storico: l'upload è disabilitato con un invito a collegarsi
  dalle Impostazioni.
