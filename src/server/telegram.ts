import { reddit } from '@devvit/web/server';
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
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
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

  const link = `https://reddit.com${encodeURI(permalink)}`;
  let title = escapeHtml(rawTitle || '');
  if (title.length <= 3) {
    title = 'Titolo: ' + title;
  }
  const text = `<a href='${link}'>${title}</a>`;

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
