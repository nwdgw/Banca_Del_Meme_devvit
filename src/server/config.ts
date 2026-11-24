import { settings } from '@devvit/web/server';

export interface BotConfig {
  POST_TO_REDDIT: boolean;
  IS_MODERATOR: boolean;
  INVESTMENT_DURATION: number;
  STARTING_BALANCE: number;
  ADMIN_ACCOUNTS: string[];
  CLOSED: boolean;
  MAINTENANCE: boolean;
  SUBREDDITS: string[];
  TG_TOKEN: string;
  TG_CHANNEL: string;
}

export async function getBotConfig(): Promise<BotConfig> {
  const [
    postToReddit,
    isModerator,
    investmentDuration,
    startingBalance,
    adminAccountsRaw,
    closed,
    maintenance,
    subredditSlug,
    tgToken,
    tgChannel,
  ] = await Promise.all([
    settings.get<boolean>('postToReddit'),
    settings.get<boolean>('isModerator'),
    settings.get<number>('investmentDuration'),
    settings.get<number>('startingBalance'),
    settings.get<string>('adminAccounts'),
    settings.get<boolean>('closed'),
    settings.get<boolean>('maintenance'),
    settings.get<string>('subredditSlug'),
    settings.get<string>('tgToken'),
    settings.get<string>('tgChannel'),
  ]);

  const adminAccounts = (adminAccountsRaw ?? 'timendum')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  return {
    POST_TO_REDDIT: postToReddit ?? true,
    IS_MODERATOR: isModerator ?? true,
    INVESTMENT_DURATION: investmentDuration ?? 14400,
    STARTING_BALANCE: startingBalance ?? 1000,
    ADMIN_ACCOUNTS: adminAccounts,
    CLOSED: closed ?? false,
    MAINTENANCE: maintenance ?? false,
    SUBREDDITS: [subredditSlug?.trim() || 'BancaDelMeme'],
    TG_TOKEN: (tgToken ?? '').trim(),
    TG_CHANNEL: (tgChannel ?? '').trim(),
  };
}
