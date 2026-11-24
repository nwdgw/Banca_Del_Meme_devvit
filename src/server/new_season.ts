import { reddit } from '@devvit/web/server';
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
      message: `Impossibile esportare: ${pending.investments} investimenti e ${pending.buyables} post ancora aperti.`,
    };
  }

  const [topUsers, topPosters] = await Promise.all([
    getTopInvestors(10000),
    aggregateTopPosters(true, 1000),
  ]);

  const content =
    '# Stagione Conclusa\n\nClassifica definitiva della stagione.\n\n' +
    formatInvestor(topUsers, 10000) +
    '\n\n\n# Migliori autori di OC\n\n\n' +
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
