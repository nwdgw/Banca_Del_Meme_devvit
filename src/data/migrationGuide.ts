export interface ModuleMappingRow {
  original: string;
  devvit: string;
  changes: string;
}

export interface DeployStep {
  step: string;
  title: string;
  command?: string;
  detail: string;
}

export const MODULE_MAPPINGS: ModuleMappingRow[] = [
  {
    original: 'cfg.json.example.txt + src/config.py',
    devvit: 'devvit.json + src/server/config.ts',
    changes:
      'Le credenziali OAuth Reddit non servono più: Devvit autentica l’app nativamente. TG_TOKEN è salvato come global secret Devvit, mentre TG_CHANNEL e i parametri di gioco stanno nelle impostazioni del subreddit.',
  },
  {
    original: 'src/models.py (SQLite) + posts.sqlite3',
    devvit: 'src/server/models.ts (Devvit Redis)',
    changes:
      'Le tabelle Investors, Investments, Buyables e posts (Telegram) diventano Hash, Set e Sorted Set su Redis nativo gestito da Reddit.',
  },
  {
    original: 'src/main.py (inbox stream)',
    devvit: 'devvit.json (onCommentCreate) + src/server/index.ts',
    changes:
      'Il loop su reddit.inbox.comment_replies è sostituito dal trigger push onCommentCreate.',
  },
  {
    original: 'src/submitter.py (post + sticky)',
    devvit: 'src/server/submitter.ts (onPostCreate)',
    changes:
      'All’arrivo di un nuovo post invia la foto/link su Telegram, pubblica e fissa il commento ufficiale del bot e crea il record Buyable.',
  },
  {
    original: 'src/submitter.py (post_telegram + clean_removed)',
    devvit: 'src/server/telegram.ts',
    changes:
      'Replica 1:1 sendPhoto (con fallback sendMessage) e deleteMessage sugli ultimi 4 post rimossi via Telegram Bot API (api.telegram.org).',
  },
  {
    original: 'src/comment_worker.py',
    devvit: 'src/server/comment_worker.ts',
    changes:
      'Tutte le regex e tutti i comandi (!investi, !investitutto, !saldo, !bancarotta, !attivi, !vendi, !mercato, !top, !crea, !aiuto, !template, !versione, !rimuovi) invariati.',
  },
  {
    original: 'src/formula.py + src/message.py + src/help_info.py + src/utils.py',
    devvit: 'src/server/formula.ts + message.ts + help_info.ts + utils.ts',
    changes:
      'Porting 1:1 della sigmoide, del coefficiente patrimoniale, di OP_BONUS/OC_BONUS e di tutte le stringhe di risposta in italiano.',
  },
  {
    original: 'src/calculator.py + src/buyabler.py',
    devvit: 'src/server/calculator.ts + src/server/buyabler.ts (Scheduler)',
    changes:
      'Eseguiti ogni 2 minuti dal task schedulato process-maturities insieme a cleanRemovedTelegram.',
  },
  {
    original: 'src/leaderboard.py',
    devvit: 'src/server/leaderboard.ts (Scheduler)',
    changes:
      'Eseguito ogni 20 minuti (update-leaderboard): aggiorna le pagine wiki leaderboardbig e leaderboardocbig e i widget sidebar Redesign (top10, migliori autori).',
  },
  {
    original: 'src/taxes.py + src/seasonleaderboard.py + src/new_season.py',
    devvit: 'src/server/taxes.ts + src/server/new_season.ts (Menu Mod)',
    changes:
      'Avviabili direttamente dai moderatori su Reddit dal menu del subreddit senza accesso SSH.',
  },
  {
    original: 'db.sqlite3 + posts.sqlite3',
    devvit: 'migration/export_db.py + src/server/import_db.ts',
    changes:
      'Esporta il database SQLite esistente in chunk JSON e li importa in Devvit Redis dal menu moderatore senza perdere saldi o investimenti aperti.',
  },
];

export const DEPLOY_STEPS: DeployStep[] = [
  {
    step: '01',
    title: 'Estrai il progetto ZIP e installa la CLI Devvit',
    command: 'npm install -g devvit && npm install',
    detail:
      'Richiede Node.js 20 o superiore. Estrai l’archivio scaricato in una cartella locale ed esegui il comando nella root del progetto.',
  },
  {
    step: '02',
    title: 'Accedi con l’account Reddit sviluppatore',
    command: 'devvit login',
    detail:
      'Autentica la CLI tramite browser usando l’account Reddit moderatore che gestirà l’app su r/BancaDelMeme.',
  },
  {
    step: '03',
    title: 'Verifica i tipi e compila il bundle server',
    command: 'npm run typecheck && npm run build',
    detail:
      'Genera il file dist/server/index.cjs richiesto da devvit.json. Verifica che la compilazione termini senza errori.',
  },
  {
    step: '04',
    title: 'Carica l’app su Reddit (e richiedi sblocco dominio Telegram)',
    command: 'devvit upload',
    detail:
      'Carica l’app sui server Reddit. Avendo dichiarato api.telegram.org in permissions.http.domains, Reddit avvia la verifica automatica per le chiamate esterne verso Telegram (1–2 giorni lavorativi; nel frattempo tutta la parte Reddit funziona subito).',
  },
  {
    step: '05',
    title: 'Installa su r/BancaDelMeme e inserisci token/impostazioni',
    command: 'devvit install r/BancaDelMeme',
    detail:
      'Apri Mod Tools → Installed Apps → bancadelmeme → Configure su Reddit per inserire tgToken (secret globale), tgChannel, investmentDuration (14400 = 4 ore, 86400 = 24 ore), startingBalance (1000) e adminAccounts.',
  },
];

export const CUTOVER_STEPS: DeployStep[] = [
  {
    step: '01',
    title: 'Ferma il vecchio bot Python in sicurezza',
    command: 'pkill -f "python.*(main|submitter|calculator|buyabler|leaderboard)\\.py"',
    detail:
      'Arresta tutti i processi del vecchio bot (oppure ferma il servizio systemd / supervisor) prima di esportare il DB, così nessun investimento cambia stato durante la copia.',
  },
  {
    step: '02',
    title: 'Esporta il database SQLite esistente in JSON',
    command: 'python3 migration/export_db.py --cfg /percorso/BancaDelMeme/cfg.json --out bdb_dump',
    detail:
      'Legge DBFILE (Investors, Investments, Buyables) e POST_DBFILE (posts Telegram) e produce file bdb_dump_chunk_001.json, _002.json, ... da 400 record ciascuno. Puoi anche passare --db e --posts-db manualmente.',
  },
  {
    step: '03',
    title: 'Importa i chunk JSON in Devvit Redis da Reddit',
    detail:
      'Su r/BancaDelMeme apri il menu moderatore del subreddit → "BancaDelMeme: Importa DB Legacy (JSON)", incolla il contenuto di ciascun file chunk in ordine (001, 002, ...) e premi "Importa in Redis". Investitori, saldi, investimenti attivi/storici, buyable e ID Telegram vengono preservati.',
  },
  {
    step: '04',
    title: 'Verifica la transizione e disattiva le vecchie credenziali OAuth',
    detail:
      'Controlla con una risposta !saldo e !attivi che i dati corrispondano. Il vecchio account bot Python resta fermo (puoi revocare il vecchio client OAuth o lasciarlo inattivo): da questo momento l’app Devvit risponde come app ufficiale del subreddit.',
  },
];

export const PARITY_NOTES: Array<{ area: string; status: string; detail: string }> = [
  {
    area: 'Comandi, formula e testi italiani',
    status: 'Identico 1:1',
    detail:
      'Tutti i 13 comandi (!investi, !investitutto, !saldo, !bancarotta, !attivi, !vendi, !mercato, !top, !crea, !aiuto, !template, !versione, !rimuovi), formula sigmoide, OP_BONUS/OC_BONUS, tasse IRPEF e risposte letterali da message.py.',
  },
  {
    area: 'Bridge Telegram (canale ufficiale)',
    status: 'Funzionante via HTTP fetch',
    detail:
      'sendPhoto per immagini (i.redd.it, .png, .jpg, .jpeg) con fallback sendMessage e cleanRemovedTelegram ogni 2 minuti. Richiede approvazione dominio api.telegram.org da parte di Reddit dopo devvit upload.',
  },
  {
    area: 'Classifica wiki e sidebar',
    status: 'Wiki + Widget Redesign',
    detail:
      'Aggiorna ogni 20 minuti leaderboardbig, leaderboardocbig e i widget sidebar Redesign (top10, migliori autori). La vecchia descrizione testuale Old Reddit non è modificabile dalle API Devvit standard.',
  },
  {
    area: 'Identità del bot nei commenti',
    status: 'Account app Devvit',
    detail:
      'Su Devvit i commenti vengono pubblicati con l’account dell’app (u/bancadelmeme o nome scelto in devvit.json) invece che con l’utente OAuth legacy.',
  },
];
