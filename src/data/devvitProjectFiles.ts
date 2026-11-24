export interface DevvitProjectFile {
  path: string;
  originalEquivalent: string;
  category: 'config' | 'core' | 'workers' | 'season' | 'migration';
  language: 'json' | 'typescript' | 'python' | 'markdown';
  summary: string;
  content: string;
}

export const DEVVIT_PROJECT_FILES: DevvitProjectFile[] = [
  {
    path: 'devvit.json',
    originalEquivalent: 'cfg.json.example.txt + cron/systemd',
    category: 'config',
    language: 'json',
    summary:
      'Manifest ufficiale Reddit Devvit: trigger onPostCreate/onCommentCreate, scheduler, form/menu moderatore (incluso Importa DB), permessi Reddit/Redis/HTTP Telegram e settings.',
    content: `{
  "$schema": "https://developers.reddit.com/schema/config-file.v1.json",
  "name": "bancadelmeme",
  "server": {
    "dir": "dist/server",
    "entry": "index.cjs"
  },
  "triggers": {
    "onPostCreate": "/internal/triggers/on-post-create",
    "onCommentCreate": "/internal/triggers/on-comment-create"
  },
  "scheduler": {
    "tasks": {
      "process-maturities": {
        "cron": "*/2 * * * *",
        "endpoint": "/internal/scheduler/process-maturities"
      },
      "update-leaderboard": {
        "cron": "*/20 * * * *",
        "endpoint": "/internal/scheduler/update-leaderboard"
      }
    }
  },
  "menu": {
    "items": [
      {
        "label": "BancaDelMeme: Importa DB Legacy (JSON)",
        "description": "Importa i dati esportati da export_db.py in Devvit Redis",
        "location": "subreddit",
        "forUserType": "moderator",
        "endpoint": "/internal/menu/import-db"
      },
      {
        "label": "BancaDelMeme: Riscuoti Tasse IRPEF",
        "description": "Esegue taxes.ts su tutti gli investitori attivi",
        "location": "subreddit",
        "forUserType": "moderator",
        "endpoint": "/internal/menu/run-taxes"
      },
      {
        "label": "BancaDelMeme: Esporta Classifica Stagione",
        "description": "Salva la classifica finale sulla wiki (seasonleaderboard.ts)",
        "location": "subreddit",
        "forUserType": "moderator",
        "endpoint": "/internal/menu/export-season"
      },
      {
        "label": "BancaDelMeme: Reset Nuova Stagione",
        "description": "Azzera investitori, investimenti e post per nuova stagione",
        "location": "subreddit",
        "forUserType": "moderator",
        "endpoint": "/internal/menu/new-season"
      }
    ]
  },
  "forms": {
    "importDbForm": "/internal/form/import-db"
  },
  "settings": {
    "global": {
      "tgToken": {
        "type": "string",
        "label": "Telegram Bot Token (TG_TOKEN)",
        "isSecret": true
      }
    },
    "subreddit": {
      "postToReddit": {
        "type": "boolean",
        "label": "Pubblica realmente i commenti su Reddit (BOT_POST_TO_REDDIT)",
        "defaultValue": true
      },
      "isModerator": {
        "type": "boolean",
        "label": "Fissa e approva i commenti del bot (BOT_IS_MODERATOR)",
        "defaultValue": true
      },
      "investmentDuration": {
        "type": "number",
        "label": "Durata investimento in secondi (es. 14400 = 4 ore, 86400 = 24 ore)",
        "defaultValue": 14400
      },
      "startingBalance": {
        "type": "number",
        "label": "Saldo iniziale in Mem€ (BOT_STARTING_BALANCE)",
        "defaultValue": 1000
      },
      "closed": {
        "type": "boolean",
        "label": "Stagione chiusa ai nuovi investimenti (BOT_CLOSED)",
        "defaultValue": false
      },
      "maintenance": {
        "type": "boolean",
        "label": "Modalità manutenzione attiva (BOT_MAINTENANCE)",
        "defaultValue": false
      },
      "adminAccounts": {
        "type": "string",
        "label": "Account admin separati da virgola per !rimuovi (BOT_ADMIN_REDDIT_ACCOUNTS)",
        "defaultValue": "timendum"
      },
      "subredditSlug": {
        "type": "string",
        "label": "Nome subreddit (senza r/)",
        "defaultValue": "BancaDelMeme"
      },
      "tgChannel": {
        "type": "string",
        "label": "Canale Telegram (es. @BancaDelMeme o chat_id numerico, TG_CHANNEL)",
        "defaultValue": ""
      }
    }
  },
  "permissions": {
    "reddit": {
      "enable": true
    },
    "redis": true,
    "http": {
      "enable": true,
      "domains": [
        "api.telegram.org"
      ]
    }
  }
}
`,
  },
  {
    path: 'package.json',
    originalEquivalent: 'requirements.txt',
    category: 'config',
    language: 'json',
    summary:
      'Dipendenze e script di build per compilare il server Devvit in CommonJS (dist/server/index.cjs) e pubblicarlo tramite CLI Devvit.',
    content: `{
  "name": "bancadelmeme-devvit",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "esbuild src/server/index.ts --bundle --platform=node --target=node20 --format=cjs --outfile=dist/server/index.cjs",
    "typecheck": "tsc --noEmit",
    "dev": "devvit playtest",
    "deploy": "npm run build && devvit upload"
  },
  "dependencies": {
    "@devvit/web": "latest",
    "hono": "^4.7.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "devvit": "latest",
    "esbuild": "^0.25.0",
    "typescript": "^5.7.0"
  }
}
`,
  },
  {
    path: 'tsconfig.json',
    originalEquivalent: 'Configurazione TypeScript',
    category: 'config',
    language: 'json',
    summary: 'Configurazione TypeScript strict compatibile con Node 20 e bundle esbuild per Devvit Web.',
    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
`,
  },
  {
    path: 'src/server/index.ts',
    originalEquivalent: 'src/main.py + startbancadelmeme.sh',
    category: 'core',
    language: 'typescript',
    summary:
      'Entrypoint Hono del server Devvit: trigger post/commenti, scheduler maturazioni/Telegram/classifica e form/menu moderatore inclusa importazione DB.',
    content: `import { Hono } from 'hono';
import {
  createServer,
  getServerPort,
  reddit,
  redis,
} from '@devvit/web/server';
import type {
  FormSubmitRequest,
  MenuItemRequest,
  OnCommentCreateRequest,
  OnPostCreateRequest,
  TaskRequest,
  TaskResponse,
  TriggerResponse,
  UiResponse,
} from '@devvit/web/shared';
import { getBotConfig } from './config.js';
import { handlePostCreate } from './submitter.js';
import { handleCommentCreate } from './comment_worker.js';
import { processMatureInvestments } from './calculator.js';
import { processMatureBuyables } from './buyabler.js';
import { cleanRemovedTelegram } from './telegram.js';
import { updateLeaderboard } from './leaderboard.js';
import { collectTaxes } from './taxes.js';
import { exportSeasonLeaderboard, resetAllSeason } from './new_season.js';
import { importLegacyDumpJson } from './import_db.js';
import { ensureDeployDate } from './utils.js';

const app = new Hono();

app.post('/internal/triggers/on-post-create', async (c) => {
  const event = await c.req.json<OnPostCreateRequest>();
  const cfg = await getBotConfig();
  await ensureDeployDate(redis);
  await handlePostCreate(event, cfg);
  return c.json<TriggerResponse>({ status: 'ok' });
});

app.post('/internal/triggers/on-comment-create', async (c) => {
  const event = await c.req.json<OnCommentCreateRequest>();
  const cfg = await getBotConfig();
  await ensureDeployDate(redis);
  await handleCommentCreate(event, cfg);
  return c.json<TriggerResponse>({ status: 'ok' });
});

app.post('/internal/scheduler/process-maturities', async (c) => {
  await c.req.json<TaskRequest>();
  const cfg = await getBotConfig();
  await processMatureInvestments(cfg);
  await processMatureBuyables(cfg);
  await cleanRemovedTelegram(cfg);
  return c.json<TaskResponse>({ status: 'ok' });
});

app.post('/internal/scheduler/update-leaderboard', async (c) => {
  await c.req.json<TaskRequest>();
  const cfg = await getBotConfig();
  await updateLeaderboard(cfg);
  return c.json<TaskResponse>({ status: 'ok' });
});

app.post('/internal/menu/import-db', async (c) => {
  await c.req.json<MenuItemRequest>();
  return c.json<UiResponse>({
    showForm: {
      name: 'importDbForm',
      form: {
        title: 'Importa Database Legacy (BancaDelMeme)',
        description:
          'Incolla il contenuto di un file JSON generato da migration/export_db.py. Puoi importare più chunk in sequenza senza sovrascrivere i precedenti.',
        acceptLabel: 'Importa in Redis',
        fields: [
          {
            type: 'paragraph',
            name: 'payload',
            label: 'Dump JSON (investors, investments, buyables, telegramPosts)',
            required: true,
          },
        ],
      },
    },
  });
});

app.post('/internal/form/import-db', async (c) => {
  const req = await c.req.json<FormSubmitRequest<{ payload?: string }>>();
  const raw = req.values?.payload ?? '';
  try {
    const stats = await importLegacyDumpJson(raw);
    return c.json<UiResponse>({
      showToast: {
        text: \`Importati: \${stats.investors} investitori, \${stats.investments} investimenti, \${stats.buyables} post, \${stats.telegramPosts} TG.\`,
        appearance: 'success',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore parsing JSON';
    return c.json<UiResponse>({
      showToast: {
        text: \`Importazione fallita: \${msg}\`,
        appearance: 'neutral',
      },
    });
  }
});

app.post('/internal/menu/run-taxes', async (c) => {
  await c.req.json<MenuItemRequest>();
  const cfg = await getBotConfig();
  const count = await collectTaxes(cfg);
  return c.json<UiResponse>({
    showToast: {
      text: \`Tasse IRPEF riscosse su \${count} investitori.\`,
      appearance: 'success',
    },
  });
});

app.post('/internal/menu/export-season', async (c) => {
  await c.req.json<MenuItemRequest>();
  const cfg = await getBotConfig();
  const result = await exportSeasonLeaderboard(cfg);
  return c.json<UiResponse>({
    showToast: {
      text: result.message,
      appearance: result.ok ? 'success' : 'neutral',
    },
  });
});

app.post('/internal/menu/new-season', async (c) => {
  await c.req.json<MenuItemRequest>();
  const summary = await resetAllSeason();
  const cfg = await getBotConfig();
  await reddit
    .sendPrivateMessage({
      to: \`/r/\${cfg.SUBREDDITS[0]}\`,
      subject: 'BancaDelMeme: Reset Nuova Stagione completato',
      text: \`Reset completato: rimossi \${summary.investors} investitori, \${summary.investments} investimenti, \${summary.buyables} post.\`,
    })
    .catch(() => undefined);

  return c.json<UiResponse>({
    showToast: {
      text: \`Stagione azzerata (\${summary.investors} investitori rimossi).\`,
      appearance: 'success',
    },
  });
});

const port = getServerPort();
const server = createServer(app);
server.listen(port);

export default app;
`,
  },
  {
    path: 'src/server/config.ts',
    originalEquivalent: 'src/config.py',
    category: 'core',
    language: 'typescript',
    summary:
      'Legge le impostazioni del subreddit e il segreto TG_TOKEN da Devvit settings mantenendo gli stessi identici flag e valori di config.py.',
    content: `import { settings } from '@devvit/web/server';

export interface BotConfig {
  POST_TO_REDDIT: boolean;
  IS_MODERATOR: boolean;
  INVESTMENT_DURATION: number;
  STARTING_BALANCE: number;
  ADMIN_ACCOUNTS: string[];
  CLOSED: boolean;
  MAINTENANCE: boolean;
  SUBREDDITS: string[];
  TG_TOKEN: string;
  TG_CHANNEL: string;
}

export async function getBotConfig(): Promise<BotConfig> {
  const [
    postToReddit,
    isModerator,
    investmentDuration,
    startingBalance,
    adminAccountsRaw,
    closed,
    maintenance,
    subredditSlug,
    tgToken,
    tgChannel,
  ] = await Promise.all([
    settings.get<boolean>('postToReddit'),
    settings.get<boolean>('isModerator'),
    settings.get<number>('investmentDuration'),
    settings.get<number>('startingBalance'),
    settings.get<string>('adminAccounts'),
    settings.get<boolean>('closed'),
    settings.get<boolean>('maintenance'),
    settings.get<string>('subredditSlug'),
    settings.get<string>('tgToken'),
    settings.get<string>('tgChannel'),
  ]);

  const adminAccounts = (adminAccountsRaw ?? 'timendum')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  return {
    POST_TO_REDDIT: postToReddit ?? true,
    IS_MODERATOR: isModerator ?? true,
    INVESTMENT_DURATION: investmentDuration ?? 14400,
    STARTING_BALANCE: startingBalance ?? 1000,
    ADMIN_ACCOUNTS: adminAccounts,
    CLOSED: closed ?? false,
    MAINTENANCE: maintenance ?? false,
    SUBREDDITS: [subredditSlug?.trim() || 'BancaDelMeme'],
    TG_TOKEN: (tgToken ?? '').trim(),
    TG_CHANNEL: (tgChannel ?? '').trim(),
  };
}
`,
  },
  {
    path: 'src/server/formula.ts',
    originalEquivalent: 'src/formula.py',
    category: 'core',
    language: 'typescript',
    summary:
      'Porting esatto 1:1 della formula matematica originale: sigmoide sugli upvote, coefficiente patrimoniale anti-monopolio, OP_BONUS e OC_BONUS.',
    content: `export const OP_BONUS = 1.5;
export const OC_BONUS = 50; // return investment.amount / OC_BONUS

export const MAX_A = 2.5;
export const MAX_B = 0;
export const MAX_C = 30;

export const MID_A = 100;
export const MID_B = 10000;
export const MID_M = 20000;

export const STEEP_A = 0.1;
export const STEEP_C = 400;

export function linearInterpolate(
  x: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number
): number {
  const m = (y1 - y0) / (x1 - x0);
  const c = y0;
  return m * x + c;
}

export function sigmoidMax(oldUpvotes: number): number {
  return MAX_A + MAX_B / (oldUpvotes / MAX_C + 1);
}

export function sigmoidMidpoint(oldUpvotes: number): number {
  return linearInterpolate(oldUpvotes, 0, MID_M, MID_A, MID_B);
}

export function sigmoidSteepness(oldUpvotes: number): number {
  return STEEP_A / (oldUpvotes / STEEP_C + 1);
}

export function sigmoid(
  x: number,
  maxValue: number,
  midpoint: number,
  steepness: number
): number {
  const arg = -(steepness * (x - midpoint));
  return maxValue / (1 + Math.exp(arg));
}

export function netWorthCoefficient(netWorth: number, topNetworth = 0): number {
  let factor = 0.155;
  let normalized = netWorth;
  if (topNetworth > 0) {
    normalized = Math.max(1, (netWorth * 100) / topNetworth);
    factor = 0.4591932391528963; // math.log(6, 90 * 0.55)
  }
  return Math.pow(normalized, -factor) * 6;
}

export function adjust(factor: number, netWorth = 0, topNetworth = 0): number {
  if (netWorth > 0 && topNetworth > 0 && factor > 1) {
    return factor * netWorthCoefficient(netWorth, topNetworth);
  }
  return factor;
}

export function calculate(
  newUpvotes: number,
  oldUpvotes: number,
  netWorth = 0,
  topNetworth = 0
): number {
  const safeOld = oldUpvotes < 0 ? 0 : oldUpvotes;
  const safeNew = newUpvotes < 0 ? 0 : newUpvotes;
  const safeNetWorth = netWorth < 0 ? 1 : netWorth;

  let delta = safeNew - safeOld;
  if (delta < 0) {
    delta = 0;
  }

  const sigMax = sigmoidMax(safeOld);
  const sigMp = sigmoidMidpoint(safeOld);
  const sigStp = sigmoidSteepness(safeOld);

  let factor = sigmoid(delta, sigMax, sigMp, sigStp);
  factor = adjust(factor, safeNetWorth, topNetworth);
  factor = Math.max(0.5, factor);
  return factor;
}
`,
  },
  {
    path: 'src/server/utils.ts',
    originalEquivalent: 'src/utils.py',
    category: 'core',
    language: 'typescript',
    summary:
      'Funzioni di utilità originali: BALANCE_CAP (1 quintilione), formattazione Mem€ (M/B/T/Q/E), durata investimento in italiano e tracking data deploy.',
    content: `import type { RedisClient } from '@devvit/web/server';

export const BALANCE_CAP = 1000 * 1000 * 1000 * 1000 * 1000 * 1000; // One quintillion Mem€

const DEPLOY_DATE_KEY = 'bdb:meta:deploy_date';

export async function ensureDeployDate(redis: RedisClient): Promise<string> {
  const existing = await redis.get(DEPLOY_DATE_KEY);
  if (existing) {
    return existing;
  }
  const now = new Date().toUTCString();
  await redis.set(DEPLOY_DATE_KEY, now);
  return now;
}

export async function getDeployDate(redis: RedisClient): Promise<string> {
  return (await redis.get(DEPLOY_DATE_KEY)) ?? new Date().toUTCString();
}

export function investmentDurationString(durationSeconds: number): string {
  let duration = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(duration / 3600);
  duration %= 3600;
  const minutes = Math.floor(duration / 60);
  duration %= 60;

  let invString = '';
  if (hours) {
    invString += \`\${hours} or\${hours > 1 ? 'e' : 'a'} \`;
  }
  if (minutes) {
    invString += \`\${minutes} minut\${minutes > 1 ? 'i' : 'o'} \`;
  }
  if (duration) {
    invString += \`\${duration} second\${duration > 1 ? 'i' : 'o'} \`;
  }
  return invString;
}

export function formatInt(n: number): string {
  return Math.trunc(n).toLocaleString('en-US');
}

export function formatNumber(n: number): string {
  const rounded = Math.trunc(n);
  const absStr = Math.abs(rounded).toString();
  if (absStr.length <= 6 && !absStr.includes('e')) {
    return formatInt(rounded);
  }
  const suffixes: Record<number, string> = {
    6: 'M',
    9: 'B',
    12: 'T',
    15: 'Q',
    18: 'E',
  };
  const absVal = Math.abs(rounded);
  if (absVal < 1e6) {
    return formatInt(rounded);
  }
  const digits = Math.floor(Math.log10(absVal)) + 1;
  const exponent = digits - 1 - ((digits - 1) % 3);
  const mantissa = rounded / Math.pow(10, exponent);
  const suffix = suffixes[exponent] ?? \`e\${exponent}\`;
  return \`\${mantissa.toFixed(2)}\${suffix}\`;
}

export function normalizePostId(rawId: string): string {
  return rawId.startsWith('t3_') ? rawId.slice(3) : rawId;
}

export function toFullPostId(postId: string): \`t3_\${string}\` {
  return (postId.startsWith('t3_') ? postId : \`t3_\${postId}\`) as \`t3_\${string}\`;
}

export function normalizeCommentId(rawId: string): string {
  return rawId.startsWith('t1_') ? rawId.slice(3) : rawId;
}

export function toFullCommentId(commentId: string): \`t1_\${string}\` {
  return (commentId.startsWith('t1_') ? commentId : \`t1_\${commentId}\`) as \`t1_\${string}\`;
}
`,
  },
  {
    path: 'src/server/help_info.ts',
    originalEquivalent: 'src/help_info.py',
    category: 'core',
    language: 'typescript',
    summary: 'Dizionario testuale originale per il comando !aiuto <comando>.',
    content: `export const helpDict: Record<string, string> = {
  attivi: 'Mostra una lista di tutti gli investimenti attivi.',
  saldo: 'Mostra il tuo saldo in Mem€.',
  bancarotta:
    'Se hai meno di 100 Mem€, questo comando portera il tuo saldo a 100.',
  crea: 'Crea il tuo conto.',
  aiuto: 'Mostra un aiuto.',
  investi:
    "Investi l'ammontare specificato di Mem€ in uno specifico post. A seconda dell'ammontare di upvotes del post, dopo 4 ore potrai ricevere o perdere il tuo investimento.",
  mercato: 'Mostra delle statistiche sul mercato.',
  template:
    'Permette a OP di specificare il link del template che verrà inserito nel messaggio sticky del post.',
  top: 'Mostra i migliori investitori.',
  versione: 'Mostra quando è stata installata la versione corrente del bot.',
  wiki: 'Ottieni la lista dei tuoi ultimi 50 investimenti conclusi sulla wiki.',
  vendi:
    "Concludi in anticipo il tuo investimento attivo nel post in questione (1% di commissione sull'investimento per ora di anticipo).",
  investitutto: "Come investi, ma l'ammontare è uguale al tuo saldo.",
};
`,
  },
  {
    path: 'src/server/message.ts',
    originalEquivalent: 'src/message.py',
    category: 'core',
    language: 'typescript',
    summary:
      'Tutti i testi ufficiali di risposta del bot in italiano, portati alla lettera da message.py.',
    content: `import type { InvestmentRecord, InvestorRecord } from './models.js';
import { formatInt, formatNumber, investmentDurationString } from './utils.js';

export function modifyCreate(username: string, balance: number): string {
  return \`*Conto creato!*
Grazie \${username} per aver creato un conto /r/BancaDelMeme!
Il tuo saldo iniziale è **\${formatInt(balance)} Mem€**.
Per maggiori informazioni dai un'occhiata alla
[guida di benvenuto](/r/BancaDelMeme/wiki/config/welcome_message).\`;
}

export const CREATE_EXISTS_ORG =
  'Non capisco se sei troppo entusiasta o stai cercando di truffarmi. Hai già un account!';

function headerInvestment(amount: number, initialUpvotes: number): string {
  return \`*\${formatInt(amount)} Mem€ investiti @ \${initialUpvotes} upvote*\\n\`;
}

export function modifyInvest(
  amount: number,
  initialUpvotes: number,
  newBalance: number,
  investmentDurationSeconds: number
): string {
  const durationVar = investmentDurationString(investmentDurationSeconds);
  return (
    headerInvestment(amount, initialUpvotes) +
    \`Il tuo investimento è ora attivo.
Valuterò il tuo profitto in \${durationVar}
e aggiornerò questo stesso commento. Non facciamo che ci perdiamo di vista!
Il tuo saldo attuale è **\${formatNumber(newBalance)} Mem€**.\`
  );
}

export function modifyInvestReturn(
  amount: number,
  initialUpvotes: number,
  finalUpvotes: number,
  returned: number,
  profit: number,
  newBalance: number
): string {
  let text = headerInvestment(amount, initialUpvotes);
  text += '\\nUPDATE: Il tuo investimento è maturato. ';
  if (profit > 0) {
    text += \`È andato alla grande! Hai guadagnato \${formatInt(profit)} Mem€\`;
  } else if (profit < 0) {
    text += \`Non è andato bene! Hai perso \${formatInt(-profit)} Mem€\`;
  } else {
    text += \`Sei andato in pari! Hai guadagnato \${formatInt(profit)} Mem€\`;
  }
  text += \` (\${Math.round((profit / amount) * 100)}%).\\n\`;
  text += \`\\n*\${formatInt(returned)} Mem€ restituiti @ \${formatInt(finalUpvotes)} upvote*\\n\`;
  text += \`\\nIl tuo nuovo saldo is **\${formatNumber(newBalance)} Mem€**.\`;
  return text;
}

export function modifyInvestCapped(
  amount: number,
  initialUpvotes: number,
  _finalUpvotes: number,
  _returned: number,
  profit: number,
  newBalance: number
): string {
  let text = headerInvestment(amount, initialUpvotes);
  text += '\\nUPDATE: Il tuo investimento è maturato. ';
  text += \`È andato alla grande! Hai guadagnato \${formatInt(profit)} Mem€\`;
  text += \` (\${Math.round((profit / amount) * 100)}%).\\n\`;
  text += \`**Congratulazioni,** hai raggiunto il saldo massimo!
Hai trionfato in questa sanguinosa competizione nel marketplace
e il tuo portafoglio è gonfissimo!
Le future generazioni ti ricorderanno come titano degli investimenti.
*"Alessandro pianse, poiché non c'erano altri mondi da conquistare.."* (...ancora)\\n\`;
  text += \`\\nIl tuo nuovo saldo is **\${formatInt(newBalance)} Mem€** (il saldo massimo).\`;
  return text;
}

export function notifyCapped(
  investor: InvestorRecord,
  permalink: string
): [string, string] {
  const text =
    \`L'investitore u/\${investor.name} ha raggiunto il limite di \${formatInt(investor.balance)} Mem€\` +
    \` con [questo investimento](\${permalink}).\` +
    '\\n\\n Valutate se chiudere la stagione.';
  return [\`Limite raggiunto per \${investor.name}\`, text];
}

export function modifyInsuff(balanceT: number): string {
  return \`Non hai abbastanza Mem€ per fare questo investimento.
Il tuo saldo attuale è **\${formatInt(balanceT)} Mem€**.
Se hai meno di 100 Mem€ e nessun investimento in corso, prova ad inviare \\\`!bancarotta\\\`!\`;
}

export function modifyBroke(times: number, newBalance: number): string {
  return \`OOps, sei in bancarotta.
Il tuo saldo è stato resettato a \${newBalance} Mem€. Sta attento la prossima volta.
Sei andato in bancarotta \${times} volte.\`;
}

export function modifyBrokeActive(active: number): string {
  let text = 'Hai ancora 1 investimento attivo.';
  if (active > 1) {
    text = \`Hai ancora \${active} investimenti attivi.\`;
  }
  return text + '\\n\\nDovrai attendere che vengano completati.';
}

export function modifyBrokeMoney(amount: number): string {
  return \`Non sei così povero! Hai ancora **\${amount} Mem€**.\`;
}

export const HELP_ORG = \`*Benvenuto su BancaDelMeme!*
Io sono un bot che vi aiuterà ad investire in *MEME* e farci una fortuna. Mica come le criptovalute.
Ecco una lista di tutti i comandi che funzionano con me:
### COMANDI GENERALI
- \\\`!attivi\\\` - Mostra gli investimenti attivi
- \\\`!saldo\\\` - Mostra quanti Mem€ si hanno ancora da spendere
- \\\`!bancarotta\\\` - Da usare se si scende sotto i 100 Mem€
- \\\`!crea\\\` - Crea un conto di investimento
- \\\`!aiuto\\\` - Mostra questo messaggio
- \\\`!investi <quantità>\\\` - Permette di investire i propri Mem€
- \\\`!investitutto\\\` - Permette di investire tutti i propri Mem€
- \\\`!mercato\\\` - Mostra il MeMercato Azionario attuale
- \\\`!top\\\` - Mostra i migliori investitori
- \\\`!vendi\\\` - Chiude in anticipo gli investimenti in quel topic (con penalità)
- \\\`!versione\\\` - Mostra la versione attuale del bot
- \\\`!template https://imgur.com/...\\\` **(solo per OP, utile per linkare i template)**
Per avere aiuto su un singolo comando, semplicemente scrivi \\\`!aiuto\\\`
Per altre informazioni e più dettagli,
fai riferimento alla [spiegazione estesa](https://www.reddit.com/r/BancaDelMeme/wiki/regolamento).\`;

export function modifyBalance(balance: number, netWorth: number): string {
  return \`Attualmente, il tuo saldo è **\${formatInt(balance)} Mem€**.
In investimenti hai \${formatInt(netWorth - balance)} Mem€ impegnati,
per un patrimonio totale di \${formatInt(netWorth)} Mem€.\`;
}

function formatHms(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return \`\${h}:\${String(m).padStart(2, '0')}:\${String(sec).padStart(2, '0')}\`;
}

export function modifyActive(
  activeInvestments: InvestmentRecord[],
  investmentDurationSeconds: number,
  nowEpochSeconds = Math.floor(Date.now() / 1000)
): string {
  if (activeInvestments.length === 0) {
    return 'Non hai alcun investimento attivo al momento.';
  }
  const lines = activeInvestments.map((inv, idx) => {
    const secondsRemaining = inv.time + investmentDurationSeconds - nowEpochSeconds;
    const remainingString =
      secondsRemaining > 0
        ? \`\${formatHms(secondsRemaining)} rimanenti\`
        : 'in elaborazione';
    return \`[#\${idx + 1}](/r/BancaDelMeme/comments/\${inv.post}/_/\${inv.comment}): \${formatInt(inv.amount)} Mem€ @ \${inv.upvotes} upvote (\${remainingString})\`;
  });
  return (
    \`Hai \${activeInvestments.length} investimenti attivi: \\n\\n\` +
    lines.join('\\n\\n')
  );
}

export function modifyMinInvest(minim: number): string {
  return \`L'investimento minimo consentito è
di 100 Mem€ o di \${formatInt(Math.round(minim))} (1% del tuo saldo);
il più alto dei due.\`;
}

export function modifyMarket(
  inves: number,
  cap: number,
  invsCap: number
): string {
  return \`Il mercato, in questo momento, ha **\${formatInt(inves)}** investimenti attivi.
Tutti gli investitori possiedono **\${formatInt(cap)} Mem€**.
Ci sono **\${formatInt(invsCap)} Mem€** in circolazione su investimenti al momento.\`;
}

export function modifyTop(
  leaders: Array<{ name: string; networth: number }>
): string {
  let topString =
    'Gli investitori con il valore netto più alto (saldo + investimenti attivi):\\n\\n';
  for (const leader of leaders) {
    topString += \`\\n\\n\${leader.name}: \${formatInt(leader.networth)} Mem€\`;
  }
  return topString;
}

const TEMPLATE_HINT_ORG = \`
---
Psst, %NAME%, puoi scrivere \\\`!template https://imgur.com/...\\\`
per pubblicare il template del tuo post! Alla fine è uno degli scopi di BancaDelMeme! ;)\`;

export const INVEST_PLACE_HERE_NO_FEE = \`**GLI INVESTIMENTI VANNO QUI - SOLO LE RISPOSTE DIRETTE A QUESTO MESSAGGIO VERRANNO ELABORATE**
Per prevenire spam e altri catastrofi naturali, considero solamente risposte a questo messaggio.
Altri comandi verranno ignorati e potrebbero addirittura venire penalizzati.
Teniamo il nostro MeMercato Azionario bello pulito!
---
Nuovo utente? Ti senti perso e confuso?
Rispondi \\\`!aiuto\\\` a questo messaggio,
o visita la pagina [Wiki](https://www.reddit.com/r/BancaDelMeme/wiki/index)
per una spiegazione più dettagliata.\`;

export function investNoFee(name: string): string {
  return INVEST_PLACE_HERE_NO_FEE + TEMPLATE_HINT_ORG.replace('%NAME%', name);
}

export const CLOSED_ORG = \`**La stagione è chiusa.**
Non è possibile fare nuovi investimenti.  I nuovi post sono comunque i benvenuti.\`;

export const MAINTENANCE_ORG = \`**Il bot è in manutenzione per ragioni tecniche.**
**Dovrebbe tornare online a breve. (Qualche ora)**
**Ci scusiamo per ogni disagio causato.**\`;

export const TEMPLATE_NOT_OP = 'Spiacente, ma non sei OP';
export const TEMPLATE_ALREADY_DONE =
  'Spiacente, ma hai già inviato il link template.';
export const TEMPLATE_NOT_STICKY =
  'Spiacente, ma devi rispondere *direttamente* al messaggio stickato del bot.';

export function modifyTemplateOp(link: string, name: string): string {
  return \`
---
OP \${name} ha postato *[IL LINK AL TEMPLATE](\${link})*, Evviva!\\n\\n\`;
}

export function modifyDeployVersion(date: string): string {
  return \`La versione corrente del bot è stata installata il \\\`\${date}\\\`\`;
}

export const TEMPLATE_SUCCESS =
  'Template postato con successo! Grazie per aver reso /r/BancaDelMeme un posto migliore!';

export function modifySellInvestment(
  numInvestments: number,
  taxes: number
): string {
  if (numInvestments < 1) {
    return 'Nessun investimento attivo trovato in questo post';
  }
  const plural = numInvestments > 1;
  const il = plural ? '' : 'l';
  const agg = plural ? 'i' : 'o';
  const verb = plural ? 'sono' : 'è';
  const tuo = plural ? 'i' : '';
  const verr = plural ? 'anno' : 'à';
  return \`I\${il} tuo\${tuo} investiment\${agg} \${verb} stat\${agg} decrementat\${agg} di \${formatNumber(taxes)} Mem€ e chius\${agg}.
A breve i\${il} comment\${agg} verr\${verr} aggiornat\${agg} con il risultato.\`;
}

export function modifyOcReturn(profit: number): string {
  return \`\\n\\n---\\n\\nGrazie del tuo OC!  Per premiarti ti è stato accreditato un bonus
pari all'1% degli investimenti (non tuoi) su questo post.
Hai guadagnato cosi \${formatInt(profit)} Mem€\`;
}

export const modifyOcCapped = \`\\n\\n---\\n\\nGrazie del tuo OC!  Per premiarti ti è stato accreditato un bonus
pari all'1% degli investimenti su questo post (ma non i tuoi).
Hai cosi raggiunto il saldo massimo!
Hai trionfato in questa sanguinosa competizione nel marketplace
e il tuo portafoglio è gonfissimo!
Le future generazioni ti ricorderanno come titano degli investimenti.
*"Alessandro pianse, poiché non c'erano altri mondi da conquistare.."*\`;

export function cmdSconosciuto(): string {
  return 'Non conosco il comando che mi hai inviato, il tuo messaggio è stato ignorato.';
}

export function rimozione(rule: string, extra?: string): string {
  const extraStr = extra ? \`: \${extra}\` : '';
  return \`Il tuo post è stato rimosso
perché non rispetta la regola \${rule}\${extraStr}.
Controlla [le regole](/r/BancaDelMeme/about/rules/), sono poche ma importanti.  Se hai dubbi [contattaci](/message/compose/?to=/r/BancaDelMeme).\`;
}
`,
  },
  {
    path: 'src/server/models.ts',
    originalEquivalent: 'src/models.py + posts.sqlite3',
    category: 'core',
    language: 'typescript',
    summary:
      'Layer dati nativo su Devvit Redis equivalente alle tabelle Investors, Investments, Buyables e alla tabella Telegram posts.',
    content: `import { redis } from '@devvit/web/server';

export interface InvestorRecord {
  name: string;
  balance: number;
  completed: number;
  broke: number;
}

export interface InvestmentRecord {
  id: string;
  post: string;
  upvotes: number;
  deltatime: number;
  comment: string;
  name: string;
  amount: number;
  time: number;
  done: boolean;
  response: string;
  final_upvotes: number;
  success: boolean;
  profit: number;
  net_worth: number;
  top_networth: number;
  balance: number;
  op: boolean;
}

export interface BuyableRecord {
  post: string;
  time: number;
  response: string;
  oc: boolean;
  done: boolean;
  name: string;
  final_upvotes: number;
  profit: number;
  balance: number;
}

export const KEYS = {
  investor: (name: string) => \`bdb:investor:\${name}\`,
  investorsAll: 'bdb:investors:all',
  investorActive: (name: string) => \`bdb:investor:\${name}:active\`,
  leaderboard: 'bdb:leaderboard:networth',
  investment: (id: string) => \`bdb:investment:\${id}\`,
  investmentsPending: 'bdb:investments:pending',
  postInvestments: (postId: string) => \`bdb:post:\${postId}:investments\`,
  invSeq: 'bdb:seq:investment',
  buyable: (postId: string) => \`bdb:buyable:\${postId}\`,
  buyablesAll: 'bdb:buyables:all',
  buyablesPending: 'bdb:buyables:pending',
  templateDone: (postId: string) => \`bdb:template:\${postId}\`,
  tgPosts: 'bdb:tg:posts',
  tgPostsOrder: 'bdb:tg:order',
};

export async function getInvestor(name: string): Promise<InvestorRecord | null> {
  const raw = await redis.hGetAll(KEYS.investor(name));
  if (!raw || !raw.name) {
    return null;
  }
  return {
    name: raw.name,
    balance: Number(raw.balance ?? 0),
    completed: Number(raw.completed ?? 0),
    broke: Number(raw.broke ?? 0),
  };
}

export async function createInvestor(
  name: string,
  startingBalance: number
): Promise<InvestorRecord> {
  const inv: InvestorRecord = {
    name,
    balance: startingBalance,
    completed: 0,
    broke: 0,
  };
  await saveInvestor(inv);
  await redis.hSet(KEYS.investorsAll, { [name]: '1' });
  await redis.zAdd(KEYS.leaderboard, { member: name, score: startingBalance });
  return inv;
}

export async function saveInvestor(investor: InvestorRecord): Promise<void> {
  await redis.hSet(KEYS.investor(investor.name), {
    name: investor.name,
    balance: String(Math.trunc(investor.balance)),
    completed: String(Math.trunc(investor.completed)),
    broke: String(Math.trunc(investor.broke)),
  });
  await redis.hSet(KEYS.investorsAll, { [investor.name]: '1' });
  await refreshLeaderboardScore(investor.name, investor.balance);
}

export async function getActiveInvestmentsForUser(
  name: string
): Promise<InvestmentRecord[]> {
  const activeMap = await redis.hGetAll(KEYS.investorActive(name));
  const ids = Object.keys(activeMap);
  if (ids.length === 0) return [];
  const list = await Promise.all(ids.map((id) => getInvestment(id)));
  return list
    .filter((inv): inv is InvestmentRecord => inv !== null && !inv.done)
    .sort((a, b) => a.time - b.time);
}

export async function getInvestorNetworth(name: string): Promise<number> {
  const investor = await getInvestor(name);
  if (!investor) return 0;
  const active = await getActiveInvestmentsForUser(name);
  const investedSum = active.reduce((acc, inv) => acc + inv.amount, 0);
  return investor.balance + investedSum;
}

export async function refreshLeaderboardScore(
  name: string,
  knownBalance?: number
): Promise<void> {
  let balance = knownBalance;
  if (balance === undefined) {
    const inv = await getInvestor(name);
    if (!inv) return;
    balance = inv.balance;
  }
  const active = await getActiveInvestmentsForUser(name);
  const investedSum = active.reduce((acc, item) => acc + item.amount, 0);
  await redis.zAdd(KEYS.leaderboard, {
    member: name,
    score: balance + investedSum,
  });
}

export async function getTopInvestors(
  limit = 5
): Promise<Array<{ name: string; networth: number }>> {
  const rows = await redis.zRange(KEYS.leaderboard, 0, limit - 1, {
    by: 'rank',
    reverse: true,
  });
  return rows.map((r) => ({ name: r.member, networth: r.score }));
}

export async function getTopNetworth(startingBalance: number): Promise<number> {
  const top = await getTopInvestors(1);
  const best = top[0]?.networth ?? 0;
  return Math.max(best, startingBalance * 10);
}

export async function getAllInvestorNames(): Promise<string[]> {
  const allMap = await redis.hGetAll(KEYS.investorsAll);
  return Object.keys(allMap);
}

export async function getInvestment(
  id: string
): Promise<InvestmentRecord | null> {
  const raw = await redis.hGetAll(KEYS.investment(id));
  if (!raw || !raw.id) return null;
  return {
    id: raw.id,
    post: raw.post,
    upvotes: Number(raw.upvotes ?? 0),
    deltatime: Number(raw.deltatime ?? 0),
    comment: raw.comment,
    name: raw.name,
    amount: Number(raw.amount ?? 0),
    time: Number(raw.time ?? 0),
    done: raw.done === '1',
    response: raw.response ?? '0',
    final_upvotes: Number(raw.final_upvotes ?? 0),
    success: raw.success === '1',
    profit: Number(raw.profit ?? 0),
    net_worth: Number(raw.net_worth ?? 0),
    top_networth: Number(raw.top_networth ?? 0),
    balance: Number(raw.balance ?? 0),
    op: raw.op === '1',
  };
}

export async function createInvestment(
  data: Omit<
    InvestmentRecord,
    | 'id'
    | 'final_upvotes'
    | 'success'
    | 'profit'
    | 'net_worth'
    | 'top_networth'
    | 'balance'
    | 'op'
  >
): Promise<InvestmentRecord> {
  const seq = await redis.incrBy(KEYS.invSeq, 1);
  const id = String(seq);
  const record: InvestmentRecord = {
    ...data,
    id,
    final_upvotes: 0,
    success: false,
    profit: 0,
    net_worth: 0,
    top_networth: 0,
    balance: 0,
    op: false,
  };
  await saveInvestment(record);
  await redis.hSet(KEYS.postInvestments(record.post), { [id]: '1' });
  return record;
}

export async function saveInvestment(inv: InvestmentRecord): Promise<void> {
  await redis.hSet(KEYS.investment(inv.id), {
    id: inv.id,
    post: inv.post,
    upvotes: String(inv.upvotes),
    deltatime: String(inv.deltatime),
    comment: inv.comment,
    name: inv.name,
    amount: String(Math.trunc(inv.amount)),
    time: String(Math.trunc(inv.time)),
    done: inv.done ? '1' : '0',
    response: inv.response,
    final_upvotes: String(inv.final_upvotes),
    success: inv.success ? '1' : '0',
    profit: String(Math.trunc(inv.profit)),
    net_worth: String(Math.trunc(inv.net_worth)),
    top_networth: String(Math.trunc(inv.top_networth)),
    balance: String(Math.trunc(inv.balance)),
    op: inv.op ? '1' : '0',
  });
  await redis.hSet(KEYS.postInvestments(inv.post), { [inv.id]: '1' });
  if (inv.done) {
    await redis.hDel(KEYS.investorActive(inv.name), [inv.id]);
    await redis.zRem(KEYS.investmentsPending, [inv.id]);
  } else {
    await redis.hSet(KEYS.investorActive(inv.name), { [inv.id]: '1' });
    await redis.zAdd(KEYS.investmentsPending, { member: inv.id, score: inv.time });
  }
}

export async function getMatureInvestments(
  durationSeconds: number
): Promise<InvestmentRecord[]> {
  const cutoff = Math.floor(Date.now() / 1000) - durationSeconds;
  const rows = await redis.zRange(KEYS.investmentsPending, 0, cutoff, {
    by: 'score',
  });
  const list = await Promise.all(rows.map((r) => getInvestment(r.member)));
  return list.filter((x): x is InvestmentRecord => x !== null && !x.done);
}

export async function getPostInvestments(
  postId: string
): Promise<InvestmentRecord[]> {
  const map = await redis.hGetAll(KEYS.postInvestments(postId));
  const ids = Object.keys(map);
  if (ids.length === 0) return [];
  const list = await Promise.all(ids.map((id) => getInvestment(id)));
  return list.filter((x): x is InvestmentRecord => x !== null);
}

export async function getMarketStats(): Promise<{
  activeCount: number;
  totalBalance: number;
  investedSum: number;
}> {
  const pendingRows = await redis.zRange(KEYS.investmentsPending, 0, -1, {
    by: 'rank',
  });
  const activeInvs = await Promise.all(
    pendingRows.map((r) => getInvestment(r.member))
  );
  let investedSum = 0;
  let activeCount = 0;
  for (const inv of activeInvs) {
    if (inv && !inv.done) {
      activeCount += 1;
      investedSum += inv.amount;
    }
  }
  const names = await getAllInvestorNames();
  const investors = await Promise.all(names.map((n) => getInvestor(n)));
  const totalBalance = investors.reduce(
    (acc, u) => acc + (u ? u.balance : 0),
    0
  );
  return { activeCount, totalBalance, investedSum };
}

export async function createBuyable(
  postId: string,
  name: string,
  responseId: string
): Promise<BuyableRecord> {
  const now = Math.floor(Date.now() / 1000);
  const record: BuyableRecord = {
    post: postId,
    time: now,
    response: responseId,
    oc: false,
    done: false,
    name,
    final_upvotes: 0,
    profit: 0,
    balance: 0,
  };
  await saveBuyable(record);
  return record;
}

export async function getBuyable(postId: string): Promise<BuyableRecord | null> {
  const raw = await redis.hGetAll(KEYS.buyable(postId));
  if (!raw || !raw.post) return null;
  return {
    post: raw.post,
    time: Number(raw.time ?? 0),
    response: raw.response ?? '0',
    oc: raw.oc === '1',
    done: raw.done === '1',
    name: raw.name,
    final_upvotes: Number(raw.final_upvotes ?? 0),
    profit: Number(raw.profit ?? 0),
    balance: Number(raw.balance ?? 0),
  };
}

export async function saveBuyable(b: BuyableRecord): Promise<void> {
  await redis.hSet(KEYS.buyable(b.post), {
    post: b.post,
    time: String(b.time),
    response: b.response,
    oc: b.oc ? '1' : '0',
    done: b.done ? '1' : '0',
    name: b.name,
    final_upvotes: String(b.final_upvotes),
    profit: String(Math.trunc(b.profit)),
    balance: String(Math.trunc(b.balance)),
  });
  await redis.hSet(KEYS.buyablesAll, { [b.post]: '1' });
  if (b.done) {
    await redis.zRem(KEYS.buyablesPending, [b.post]);
  } else {
    await redis.zAdd(KEYS.buyablesPending, { member: b.post, score: b.time });
  }
}

export async function deleteBuyable(postId: string): Promise<void> {
  await redis.zRem(KEYS.buyablesPending, [postId]);
  await redis.hDel(KEYS.buyablesAll, [postId]);
  await redis.del(KEYS.buyable(postId));
}

export async function getMatureBuyables(
  durationSeconds: number
): Promise<BuyableRecord[]> {
  const cutoff = Math.floor(Date.now() / 1000) - durationSeconds;
  const rows = await redis.zRange(KEYS.buyablesPending, 0, cutoff, {
    by: 'score',
  });
  const list = await Promise.all(rows.map((r) => getBuyable(r.member)));
  return list.filter((x): x is BuyableRecord => x !== null && !x.done);
}

export async function getAllBuyables(): Promise<BuyableRecord[]> {
  const map = await redis.hGetAll(KEYS.buyablesAll);
  const ids = Object.keys(map);
  const list = await Promise.all(ids.map((id) => getBuyable(id)));
  return list.filter((x): x is BuyableRecord => x !== null);
}

export async function saveTelegramPost(
  rid: string,
  tid: string | null
): Promise<void> {
  await redis.hSet(KEYS.tgPosts, { [rid]: tid ?? '' });
  await redis.zAdd(KEYS.tgPostsOrder, {
    member: rid,
    score: Math.floor(Date.now() / 1000),
  });
}

export async function getTelegramPost(rid: string): Promise<string | null> {
  const map = await redis.hGetAll(KEYS.tgPosts);
  if (!(rid in map)) return null;
  return map[rid] || '';
}

export async function getLatestTelegramPosts(
  limit = 4
): Promise<Array<{ rid: string; tid: string }>> {
  const rows = await redis.zRange(KEYS.tgPostsOrder, 0, limit - 1, {
    by: 'rank',
    reverse: true,
  });
  const map = await redis.hGetAll(KEYS.tgPosts);
  return rows
    .map((r) => ({ rid: r.member, tid: map[r.member] ?? '' }))
    .filter((item) => Boolean(item.tid));
}

export async function deleteTelegramPost(rid: string): Promise<void> {
  await redis.hDel(KEYS.tgPosts, [rid]);
  await redis.zRem(KEYS.tgPostsOrder, [rid]);
}

export async function getPendingCounts(): Promise<{
  investments: number;
  buyables: number;
}> {
  const [invRows, buyRows] = await Promise.all([
    redis.zRange(KEYS.investmentsPending, 0, -1, { by: 'rank' }),
    redis.zRange(KEYS.buyablesPending, 0, -1, { by: 'rank' }),
  ]);
  return { investments: invRows.length, buyables: buyRows.length };
}

export async function clearSeasonData(): Promise<{
  investors: number;
  investments: number;
  buyables: number;
}> {
  const investorNames = await getAllInvestorNames();
  const buyables = await getAllBuyables();
  const seq = Number((await redis.get(KEYS.invSeq)) ?? '0');

  for (const name of investorNames) {
    await redis.del(KEYS.investor(name));
    await redis.del(KEYS.investorActive(name));
  }
  for (let i = 1; i <= seq; i += 1) {
    await redis.del(KEYS.investment(String(i)));
  }
  for (const b of buyables) {
    await redis.del(KEYS.buyable(b.post));
    await redis.del(KEYS.postInvestments(b.post));
    await redis.del(KEYS.templateDone(b.post));
  }

  await redis.del(KEYS.investorsAll);
  await redis.del(KEYS.leaderboard);
  await redis.del(KEYS.investmentsPending);
  await redis.del(KEYS.buyablesAll);
  await redis.del(KEYS.buyablesPending);
  await redis.set(KEYS.invSeq, '0');

  return {
    investors: investorNames.length,
    investments: seq,
    buyables: buyables.length,
  };
}
`,
  },
  {
    path: 'src/server/telegram.ts',
    originalEquivalent: 'src/submitter.py (post_telegram + clean_removed)',
    category: 'workers',
    language: 'typescript',
    summary:
      'Porting 1:1 del bridge Telegram originale via Telegram Bot API (sendPhoto con fallback sendMessage e rimozione automatica dei post moderati).',
    content: `import { reddit } from '@devvit/web/server';
import type { BotConfig } from './config.js';
import {
  deleteTelegramPost,
  getLatestTelegramPosts,
  saveTelegramPost,
} from './models.js';
import { toFullPostId } from './utils.js';

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function callTelegram(
  token: string,
  method: 'sendPhoto' | 'sendMessage' | 'deleteMessage',
  payload: Record<string, unknown>
): Promise<{ ok: boolean; result?: { message_id?: number } }> {
  const res = await fetch(\`https://api.telegram.org/bot\${token}/\${method}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return { ok: false };
  }
  return (await res.json()) as { ok: boolean; result?: { message_id?: number } };
}

export async function postTelegram(
  postId: string,
  permalink: string,
  rawTitle: string,
  url: string,
  domain: string,
  cfg: BotConfig
): Promise<void> {
  if (!cfg.TG_TOKEN || !cfg.TG_CHANNEL) {
    return;
  }

  const link = \`https://reddit.com\${encodeURI(permalink)}\`;
  let title = escapeHtml(rawTitle || '');
  if (title.length <= 3) {
    title = 'Titolo: ' + title;
  }
  const text = \`<a href='\${link}'>\${title}</a>\`;

  const ext = url.split('.').pop()?.toLowerCase() ?? '';
  const isImage =
    domain === 'i.redd.it' || ext === 'png' || ext === 'jpg' || ext === 'jpeg';

  let msgId: number | undefined;
  try {
    if (isImage) {
      const photoRes = await callTelegram(cfg.TG_TOKEN, 'sendPhoto', {
        chat_id: cfg.TG_CHANNEL,
        parse_mode: 'HTML',
        caption: text,
        photo: url,
      });
      if (photoRes.ok && photoRes.result?.message_id) {
        msgId = photoRes.result.message_id;
      }
    }

    if (!msgId) {
      const msgRes = await callTelegram(cfg.TG_TOKEN, 'sendMessage', {
        chat_id: cfg.TG_CHANNEL,
        parse_mode: 'HTML',
        text,
      });
      if (msgRes.ok && msgRes.result?.message_id) {
        msgId = msgRes.result.message_id;
      }
    }
  } catch {
    // Richiede approvazione dominio api.telegram.org nelle Developer Settings Devvit
  }

  if (msgId) {
    await saveTelegramPost(postId, String(msgId));
  } else {
    await saveTelegramPost(postId, null);
  }
}

export async function cleanRemovedTelegram(cfg: BotConfig): Promise<void> {
  if (!cfg.TG_TOKEN || !cfg.TG_CHANNEL) {
    return;
  }
  const latest = await getLatestTelegramPosts(4);
  for (const row of latest) {
    const post = await reddit
      .getPostById(toFullPostId(row.rid))
      .catch(() => null);
    if (post && (post.removedByCategory || post.removed)) {
      await callTelegram(cfg.TG_TOKEN, 'deleteMessage', {
        chat_id: cfg.TG_CHANNEL,
        message_id: Number(row.tid),
      }).catch(() => undefined);
      await deleteTelegramPost(row.rid);
    }
  }
}
`,
  },
  {
    path: 'src/server/submitter.ts',
    originalEquivalent: 'src/submitter.py',
    category: 'workers',
    language: 'typescript',
    summary:
      'Trigger onPostCreate: evita duplicati, pubblica su Telegram, fissa il commento ufficiale del bot come moderatore e crea il record Buyable.',
    content: `import { reddit } from '@devvit/web/server';
import type { OnPostCreateRequest } from '@devvit/web/shared';
import type { BotConfig } from './config.js';
import * as message from './message.js';
import { createBuyable, getBuyable, getTelegramPost } from './models.js';
import { postTelegram } from './telegram.js';
import { normalizeCommentId, normalizePostId, toFullPostId } from './utils.js';

export async function handlePostCreate(
  event: OnPostCreateRequest,
  cfg: BotConfig
): Promise<void> {
  const rawPostId = event.post?.id;
  if (!rawPostId) return;

  const postId = normalizePostId(rawPostId);
  const existingTg = await getTelegramPost(postId);
  const post = await reddit.getPostById(toFullPostId(rawPostId));

  if (existingTg === null || existingTg === '') {
    await postTelegram(
      postId,
      post.permalink,
      post.title,
      post.url,
      post.domain ?? '',
      cfg
    );
    if (existingTg !== null) {
      return;
    }
  } else {
    return;
  }

  const existingBuyable = await getBuyable(postId);
  if (existingBuyable) {
    return;
  }

  if (post.isStickied() || post.distinguishedBy) {
    return;
  }

  const authorName = event.author?.name ?? post.authorName ?? 'utente';
  if (!cfg.POST_TO_REDDIT) {
    return;
  }

  const body = cfg.CLOSED
    ? message.CLOSED_ORG
    : message.investNoFee(\`u/\${authorName}\`);

  const botComment = await reddit.submitComment({
    id: post.id,
    text: body,
  });

  if (cfg.IS_MODERATOR) {
    await botComment.distinguish(true);
    await botComment.approve();
    if (cfg.CLOSED) {
      await botComment.lock();
      return;
    }
  }

  if (!cfg.CLOSED) {
    await createBuyable(
      postId,
      authorName,
      normalizeCommentId(botComment.id)
    );
  }
}
`,
  },
  {
    path: 'src/server/comment_worker.ts',
    originalEquivalent: 'src/comment_worker.py',
    category: 'workers',
    language: 'typescript',
    summary:
      'Trigger onCommentCreate: verifica le risposte dirette al bot, esegue tutti i comandi originali (!investi, !investitutto, !saldo, !bancarotta, !attivi, !vendi, !mercato, !top, !crea, !aiuto, !template, !versione, !rimuovi).',
    content: `import { reddit, redis } from '@devvit/web/server';
import type { OnCommentCreateRequest } from '@devvit/web/shared';
import type { BotConfig } from './config.js';
import { helpDict } from './help_info.js';
import * as message from './message.js';
import {
  KEYS,
  createInvestor,
  createInvestment,
  getActiveInvestmentsForUser,
  getInvestor,
  getInvestorNetworth,
  getMarketStats,
  getPostInvestments,
  getTopInvestors,
  refreshLeaderboardScore,
  saveInvestment,
  saveInvestor,
  type InvestorRecord,
} from './models.js';
import {
  getDeployDate,
  normalizeCommentId,
  normalizePostId,
  toFullCommentId,
  toFullPostId,
} from './utils.js';

const MULTIPLIERS: Record<string, number | '%'> = {
  k: 1e3,
  m: 1e6,
  b: 1e9,
  t: 1e12,
  quad: 1e15,
  quin: 1e18,
  q: 1e15,
  '%': '%',
};

const MULT_PATTERN = Object.keys(MULTIPLIERS).join('|');

const COMMAND_REGEXES: RegExp[] = [
  /^!attivi$/im,
  /^!saldo$/im,
  /^!bancarotta$/im,
  /^!create$/im,
  /^!crea$/im,
  /^!aiuto\\s*!?(.+)?$/im,
  /^!ignora$/im,
  new RegExp(\`^!investi\\\\s+([\\\\d,.]+)\\\\s*(\${MULT_PATTERN})?(?:\\\\s|$)\`, 'im'),
  new RegExp(\`^!invest\\\\s+([\\\\d,.]+)\\\\s*(\${MULT_PATTERN})?(?:\\\\s|$)\`, 'im'),
  /^!mercato$/im,
  /^!top$/im,
  /^!versione$/im,
  /^!template\\s+(https:\\/\\/\\S+)$/im,
  /^!template\\s+\\[(https:\\/\\/\\S+)\\]\\(\\1\\)$/im,
  /^!vendi$/im,
  /^!investitutto$/im,
  /^!rimuovi\\s+(\\d)$/im,
];

async function replyToComment(
  commentId: string,
  text: string,
  cfg: BotConfig
): Promise<string> {
  if (!cfg.POST_TO_REDDIT) {
    return '0';
  }
  const reply = await reddit.submitComment({
    id: toFullCommentId(commentId),
    text,
  });
  return normalizeCommentId(reply.id);
}

async function ensureInvestor(
  authorName: string,
  commentId: string,
  cfg: BotConfig
): Promise<InvestorRecord> {
  const existing = await getInvestor(authorName);
  if (existing) return existing;
  const created = await createInvestor(authorName, cfg.STARTING_BALANCE);
  await replyToComment(
    commentId,
    message.modifyCreate(authorName, cfg.STARTING_BALANCE),
    cfg
  );
  return created;
}

export async function handleCommentCreate(
  event: OnCommentCreateRequest,
  cfg: BotConfig
): Promise<void> {
  const comment = event.comment;
  const authorName = event.author?.name;
  if (!comment || !authorName) return;

  // Ignora commenti root (solo risposte a commenti)
  if (!comment.parentId || !comment.parentId.startsWith('t1_')) {
    return;
  }

  // Ignora commenti inviati dal bot stesso
  const appUsername = await reddit
    .getAppUser()
    .then((u) => u.username)
    .catch(() => '');
  if (appUsername && authorName.toLowerCase() === appUsername.toLowerCase()) {
    return;
  }

  // Verifica che il commento genitore appartenga al bot (equivalente della inbox comment_replies)
  const parentComment = await reddit.getCommentById(
    toFullCommentId(comment.parentId)
  );
  if (
    appUsername &&
    parentComment.authorName.toLowerCase() !== appUsername.toLowerCase()
  ) {
    return;
  }

  // Ignora commenti più vecchi di 15 minuti
  const createdAtSec = Math.floor(new Date(comment.createdAt).getTime() / 1000);
  if (Math.floor(Date.now() / 1000) - createdAtSec > 900) {
    return;
  }

  if (cfg.MAINTENANCE) {
    await replyToComment(comment.id, message.MAINTENANCE_ORG, cfg);
    return;
  }

  const body = (comment.body ?? '').trim();
  for (const reg of COMMAND_REGEXES) {
    const matches = reg.exec(body);
    if (!matches) continue;

    const cmdWord = matches[0].trim().split(/\\s+/)[0].slice(1).toLowerCase();
    const arg1 = matches[1];
    const arg2 = matches[2];

    switch (cmdWord) {
      case 'ignora':
        return;

      case 'aiuto': {
        if (!arg1) {
          await replyToComment(comment.id, message.HELP_ORG, cfg);
          return;
        }
        const key = arg1.trim().toLowerCase();
        const helpMsg =
          \`COMMAND \\\`!\${key}\\\`\` +
          (helpDict[key] ??
            'Comando non trovato, assicurati di averlo scritto correttamente.');
        await replyToComment(comment.id, helpMsg, cfg);
        return;
      }

      case 'mercato': {
        const stats = await getMarketStats();
        await replyToComment(
          comment.id,
          message.modifyMarket(
            stats.activeCount,
            stats.totalBalance,
            stats.investedSum
          ),
          cfg
        );
        return;
      }

      case 'top': {
        const leaders = await getTopInvestors(5);
        await replyToComment(comment.id, message.modifyTop(leaders), cfg);
        return;
      }

      case 'create':
      case 'crea': {
        const existing = await getInvestor(authorName);
        if (existing) {
          await replyToComment(comment.id, message.CREATE_EXISTS_ORG, cfg);
          return;
        }
        await createInvestor(authorName, cfg.STARTING_BALANCE);
        await replyToComment(
          comment.id,
          message.modifyCreate(authorName, cfg.STARTING_BALANCE),
          cfg
        );
        return;
      }

      case 'investi':
      case 'invest': {
        const investor = await ensureInvestor(authorName, comment.id, cfg);
        await executeInvest(investor, event, cfg, arg1, arg2);
        return;
      }

      case 'investitutto': {
        const investor = await ensureInvestor(authorName, comment.id, cfg);
        await executeInvest(
          investor,
          event,
          cfg,
          String(investor.balance),
          undefined
        );
        return;
      }

      case 'saldo': {
        const investor = await ensureInvestor(authorName, comment.id, cfg);
        const netWorth = await getInvestorNetworth(authorName);
        await replyToComment(
          comment.id,
          message.modifyBalance(investor.balance, netWorth),
          cfg
        );
        return;
      }

      case 'bancarotta': {
        const investor = await ensureInvestor(authorName, comment.id, cfg);
        if (investor.balance >= cfg.STARTING_BALANCE * 0.5) {
          await replyToComment(
            comment.id,
            message.modifyBrokeMoney(investor.balance),
            cfg
          );
          return;
        }
        const active = await getActiveInvestmentsForUser(authorName);
        if (active.length > 0) {
          await replyToComment(
            comment.id,
            message.modifyBrokeActive(active.length),
            cfg
          );
          return;
        }
        investor.balance = Math.floor(cfg.STARTING_BALANCE * 0.9);
        investor.broke += 1;
        await saveInvestor(investor);
        await replyToComment(
          comment.id,
          message.modifyBroke(investor.broke, cfg.STARTING_BALANCE),
          cfg
        );
        return;
      }

      case 'attivi': {
        await ensureInvestor(authorName, comment.id, cfg);
        const active = await getActiveInvestmentsForUser(authorName);
        await replyToComment(
          comment.id,
          message.modifyActive(active, cfg.INVESTMENT_DURATION),
          cfg
        );
        return;
      }

      case 'template': {
        const postId = normalizePostId(comment.postId);
        const post = await reddit.getPostById(toFullPostId(comment.postId));
        if (post.authorName !== authorName) {
          await replyToComment(comment.id, message.TEMPLATE_NOT_OP, cfg);
          return;
        }
        if (!parentComment.isStickied()) {
          await replyToComment(comment.id, message.TEMPLATE_NOT_STICKY, cfg);
          return;
        }
        const alreadySet = await redis.get(KEYS.templateDone(postId));
        if (parentComment.edited || alreadySet === '1') {
          await replyToComment(comment.id, message.TEMPLATE_ALREADY_DONE, cfg);
          return;
        }
        const editedResponse =
          message.modifyTemplateOp(arg1, \`u/\${authorName}\`) +
          message.INVEST_PLACE_HERE_NO_FEE;
        if (cfg.POST_TO_REDDIT) {
          await parentComment.edit({ text: editedResponse });
        }
        await redis.set(KEYS.templateDone(postId), '1');
        await replyToComment(comment.id, message.TEMPLATE_SUCCESS, cfg);
        return;
      }

      case 'versione': {
        const deployDate = await getDeployDate(redis);
        await replyToComment(
          comment.id,
          message.modifyDeployVersion(deployDate),
          cfg
        );
        return;
      }

      case 'vendi': {
        if (cfg.CLOSED) {
          await replyToComment(comment.id, message.CLOSED_ORG, cfg);
          return;
        }
        await ensureInvestor(authorName, comment.id, cfg);
        const postId = normalizePostId(comment.postId);
        const post = await reddit.getPostById(toFullPostId(comment.postId));
        const allForPost = await getPostInvestments(postId);
        const activeUserPostInvs = allForPost
          .filter((i) => !i.done && i.name === authorName)
          .sort((a, b) => a.time - b.time);

        let taxes = 0;
        const nowSec = Math.floor(Date.now() / 1000);
        for (const inv of activeUserPostInvs) {
          if (!post.removedByCategory) {
            const remaining = cfg.INVESTMENT_DURATION - nowSec + inv.time;
            const hoursLeft = Math.max(0, remaining) / 3600;
            const tax = Math.min(99, Math.pow(hoursLeft, 1.5)) / 100;
            const nextAmount = Math.round(inv.amount - inv.amount * tax);
            taxes += inv.amount - nextAmount;
            inv.amount = nextAmount;
          }
          inv.time = nowSec - cfg.INVESTMENT_DURATION;
          await saveInvestment(inv);
        }
        await refreshLeaderboardScore(authorName);
        await replyToComment(
          comment.id,
          message.modifySellInvestment(activeUserPostInvs.length, taxes),
          cfg
        );
        return;
      }

      case 'rimuovi': {
        if (!cfg.ADMIN_ACCOUNTS.includes(authorName)) {
          await replyToComment(comment.id, message.cmdSconosciuto(), cfg);
          return;
        }
        const post = await reddit.getPostById(toFullPostId(comment.postId));
        const subName = post.subredditName;
        let extra: string | undefined;
        const rules = await reddit
          .getSubredditRemovalReasons(subName)
          .catch(() => []);
        const idx = Number(arg1) - 1;
        if (rules[idx]?.message) {
          extra = rules[idx].message;
        }
        if (cfg.POST_TO_REDDIT) {
          const modReply = await reddit.submitComment({
            id: post.id,
            text: message.rimozione(arg1, extra),
          });
          await post.remove();
          const cmdComment = await reddit.getCommentById(
            toFullCommentId(comment.id)
          );
          await cmdComment.remove();
          await modReply.lock();
        }
        return;
      }
    }
  }

  await replyToComment(comment.id, message.cmdSconosciuto(), cfg);
}

async function executeInvest(
  investor: InvestorRecord,
  event: OnCommentCreateRequest,
  cfg: BotConfig,
  rawAmount: string,
  rawSuffix?: string
): Promise<void> {
  const comment = event.comment!;
  if (cfg.CLOSED) {
    await replyToComment(comment.id, message.CLOSED_ORG, cfg);
    return;
  }

  const suffix = rawSuffix?.toLowerCase();
  const mult = suffix ? MULTIPLIERS[suffix] ?? 1 : 1;
  let amount = 0;

  if (mult === '%') {
    const pct = Number.parseInt(rawAmount, 10);
    if (Number.isNaN(pct)) return;
    amount = Math.floor(investor.balance * (pct / 100));
  } else {
    const parsed = Number.parseInt(rawAmount.replace(/,/g, ''), 10);
    if (Number.isNaN(parsed)) return;
    amount = parsed * mult;
  }

  const minim = Math.floor(investor.balance / 100);
  if (amount < minim || amount < 100) {
    await replyToComment(comment.id, message.modifyMinInvest(minim), cfg);
    return;
  }

  const newBalance = investor.balance - amount;
  if (newBalance < 0) {
    await replyToComment(comment.id, message.modifyInsuff(investor.balance), cfg);
    return;
  }

  const post = await reddit.getPostById(toFullPostId(comment.postId));
  const upvotesNow = Math.max(1, Math.trunc(post.score));
  const commentSec = Math.floor(new Date(comment.createdAt).getTime() / 1000);
  const postSec = Math.floor(post.createdAt.getTime() / 1000);
  const deltatime = Math.min(Math.floor((commentSec - postSec) / 60), 60);

  const responseId = await replyToComment(
    comment.id,
    message.modifyInvest(
      amount,
      upvotesNow,
      newBalance,
      cfg.INVESTMENT_DURATION
    ),
    cfg
  );

  investor.balance = newBalance;
  await createInvestment({
    post: normalizePostId(comment.postId),
    upvotes: upvotesNow,
    deltatime,
    comment: normalizeCommentId(comment.id),
    name: investor.name,
    amount,
    time: Math.floor(Date.now() / 1000),
    done: false,
    response: responseId,
  });
  await saveInvestor(investor);
}
`,
  },
  {
    path: 'src/server/calculator.ts',
    originalEquivalent: 'src/calculator.py',
    category: 'workers',
    language: 'typescript',
    summary:
      'Job schedulato di chiusura investimenti scaduti: legge gli upvote aggiornati, calcola la formula, applica OP_BONUS, protezione rimozione mod, BALANCE_CAP e auto-bancarotta.',
    content: `import { reddit } from '@devvit/web/server';
import type { BotConfig } from './config.js';
import * as formula from './formula.js';
import * as message from './message.js';
import {
  getActiveInvestmentsForUser,
  getInvestor,
  getInvestorNetworth,
  getMatureInvestments,
  getTopNetworth,
  saveInvestment,
  saveInvestor,
} from './models.js';
import { BALANCE_CAP, toFullCommentId, toFullPostId } from './utils.js';

export async function processMatureInvestments(cfg: BotConfig): Promise<void> {
  const matureList = await getMatureInvestments(cfg.INVESTMENT_DURATION);
  if (matureList.length === 0) return;

  let topNetworth = await getTopNetworth(cfg.STARTING_BALANCE);

  for (const investment of matureList) {
    const investor = await getInvestor(investment.name);
    if (!investor) {
      investment.done = true;
      await saveInvestment(investment);
      continue;
    }

    const netWorth = await getInvestorNetworth(investor.name);
    const post = await reddit.getPostById(toFullPostId(investment.post));
    const upvotesNow = post.score;

    investment.final_upvotes = upvotesNow;
    investment.op = Boolean(post.authorName && investor.name === post.authorName);
    investment.net_worth = netWorth;
    investment.top_networth = topNetworth;

    let factor = formula.calculate(
      upvotesNow,
      investment.upvotes,
      netWorth,
      topNetworth
    );
    if (factor > 1 && post.authorName && investor.name === post.authorName) {
      factor *= formula.OP_BONUS;
    }
    if (factor < 1 && post.removedByCategory === 'moderator') {
      factor = 1;
    }

    const amount = investment.amount;
    const balance = investor.balance;
    const newBalance = Math.trunc(balance + amount * factor);
    const change = newBalance - balance;
    const profit = change - amount;

    investor.completed += 1;

    let editedBody: string;
    if (newBalance < BALANCE_CAP) {
      investor.balance = newBalance;
      editedBody = message.modifyInvestReturn(
        investment.amount,
        investment.upvotes,
        upvotesNow,
        change,
        profit,
        investor.balance
      );
    } else {
      investor.balance = BALANCE_CAP;
      editedBody = message.modifyInvestCapped(
        investment.amount,
        investment.upvotes,
        upvotesNow,
        change,
        profit,
        investor.balance
      );
      if (cfg.POST_TO_REDDIT) {
        const [subj, txt] = message.notifyCapped(
          investor,
          \`https://reddit.com/r/\${cfg.SUBREDDITS[0]}/comments/\${investment.post}/_/\${investment.response}\`
        );
        await reddit
          .sendPrivateMessage({
            to: \`/r/\${cfg.SUBREDDITS[0]}\`,
            subject: subj,
            text: txt,
          })
          .catch(() => undefined);
      }
    }

    if (cfg.POST_TO_REDDIT && investment.response !== '0') {
      const botComment = await reddit
        .getCommentById(toFullCommentId(investment.response))
        .catch(() => null);
      if (botComment) {
        await botComment.edit({ text: editedBody });
      }
    }

    investment.success = profit > 0;
    investment.profit = profit;
    investment.done = true;
    investment.balance = investor.balance;

    await saveInvestment(investment);
    await saveInvestor(investor);

    // Controllo automatico bancarotta dopo la chiusura investimento
    if (investor.balance < cfg.STARTING_BALANCE * 0.5) {
      const activeRemaining = await getActiveInvestmentsForUser(investor.name);
      if (activeRemaining.length < 1) {
        investor.balance = Math.trunc(cfg.STARTING_BALANCE * 0.9);
        investor.broke += 1;
        await saveInvestor(investor);
        if (cfg.POST_TO_REDDIT && investment.comment) {
          await reddit.submitComment({
            id: toFullCommentId(investment.comment),
            text: message.modifyBroke(investor.broke, investor.balance),
          });
        }
      }
    }

    if (topNetworth < investor.balance) {
      topNetworth = investor.balance;
    }
  }
}
`,
  },
  {
    path: 'src/server/buyabler.ts',
    originalEquivalent: 'src/buyabler.py',
    category: 'workers',
    language: 'typescript',
    summary:
      'Job schedulato per i post Buyable con flair OC: assegna all’autore del meme un bonus pari a 1/OC_BONUS degli investimenti altrui.',
    content: `import { reddit } from '@devvit/web/server';
import type { BotConfig } from './config.js';
import { OC_BONUS } from './formula.js';
import * as message from './message.js';
import {
  deleteBuyable,
  getInvestor,
  getInvestorNetworth,
  getMatureBuyables,
  getPostInvestments,
  saveBuyable,
  saveInvestor,
} from './models.js';
import { BALANCE_CAP, toFullCommentId, toFullPostId } from './utils.js';

export async function processMatureBuyables(cfg: BotConfig): Promise<void> {
  const mature = await getMatureBuyables(cfg.INVESTMENT_DURATION);
  if (mature.length === 0) return;

  for (const buyable of mature) {
    const submission = await reddit
      .getPostById(toFullPostId(buyable.post))
      .catch(() => null);

    if (!submission || submission.removed || !submission.authorName) {
      await deleteBuyable(buyable.post);
      continue;
    }

    if (submission.isStickied() || submission.distinguishedBy) {
      await deleteBuyable(buyable.post);
      continue;
    }

    buyable.final_upvotes = submission.score;
    buyable.oc = submission.flair?.text === 'OC';

    if (!buyable.oc) {
      buyable.done = true;
      await saveBuyable(buyable);
      continue;
    }

    const investor = await getInvestor(buyable.name);
    if (!investor) {
      buyable.done = true;
      await saveBuyable(buyable);
      continue;
    }

    const postInvestments = await getPostInvestments(buyable.post);
    let profit = 0;
    for (const inv of postInvestments) {
      if (inv.name !== buyable.name) {
        profit += inv.amount / OC_BONUS;
      }
    }

    const netWorth = await getInvestorNetworth(investor.name);
    if (netWorth > 0) {
      profit = Math.trunc(Math.min(profit, netWorth));
    } else {
      profit = Math.trunc(profit);
    }

    const newBalance = Math.trunc(investor.balance + profit);
    const appendText =
      newBalance < BALANCE_CAP
        ? message.modifyOcReturn(profit)
        : message.modifyOcCapped;

    investor.balance = newBalance < BALANCE_CAP ? newBalance : BALANCE_CAP;

    if (cfg.POST_TO_REDDIT && buyable.response !== '0') {
      const botComment = await reddit
        .getCommentById(toFullCommentId(buyable.response))
        .catch(() => null);
      if (botComment) {
        await botComment.edit({ text: botComment.body + appendText });
      }
    }

    buyable.profit = profit;
    buyable.done = true;
    buyable.balance = investor.balance;

    await saveInvestor(investor);
    await saveBuyable(buyable);
  }
}
`,
  },
  {
    path: 'src/server/leaderboard.ts',
    originalEquivalent: 'src/leaderboard.py',
    category: 'season',
    language: 'typescript',
    summary:
      'Aggiorna periodicamente le pagine wiki leaderboardbig e leaderboardocbig e i widget sidebar del subreddit con la formattazione originale.',
    content: `import { reddit } from '@devvit/web/server';
import type { BotConfig } from './config.js';
import { getAllBuyables, getTopInvestors } from './models.js';
import { formatInt, formatNumber } from './utils.js';

export interface PosterStat {
  name: string;
  ocCount: number;
  ocScore: number;
  totalPosts: number;
  totalScore: number;
}

export function formatInvestor(
  users: Array<{ name: string; networth: number }>,
  limit = 1000
): string {
  let text = '.|Utente|Patrimonio\\n';
  text += ':-:|:-:|:-:\\n';
  const slice = users.slice(0, limit);
  slice.forEach((user, i) => {
    text += \`\${i + 1}|/u/\${user.name}|\${formatNumber(user.networth)} M€\\n\`;
  });
  return text;
}

export function formatPostersSmall(
  posters: PosterStat[],
  limit = 500
): string {
  let text = '.|Autore|#OC|Karma|\\n';
  text += ':-:|:-:|:-:|:-:\\n';
  posters.slice(0, limit).forEach((p, i) => {
    text += \`\${i + 1}|/u/\${p.name}|\${formatNumber(p.ocCount)}|\${formatNumber(p.ocScore)}\\n\`;
  });
  return text;
}

export function formatPostersFull(
  posters: PosterStat[],
  limit = 500
): string {
  let text = '.|Autore|#OC|Karma OC|Post totali|Karma totali\\n';
  text += ':-:|:-:|:-:|:-:|:-:|:-:\\n';
  posters.slice(0, limit).forEach((p, i) => {
    text += \`\${i + 1}|/u/\${p.name}|\${p.ocCount}|\${formatInt(p.ocScore)}|\${p.totalPosts}|\${formatInt(p.totalScore)}\\n\`;
  });
  return text;
}

export async function aggregateTopPosters(
  onlyOc = false,
  limit = 100
): Promise<PosterStat[]> {
  const buyables = await getAllBuyables();
  const byUser = new Map<string, PosterStat>();

  for (const b of buyables) {
    if (onlyOc ? !b.oc : !b.done) continue;
    const prev = byUser.get(b.name) ?? {
      name: b.name,
      ocCount: 0,
      ocScore: 0,
      totalPosts: 0,
      totalScore: 0,
    };
    prev.totalPosts += 1;
    prev.totalScore += b.final_upvotes;
    if (b.oc) {
      prev.ocCount += 1;
      prev.ocScore += b.final_upvotes;
    }
    byUser.set(b.name, prev);
  }

  return Array.from(byUser.values())
    .sort((a, b) =>
      onlyOc
        ? b.totalScore - a.totalScore || b.ocCount - a.ocCount || b.ocScore - a.ocScore
        : b.ocScore - a.ocScore || b.ocCount - a.ocCount
    )
    .slice(0, limit);
}

export async function updateLeaderboard(cfg: BotConfig): Promise<void> {
  if (!cfg.POST_TO_REDDIT) return;

  const [topUsers, topPosters] = await Promise.all([
    getTopInvestors(500),
    aggregateTopPosters(false, 100),
  ]);

  const subredditName = cfg.SUBREDDITS[0];

  // Aggiornamento widget sidebar (Redesign) se presenti su r/BancaDelMeme
  try {
    const widgets = await reddit.getWidgets(subredditName);
    for (const widget of widgets) {
      if ('text' in widget && typeof widget.name === 'string') {
        const key = widget.name.toLowerCase().replace(/\\s+/g, '');
        if (key === 'top10') {
          await widget.update({ text: formatInvestor(topUsers, 10) }).catch(() => undefined);
        } else if (widget.name.toLowerCase() === 'migliori autori') {
          await widget.update({ text: formatPostersSmall(topPosters, 4) }).catch(() => undefined);
        }
      }
    }
  } catch {
    // Widget API non disponibile o widget assenti
  }

  await Promise.all([
    reddit
      .updateWikiPage({
        subredditName,
        page: 'leaderboardbig',
        content: formatInvestor(topUsers, 500),
        reason: 'Aggiornamento automatico classifica investitori Devvit',
      })
      .catch(() => undefined),
    reddit
      .updateWikiPage({
        subredditName,
        page: 'leaderboardocbig',
        content: formatPostersFull(topPosters, 100),
        reason: 'Aggiornamento automatico classifica autori OC Devvit',
      })
      .catch(() => undefined),
  ]);
}
`,
  },
  {
    path: 'src/server/taxes.ts',
    originalEquivalent: 'src/taxes.py',
    category: 'season',
    language: 'typescript',
    summary:
      'Calcolo e riscossione delle tasse IRPEF progressive sugli investitori con patrimonio oltre 2x STARTING_BALANCE, eseguibile dal menu moderatore.',
    content: `import type { BotConfig } from './config.js';
import {
  getAllInvestorNames,
  getInvestor,
  getInvestorNetworth,
  saveInvestor,
} from './models.js';

const RATES = [0, 23, 27, 38, 41, 43];

export async function collectTaxes(cfg: BotConfig): Promise<number> {
  const noTax = 2 * cfg.STARTING_BALANCE;
  const names = await getAllInvestorNames();

  const activeInvestors = (
    await Promise.all(
      names.map(async (name) => {
        const inv = await getInvestor(name);
        if (!inv || inv.completed === 0) return null;
        const networth = await getInvestorNetworth(name);
        return { inv, networth };
      })
    )
  ).filter((x): x is NonNullable<typeof x> => x !== null);

  if (activeInvestors.length === 0) return 0;

  const sortedByNetworth = [...activeInvestors].sort(
    (a, b) => b.networth - a.networth
  );
  const topCount = Math.max(1, Math.round(activeInvestors.length / 100));
  const topTierAmount = sortedByNetworth[topCount - 1]?.networth ?? noTax;

  const deltas = (topTierAmount - noTax) / (RATES.length - 2);
  const tiers: number[] = [];
  const basics: number[] = [];

  for (let i = 0; i < RATES.length; i += 1) {
    if (i === 0) {
      tiers.push(0);
      basics.push(0);
    } else if (i === 1) {
      tiers.push(noTax);
      basics.push(0);
    } else {
      tiers.push(Math.floor(tiers[tiers.length - 1] + deltas));
      basics.push(
        basics[basics.length - 1] +
          Math.floor(
            ((tiers[tiers.length - 1] - tiers[tiers.length - 2]) / 100) *
              RATES[i - 1]
          )
      );
    }
  }

  for (const { inv, networth } of activeInvestors) {
    let tierIdx = 0;
    for (let i = 0; i < tiers.length; i += 1) {
      if (tiers[i] >= networth) {
        tierIdx = i - 1;
        break;
      }
      tierIdx = i;
    }

    if (tierIdx > 0) {
      const tax =
        basics[tierIdx] +
        ((networth - tiers[tierIdx]) / 100) * RATES[tierIdx];
      inv.balance = Math.round(inv.balance - tax);
      await saveInvestor(inv);
    }
  }

  return activeInvestors.length;
}
`,
  },
  {
    path: 'src/server/new_season.ts',
    originalEquivalent: 'src/seasonleaderboard.py + src/new_season.py',
    category: 'season',
    language: 'typescript',
    summary:
      'Esporta la classifica definitiva su wiki (con verifica zero investimenti/buyable attivi) e azzera Redis per l’avvio di una nuova stagione.',
    content: `import { reddit } from '@devvit/web/server';
import type { BotConfig } from './config.js';
import {
  aggregateTopPosters,
  formatInvestor,
  formatPostersFull,
} from './leaderboard.js';
import {
  clearSeasonData,
  getPendingCounts,
  getTopInvestors,
} from './models.js';

export async function exportSeasonLeaderboard(
  cfg: BotConfig
): Promise<{ ok: boolean; message: string }> {
  const pending = await getPendingCounts();
  if (pending.buyables > 0 || pending.investments > 0) {
    return {
      ok: false,
      message: \`Impossibile esportare: \${pending.investments} investimenti e \${pending.buyables} post ancora aperti.\`,
    };
  }

  const [topUsers, topPosters] = await Promise.all([
    getTopInvestors(10000),
    aggregateTopPosters(true, 1000),
  ]);

  const content =
    '# Stagione Conclusa\\n\\nClassifica definitiva della stagione.\\n\\n' +
    formatInvestor(topUsers, 10000) +
    '\\n\\n\\n# Migliori autori di OC\\n\\n\\n' +
    formatPostersFull(topPosters, 1000);

  await reddit.updateWikiPage({
    subredditName: cfg.SUBREDDITS[0],
    page: 'stagione',
    content,
    reason: 'Esportazione classifica definitiva di fine stagione',
  });

  return {
    ok: true,
    message: 'Classifica definitiva salvata sulla wiki (/wiki/stagione).',
  };
}

export async function resetAllSeason(): Promise<{
  investors: number;
  investments: number;
  buyables: number;
}> {
  return clearSeasonData();
}
`,
  },
  {
    path: 'src/server/import_db.ts',
    originalEquivalent: 'Migrazione DB SQLite/MySQL -> Devvit Redis',
    category: 'migration',
    language: 'typescript',
    summary:
      'Importa in Devvit Redis il JSON generato dallo script Python migration/export_db.py preservando investitori, saldi, investimenti attivi/storici, buyable e post Telegram.',
    content: `import { redis } from '@devvit/web/server';
import {
  KEYS,
  refreshLeaderboardScore,
  saveBuyable,
  saveInvestment,
  saveInvestor,
  saveTelegramPost,
  type BuyableRecord,
  type InvestmentRecord,
  type InvestorRecord,
} from './models.js';

export interface LegacyDumpPayload {
  investors?: InvestorRecord[];
  investments?: InvestmentRecord[];
  buyables?: BuyableRecord[];
  telegramPosts?: Array<{ rid: string; tid: string | null }>;
}

export async function importLegacyDumpJson(rawJson: string): Promise<{
  investors: number;
  investments: number;
  buyables: number;
  telegramPosts: number;
}> {
  const data = JSON.parse(rawJson) as LegacyDumpPayload;
  const investors = data.investors ?? [];
  const investments = data.investments ?? [];
  const buyables = data.buyables ?? [];
  const telegramPosts = data.telegramPosts ?? [];

  for (const inv of investors) {
    if (!inv.name) continue;
    await saveInvestor({
      name: inv.name,
      balance: Number(inv.balance ?? 0),
      completed: Number(inv.completed ?? 0),
      broke: Number(inv.broke ?? 0),
    });
  }

  let maxId = Number((await redis.get(KEYS.invSeq)) ?? '0');
  const touchedUsers = new Set<string>();

  for (const item of investments) {
    const idStr = String(item.id);
    const numId = Number(idStr);
    if (!Number.isNaN(numId) && numId > maxId) {
      maxId = numId;
    }
    await saveInvestment({
      id: idStr,
      post: String(item.post),
      upvotes: Number(item.upvotes ?? 0),
      deltatime: Number(item.deltatime ?? 0),
      comment: String(item.comment),
      name: String(item.name),
      amount: Number(item.amount ?? 0),
      time: Number(item.time ?? 0),
      done: Boolean(item.done),
      response: String(item.response ?? '0'),
      final_upvotes: Number(item.final_upvotes ?? 0),
      success: Boolean(item.success),
      profit: Number(item.profit ?? 0),
      net_worth: Number(item.net_worth ?? 0),
      top_networth: Number(item.top_networth ?? 0),
      balance: Number(item.balance ?? 0),
      op: Boolean(item.op),
    });
    if (item.name) touchedUsers.add(item.name);
  }

  await redis.set(KEYS.invSeq, String(maxId));

  for (const b of buyables) {
    if (!b.post) continue;
    await saveBuyable({
      post: String(b.post),
      time: Number(b.time ?? 0),
      response: String(b.response ?? '0'),
      oc: Boolean(b.oc),
      done: Boolean(b.done),
      name: String(b.name),
      final_upvotes: Number(b.final_upvotes ?? 0),
      profit: Number(b.profit ?? 0),
      balance: Number(b.balance ?? 0),
    });
  }

  for (const tg of telegramPosts) {
    if (!tg.rid) continue;
    await saveTelegramPost(String(tg.rid), tg.tid ? String(tg.tid) : null);
  }

  for (const user of touchedUsers) {
    await refreshLeaderboardScore(user);
  }

  return {
    investors: investors.length,
    investments: investments.length,
    buyables: buyables.length,
    telegramPosts: telegramPosts.length,
  };
}
`,
  },
  {
    path: 'migration/export_db.py',
    originalEquivalent: 'Script di esportazione dal vecchio DB SQLite',
    category: 'migration',
    language: 'python',
    summary:
      'Script Python da eseguire sul vecchio server per esportare Investors, Investments, Buyables e posts Telegram in chunk JSON pronti per l’importazione su Devvit.',
    content: `"""
Esporta il database SQLite esistente di BancaDelMeme (e il DB opzionale dei post Telegram)
in file JSON pronti per la funzione 'Importa DB Legacy' nel menu moderatore Devvit.

Uso (con cfg.json esistente oppure con i percorsi diretti):
  python3 migration/export_db.py --cfg /percorso/cfg.json --out bdb_dump
  python3 migration/export_db.py --db /percorso/db.sqlite3 --posts-db /percorso/posts.sqlite3 --out bdb_dump
"""

import argparse
import json
import os
import sqlite3


def export_sqlite(db_path: str, posts_db_path: str | None, out_prefix: str, chunk_size: int) -> None:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    investors = [
        {
            "name": r["name"],
            "balance": int(r["balance"] or 0),
            "completed": int(r["completed"] or 0),
            "broke": int(r["broke"] or 0),
        }
        for r in cur.execute("SELECT name, balance, completed, broke FROM Investors")
    ]

    investments = [
        {
            "id": str(r["id"]),
            "post": r["post"],
            "upvotes": int(r["upvotes"] or 0),
            "deltatime": int(r["deltatime"] or 0),
            "comment": r["comment"],
            "name": r["name"],
            "amount": int(r["amount"] or 0),
            "time": int(r["time"] or 0),
            "done": bool(r["done"]),
            "response": r["response"] or "0",
            "final_upvotes": int(r["final_upvotes"] or 0),
            "success": bool(r["success"]),
            "profit": int(r["profit"] or 0),
            "net_worth": int(r["net_worth"] or 0),
            "top_networth": int(r["top_networth"] or 0),
            "balance": int(r["balance"] or 0),
            "op": bool(r["op"]),
        }
        for r in cur.execute(
            """
            SELECT id, post, upvotes, deltatime, comment, name, amount, time, done,
                   response, final_upvotes, success, profit, net_worth, top_networth, balance, op
            FROM Investments
            ORDER BY id ASC
            """
        )
    ]

    buyables = [
        {
            "post": r["post"],
            "time": int(r["time"] or 0),
            "response": r["response"] or "0",
            "oc": bool(r["oc"]),
            "done": bool(r["done"]),
            "name": r["name"],
            "final_upvotes": int(r["final_upvotes"] or 0),
            "profit": int(r["profit"] or 0),
            "balance": int(r["balance"] or 0),
        }
        for r in cur.execute(
            """
            SELECT post, time, response, oc, done, name, final_upvotes, profit, balance
            FROM Buyables
            """
        )
    ]
    conn.close()

    telegram_posts = []
    if posts_db_path and os.path.exists(posts_db_path):
        pconn = sqlite3.connect(posts_db_path)
        pconn.row_factory = sqlite3.Row
        telegram_posts = [
            {"rid": r["rid"], "tid": r["tid"]}
            for r in pconn.execute("SELECT rid, tid FROM posts")
        ]
        pconn.close()

    # Suddivide i record in chunk gestibili dal form Devvit
    chunks = []
    for i in range(0, max(1, len(investors)), chunk_size):
        chunks.append({"investors": investors[i : i + chunk_size]})
    for i in range(0, len(investments), chunk_size):
        chunks.append({"investments": investments[i : i + chunk_size]})
    for i in range(0, len(buyables), chunk_size):
        chunks.append({"buyables": buyables[i : i + chunk_size]})
    for i in range(0, len(telegram_posts), chunk_size):
        chunks.append({"telegramPosts": telegram_posts[i : i + chunk_size]})

    os.makedirs(os.path.dirname(out_prefix) or ".", exist_ok=True)
    for idx, payload in enumerate(chunks, start=1):
        filename = f"{out_prefix}_chunk_{idx:03d}.json"
        with open(filename, "w", encoding="utf-8") as fp:
            json.dump(payload, fp, ensure_ascii=False)
        print(f"Creato {filename}")

    print(
        f"Esportazione completata: {len(investors)} investitori, "
        f"{len(investments)} investimenti, {len(buyables)} buyables, "
        f"{len(telegram_posts)} post Telegram in {len(chunks)} file."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cfg", default=None, help="Percorso cfg.json del vecchio bot")
    parser.add_argument("--db", default=None, help="Percorso DBFILE (SQLite)")
    parser.add_argument("--posts-db", default=None, help="Percorso POST_DBFILE (SQLite Telegram)")
    parser.add_argument("--out", default="bdb_dump", help="Prefisso file JSON in uscita")
    parser.add_argument("--chunk-size", type=int, default=400, help="Record per file chunk")
    args = parser.parse_args()

    db_path = args.db
    posts_db_path = args.posts_db
    if args.cfg:
        with open(args.cfg, encoding="utf-8") as fp:
            cfg = json.load(fp)
        base_dir = os.path.dirname(os.path.abspath(args.cfg))
        if not db_path and cfg.get("DBFILE"):
            raw_db = cfg["DBFILE"]
            db_path = raw_db if os.path.isabs(raw_db) else os.path.join(base_dir, raw_db)
        if not posts_db_path and cfg.get("POST_DBFILE"):
            raw_posts = cfg["POST_DBFILE"]
            posts_db_path = raw_posts if os.path.isabs(raw_posts) else os.path.join(base_dir, raw_posts)

    if not db_path:
        parser.error("Specificare --cfg oppure --db.")

    export_sqlite(db_path, posts_db_path, args.out, args.chunk_size)
`,
  },
  {
    path: 'README.md',
    originalEquivalent: 'README.md',
    category: 'config',
    language: 'markdown',
    summary: 'Istruzioni essenziali di build, deploy, Telegram Fetch Domains e migrazione DB.',
    content: `# BancaDelMeme · Reddit Devvit

Porting 1:1 di \`timendum/BancaDelMeme\` su piattaforma **Reddit Devvit**.

## Requisiti
- Node.js 20+
- Account Reddit moderatore su \`r/BancaDelMeme\` (o subreddit di test)
- Devvit CLI: \`npm install -g devvit\`

## Avvio rapido
\`\`\`bash
npm install
devvit login
npm run build
devvit upload
devvit install r/BancaDelMeme
\`\`\`

## Fetch Domains
Questa app dichiara il dominio esterno \`api.telegram.org\` in \`devvit.json\` esclusivamente per replicare il bridge Telegram di \`submitter.py\` (\`sendPhoto\`, \`sendMessage\`, \`deleteMessage\` verso il canale ufficiale del subreddit).

## Sostituzione del bot attuale e migrazione DB
1. Ferma i vecchi worker Python (\`main.py\`, \`submitter.py\`, \`calculator.py\`, \`buyabler.py\`, \`leaderboard.py\`).
2. Esegui \`python3 migration/export_db.py --db /path/db.sqlite3 --posts-db /path/posts.sqlite3\`.
3. Installa l'app Devvit su \`r/BancaDelMeme\` e configura \`tgToken\`, \`tgChannel\` e i parametri di gioco in \`Mod Tools -> Installed Apps -> bancadelmeme -> Configure\`.
4. Su Reddit esegui \`Mod Tools -> BancaDelMeme: Importa DB Legacy (JSON)\` per caricare i chunk generati.
`,
  },
];

