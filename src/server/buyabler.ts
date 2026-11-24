import { reddit } from '@devvit/web/server';
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
