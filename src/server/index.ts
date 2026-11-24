import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  createServer,
  getServerPort,
  reddit,
  redis,
  type TaskRequest,
  type TaskResponse,
} from '@devvit/web/server';
import type {
  FormRequest,
  MenuItemRequest,
  OnCommentCreateRequest,
  OnPostCreateRequest,
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

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {} as T;
  }
  return JSON.parse(raw) as T;
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(json);
}

const server = createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;

  if (method !== 'POST') {
    sendJson(res, 200, { ok: true });
    return;
  }

  try {
    switch (pathname) {
      case '/internal/triggers/on-post-create': {
        const event = await readJsonBody<OnPostCreateRequest>(req);
        const cfg = await getBotConfig();
        await ensureDeployDate(redis);
        await handlePostCreate(event, cfg);
        const resp: TriggerResponse = {};
        sendJson(res, 200, resp);
        return;
      }

      case '/internal/triggers/on-comment-create': {
        const event = await readJsonBody<OnCommentCreateRequest>(req);
        const cfg = await getBotConfig();
        await ensureDeployDate(redis);
        await handleCommentCreate(event, cfg);
        const resp: TriggerResponse = {};
        sendJson(res, 200, resp);
        return;
      }

      case '/internal/scheduler/process-maturities': {
        await readJsonBody<TaskRequest>(req);
        const cfg = await getBotConfig();
        await processMatureInvestments(cfg);
        await processMatureBuyables(cfg);
        await cleanRemovedTelegram(cfg);
        const resp: TaskResponse = {};
        sendJson(res, 200, resp);
        return;
      }

      case '/internal/scheduler/update-leaderboard': {
        await readJsonBody<TaskRequest>(req);
        const cfg = await getBotConfig();
        await updateLeaderboard(cfg);
        const resp: TaskResponse = {};
        sendJson(res, 200, resp);
        return;
      }

      case '/internal/menu/import-db': {
        await readJsonBody<MenuItemRequest>(req);
        const resp: UiResponse = {
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
        };
        sendJson(res, 200, resp);
        return;
      }

      case '/internal/form/import-db': {
        const body = await readJsonBody<
          FormRequest<{ payload?: string }> & { values?: { payload?: string } }
        >(req);
        const raw = body.payload ?? body.values?.payload ?? '';
        try {
          const stats = await importLegacyDumpJson(raw);
          const resp: UiResponse = {
            showToast: {
              text: `Importati: ${stats.investors} investitori, ${stats.investments} investimenti, ${stats.buyables} post, ${stats.telegramPosts} TG.`,
              appearance: 'success',
            },
          };
          sendJson(res, 200, resp);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Errore parsing JSON';
          const resp: UiResponse = {
            showToast: {
              text: `Importazione fallita: ${msg}`,
              appearance: 'neutral',
            },
          };
          sendJson(res, 200, resp);
        }
        return;
      }

      case '/internal/menu/run-taxes': {
        await readJsonBody<MenuItemRequest>(req);
        const cfg = await getBotConfig();
        const count = await collectTaxes(cfg);
        const resp: UiResponse = {
          showToast: {
            text: `Tasse IRPEF riscosse su ${count} investitori.`,
            appearance: 'success',
          },
        };
        sendJson(res, 200, resp);
        return;
      }

      case '/internal/menu/export-season': {
        await readJsonBody<MenuItemRequest>(req);
        const cfg = await getBotConfig();
        const result = await exportSeasonLeaderboard(cfg);
        const resp: UiResponse = {
          showToast: {
            text: result.message,
            appearance: result.ok ? 'success' : 'neutral',
          },
        };
        sendJson(res, 200, resp);
        return;
      }

      case '/internal/menu/new-season': {
        await readJsonBody<MenuItemRequest>(req);
        const summary = await resetAllSeason();
        const cfg = await getBotConfig();
        await reddit
          .sendPrivateMessage({
            to: `/r/${cfg.SUBREDDITS[0]}`,
            subject: 'BancaDelMeme: Reset Nuova Stagione completato',
            text: `Reset completato: rimossi ${summary.investors} investitori, ${summary.investments} investimenti, ${summary.buyables} post.`,
          })
          .catch(() => undefined);

        const resp: UiResponse = {
          showToast: {
            text: `Stagione azzerata (${summary.investors} investitori rimossi).`,
            appearance: 'success',
          },
        };
        sendJson(res, 200, resp);
        return;
      }

      default:
        sendJson(res, 404, { error: 'Not found' });
        return;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    sendJson(res, 500, { error: message });
  }
});

const port = getServerPort();
server.listen(port);

export default server;
