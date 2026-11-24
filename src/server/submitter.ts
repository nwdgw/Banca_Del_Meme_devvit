import { reddit } from '@devvit/web/server';
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

  let domain = '';
  try {
    domain = new URL(post.url).hostname.replace(/^www\./, '');
  } catch {
    domain = '';
  }

  if (existingTg === null || existingTg === '') {
    await postTelegram(
      postId,
      post.permalink,
      post.title,
      post.url,
      domain,
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
    : message.investNoFee(`u/${authorName}`);

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
