# BancaDelMeme · Reddit Devvit

Porting 1:1 di [`timendum/BancaDelMeme`](https://github.com/timendum/BancaDelMeme) sulla piattaforma **Reddit Devvit**.

Include:
- Tutti i comandi originali (`!investi`, `!investitutto`, `!saldo`, `!bancarotta`, `!attivi`, `!vendi`, `!mercato`, `!top`, `!crea` / `!create`, `!aiuto`, `!template`, `!versione`, `!rimuovi <regola>`, `!ignora`).
- Formula matematica originale (`src/server/formula.ts`), testi letterali in italiano (`src/server/message.ts`), bonus OP/OC, tasse IRPEF (`src/server/taxes.ts`), reset stagione (`src/server/new_season.ts`).
- Aggiornamento automatico ogni 20 minuti di wiki (`leaderboardbig`, `leaderboardocbig`) e widget sidebar Redesign (`top10`, `migliori autori`).
- Bridge Telegram ufficiale (`src/server/telegram.ts`) con `sendPhoto`, fallback `sendMessage` e rimozione automatica dei post moderati.
- Esportazione/importazione del database SQLite legacy (`migration/export_db.py` + `src/server/import_db.ts`).

---

## Requisiti
- Node.js 20+
- Account Reddit moderatore su `r/BancaDelMeme` (o subreddit di test)
- Devvit CLI: `npm install -g devvit`

## Deploy su Reddit Devvit
```bash
npm install
devvit login
npm run typecheck
npm run build
devvit upload
devvit install r/BancaDelMeme
```

Dopo l'installazione apri su Reddit:
**Mod Tools → Installed Apps → bancadelmeme → Configure** e imposta:
- `tgToken` (token del bot Telegram, salvato come secret globale)
- `tgChannel` (es. `@BancaDelMeme` oppure ID numerico del canale)
- `investmentDuration` (`14400` = 4 ore, oppure `86400` = 24 ore)
- `startingBalance` (`1000`)
- `adminAccounts` (account autorizzati a usare `!rimuovi <n>`, separati da virgola)

---

## Fetch Domains
Questa app dichiara il dominio esterno `api.telegram.org` in `devvit.json` esclusivamente per replicare il bridge Telegram di `submitter.py` (`sendPhoto`, `sendMessage`, `deleteMessage` verso il canale ufficiale del subreddit).

> Nota: alla prima pubblicazione (`devvit upload`), Reddit sottopone a verifica il dominio `api.telegram.org` (1–2 giorni lavorativi). Nel frattempo tutta la parte Reddit del bot funziona normalmente.

---

## Sostituzione del bot attuale e migrazione del database

### Caso A — Hai accesso al vecchio server/database (`db.sqlite3`)
1. Ferma i vecchi worker Python (`main.py`, `submitter.py`, `calculator.py`, `buyabler.py`, `leaderboard.py`) per evitare modifiche durante l'esportazione.
2. Esporta il database esistente in chunk JSON:
   ```bash
   python3 migration/export_db.py --cfg /percorso/BancaDelMeme/cfg.json --out bdb_dump
   ```
   *(in alternativa passa `--db /percorso/db.sqlite3 --posts-db /percorso/posts.sqlite3`)*.
3. Su `r/BancaDelMeme` apri il menu moderatore del subreddit → **BancaDelMeme: Importa DB Legacy (JSON)** e incolla in ordine il contenuto di ogni file `bdb_dump_chunk_001.json`, `002.json`, …
4. Verifica con `!saldo` e `!attivi` che i dati siano allineati e lascia disattivato il vecchio bot Python.

### Caso B — Nessun accesso al vecchio server
Installa l'app Devvit con i comandi nella sezione **Deploy su Reddit Devvit**: il bot ripartirà subito con una nuova stagione su Devvit Redis senza bisogno di server esterni.
