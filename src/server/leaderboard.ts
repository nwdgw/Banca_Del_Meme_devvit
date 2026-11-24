import { reddit, type TextAreaWidget } from '@devvit/web/server';
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
  let text = '.|Utente|Patrimonio\n';
  text += ':-:|:-:|:-:\n';
  const slice = users.slice(0, limit);
  slice.forEach((user, i) => {
    text += `${i + 1}|/u/${user.name}|${formatNumber(user.networth)} M€\n`;
  });
  return text;
}

export function formatPostersSmall(
  posters: PosterStat[],
  limit = 500
): string {
  let text = '.|Autore|#OC|Karma|\n';
  text += ':-:|:-:|:-:|:-:\n';
  posters.slice(0, limit).forEach((p, i) => {
    text += `${i + 1}|/u/${p.name}|${formatNumber(p.ocCount)}|${formatNumber(p.ocScore)}\n`;
  });
  return text;
}

export function formatPostersFull(
  posters: PosterStat[],
  limit = 500
): string {
  let text = '.|Autore|#OC|Karma OC|Post totali|Karma totali\n';
  text += ':-:|:-:|:-:|:-:|:-:|:-:\n';
  posters.slice(0, limit).forEach((p, i) => {
    text += `${i + 1}|/u/${p.name}|${p.ocCount}|${formatInt(p.ocScore)}|${p.totalPosts}|${formatInt(p.totalScore)}\n`;
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
      if ('text' in widget && 'styles' in widget) {
        const textWidget = widget as TextAreaWidget;
        const key = textWidget.name.toLowerCase().replace(/\s+/g, '');
        if (key === 'top10') {
          await reddit
            .updateWidget({
              type: 'textarea',
              subreddit: subredditName,
              id: textWidget.id,
              shortName: textWidget.name,
              text: formatInvestor(topUsers, 10),
              styles: textWidget.styles,
            })
            .catch(() => undefined);
        } else if (textWidget.name.toLowerCase() === 'migliori autori') {
          await reddit
            .updateWidget({
              type: 'textarea',
              subreddit: subredditName,
              id: textWidget.id,
              shortName: textWidget.name,
              text: formatPostersSmall(topPosters, 4),
              styles: textWidget.styles,
            })
            .catch(() => undefined);
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
