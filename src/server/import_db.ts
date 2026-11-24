import { redis } from '@devvit/web/server';
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
