import { reddit } from '@devvit/web/server';
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
          `https://reddit.com/r/${cfg.SUBREDDITS[0]}/comments/${investment.post}/_/${investment.response}`
        );
        await reddit
          .sendPrivateMessage({
            to: `/r/${cfg.SUBREDDITS[0]}`,
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
