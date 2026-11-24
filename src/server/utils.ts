import type { RedisClient } from '@devvit/web/server';

export const BALANCE_CAP = 1000 * 1000 * 1000 * 1000 * 1000 * 1000; // One quintillion Mem€

const DEPLOY_DATE_KEY = 'bdb:meta:deploy_date';

export async function ensureDeployDate(redis: RedisClient): Promise<string> {
  const existing = await redis.get(DEPLOY_DATE_KEY);
  if (existing) {
    return existing;
  }
  const now = new Date().toUTCString();
  await redis.set(DEPLOY_DATE_KEY, now);
  return now;
}

export async function getDeployDate(redis: RedisClient): Promise<string> {
  return (await redis.get(DEPLOY_DATE_KEY)) ?? new Date().toUTCString();
}

export function investmentDurationString(durationSeconds: number): string {
  let duration = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(duration / 3600);
  duration %= 3600;
  const minutes = Math.floor(duration / 60);
  duration %= 60;

  let invString = '';
  if (hours) {
    invString += `${hours} or${hours > 1 ? 'e' : 'a'} `;
  }
  if (minutes) {
    invString += `${minutes} minut${minutes > 1 ? 'i' : 'o'} `;
  }
  if (duration) {
    invString += `${duration} second${duration > 1 ? 'i' : 'o'} `;
  }
  return invString;
}

export function formatInt(n: number): string {
  return Math.trunc(n).toLocaleString('en-US');
}

export function formatNumber(n: number): string {
  const rounded = Math.trunc(n);
  const absStr = Math.abs(rounded).toString();
  if (absStr.length <= 6 && !absStr.includes('e')) {
    return formatInt(rounded);
  }
  const suffixes: Record<number, string> = {
    6: 'M',
    9: 'B',
    12: 'T',
    15: 'Q',
    18: 'E',
  };
  const absVal = Math.abs(rounded);
  if (absVal < 1e6) {
    return formatInt(rounded);
  }
  const digits = Math.floor(Math.log10(absVal)) + 1;
  const exponent = digits - 1 - ((digits - 1) % 3);
  const mantissa = rounded / Math.pow(10, exponent);
  const suffix = suffixes[exponent] ?? `e${exponent}`;
  return `${mantissa.toFixed(2)}${suffix}`;
}

export function normalizePostId(rawId: string): string {
  return rawId.startsWith('t3_') ? rawId.slice(3) : rawId;
}

export function toFullPostId(postId: string): `t3_${string}` {
  return (postId.startsWith('t3_') ? postId : `t3_${postId}`) as `t3_${string}`;
}

export function normalizeCommentId(rawId: string): string {
  return rawId.startsWith('t1_') ? rawId.slice(3) : rawId;
}

export function toFullCommentId(commentId: string): `t1_${string}` {
  return (commentId.startsWith('t1_') ? commentId : `t1_${commentId}`) as `t1_${string}`;
}
