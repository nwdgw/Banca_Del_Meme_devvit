import type { BotConfig } from './config.js';
import {
  getAllInvestorNames,
  getInvestor,
  getInvestorNetworth,
  saveInvestor,
} from './models.js';

const RATES = [0, 23, 27, 38, 41, 43];

export async function collectTaxes(cfg: BotConfig): Promise<number> {
  const noTax = 2 * cfg.STARTING_BALANCE;
  const names = await getAllInvestorNames();

  const activeInvestors = (
    await Promise.all(
      names.map(async (name) => {
        const inv = await getInvestor(name);
        if (!inv || inv.completed === 0) return null;
        const networth = await getInvestorNetworth(name);
        return { inv, networth };
      })
    )
  ).filter((x): x is NonNullable<typeof x> => x !== null);

  if (activeInvestors.length === 0) return 0;

  const sortedByNetworth = [...activeInvestors].sort(
    (a, b) => b.networth - a.networth
  );
  const topCount = Math.max(1, Math.round(activeInvestors.length / 100));
  const topTierAmount = sortedByNetworth[topCount - 1]?.networth ?? noTax;

  const deltas = (topTierAmount - noTax) / (RATES.length - 2);
  const tiers: number[] = [];
  const basics: number[] = [];

  for (let i = 0; i < RATES.length; i += 1) {
    if (i === 0) {
      tiers.push(0);
      basics.push(0);
    } else if (i === 1) {
      tiers.push(noTax);
      basics.push(0);
    } else {
      tiers.push(Math.floor(tiers[tiers.length - 1] + deltas));
      basics.push(
        basics[basics.length - 1] +
          Math.floor(
            ((tiers[tiers.length - 1] - tiers[tiers.length - 2]) / 100) *
              RATES[i - 1]
          )
      );
    }
  }

  for (const { inv, networth } of activeInvestors) {
    let tierIdx = 0;
    for (let i = 0; i < tiers.length; i += 1) {
      if (tiers[i] >= networth) {
        tierIdx = i - 1;
        break;
      }
      tierIdx = i;
    }

    if (tierIdx > 0) {
      const tax =
        basics[tierIdx] +
        ((networth - tiers[tierIdx]) / 100) * RATES[tierIdx];
      inv.balance = Math.round(inv.balance - tax);
      await saveInvestor(inv);
    }
  }

  return activeInvestors.length;
}
