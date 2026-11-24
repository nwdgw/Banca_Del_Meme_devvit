import { redis } from '@devvit/web/server';

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
  investor: (name: string) => `bdb:investor:${name}`,
  investorsAll: 'bdb:investors:all',
  investorActive: (name: string) => `bdb:investor:${name}:active`,
  leaderboard: 'bdb:leaderboard:networth',
  investment: (id: string) => `bdb:investment:${id}`,
  investmentsPending: 'bdb:investments:pending',
  postInvestments: (postId: string) => `bdb:post:${postId}:investments`,
  invSeq: 'bdb:seq:investment',
  buyable: (postId: string) => `bdb:buyable:${postId}`,
  buyablesAll: 'bdb:buyables:all',
  buyablesPending: 'bdb:buyables:pending',
  templateDone: (postId: string) => `bdb:template:${postId}`,
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
