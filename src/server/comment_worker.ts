import { reddit, redis } from '@devvit/web/server';
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
  /^!aiuto\s*!?(.+)?$/im,
  /^!ignora$/im,
  new RegExp(`^!investi\\s+([\\d,.]+)\\s*(${MULT_PATTERN})?(?:\\s|$)`, 'im'),
  new RegExp(`^!invest\\s+([\\d,.]+)\\s*(${MULT_PATTERN})?(?:\\s|$)`, 'im'),
  /^!mercato$/im,
  /^!top$/im,
  /^!versione$/im,
  /^!template\s+(https:\/\/\S+)$/im,
  /^!template\s+\[(https:\/\/\S+)\]\(\1\)$/im,
  /^!vendi$/im,
  /^!investitutto$/im,
  /^!rimuovi\s+(\d)$/im,
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
    .then((u) => u?.username ?? '')
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

    const cmdWord = matches[0].trim().split(/\s+/)[0].slice(1).toLowerCase();
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
          `COMMAND \`!${key}\`` +
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
          message.modifyTemplateOp(arg1, `u/${authorName}`) +
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
