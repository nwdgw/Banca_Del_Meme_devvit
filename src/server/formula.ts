export const OP_BONUS = 1.5;
export const OC_BONUS = 50; // return investment.amount / OC_BONUS

export const MAX_A = 2.5;
export const MAX_B = 0;
export const MAX_C = 30;

export const MID_A = 100;
export const MID_B = 10000;
export const MID_M = 20000;

export const STEEP_A = 0.1;
export const STEEP_C = 400;

export function linearInterpolate(
  x: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number
): number {
  const m = (y1 - y0) / (x1 - x0);
  const c = y0;
  return m * x + c;
}

export function sigmoidMax(oldUpvotes: number): number {
  return MAX_A + MAX_B / (oldUpvotes / MAX_C + 1);
}

export function sigmoidMidpoint(oldUpvotes: number): number {
  return linearInterpolate(oldUpvotes, 0, MID_M, MID_A, MID_B);
}

export function sigmoidSteepness(oldUpvotes: number): number {
  return STEEP_A / (oldUpvotes / STEEP_C + 1);
}

export function sigmoid(
  x: number,
  maxValue: number,
  midpoint: number,
  steepness: number
): number {
  const arg = -(steepness * (x - midpoint));
  return maxValue / (1 + Math.exp(arg));
}

export function netWorthCoefficient(netWorth: number, topNetworth = 0): number {
  let factor = 0.155;
  let normalized = netWorth;
  if (topNetworth > 0) {
    normalized = Math.max(1, (netWorth * 100) / topNetworth);
    factor = 0.4591932391528963; // math.log(6, 90 * 0.55)
  }
  return Math.pow(normalized, -factor) * 6;
}

export function adjust(factor: number, netWorth = 0, topNetworth = 0): number {
  if (netWorth > 0 && topNetworth > 0 && factor > 1) {
    return factor * netWorthCoefficient(netWorth, topNetworth);
  }
  return factor;
}

export function calculate(
  newUpvotes: number,
  oldUpvotes: number,
  netWorth = 0,
  topNetworth = 0
): number {
  const safeOld = oldUpvotes < 0 ? 0 : oldUpvotes;
  const safeNew = newUpvotes < 0 ? 0 : newUpvotes;
  const safeNetWorth = netWorth < 0 ? 1 : netWorth;

  let delta = safeNew - safeOld;
  if (delta < 0) {
    delta = 0;
  }

  const sigMax = sigmoidMax(safeOld);
  const sigMp = sigmoidMidpoint(safeOld);
  const sigStp = sigmoidSteepness(safeOld);

  let factor = sigmoid(delta, sigMax, sigMp, sigStp);
  factor = adjust(factor, safeNetWorth, topNetworth);
  factor = Math.max(0.5, factor);
  return factor;
}
