import type { SlateTier } from '@prisma/client';

export const TIER_LIMITS = {
  STARTER: {
    label: 'Starter Slate',
    baseFeeCents: 1500,
    seatFeeCents: 500,
    maxBoards: 10,
    maxChannels: 10,
    historyDays: 30,
    freeExternalOrosPerSeat: 0,
  },
  PRO: {
    label: 'Pro Slate',
    baseFeeCents: 4900,
    seatFeeCents: 1000,
    maxBoards: Infinity,
    maxChannels: Infinity,
    historyDays: Infinity,
    freeExternalOrosPerSeat: 3,
  },
  ENTERPRISE: {
    label: 'Enterprise Slate',
    baseFeeCents: null,
    seatFeeCents: null,
    maxBoards: Infinity,
    maxChannels: Infinity,
    historyDays: Infinity,
    freeExternalOrosPerSeat: Infinity,
  },
} as const satisfies Record<SlateTier, {
  label: string;
  baseFeeCents: number | null;
  seatFeeCents: number | null;
  maxBoards: number;
  maxChannels: number;
  historyDays: number;
  freeExternalOrosPerSeat: number;
}>;

export function estimateMonthlyCents(tier: SlateTier, seatCount: number): number | null {
  const limits = TIER_LIMITS[tier];
  if (limits.baseFeeCents === null || limits.seatFeeCents === null) return null; // Enterprise — custom quote
  return limits.baseFeeCents + limits.seatFeeCents * seatCount;
}

export const TRIAL_DURATION_DAYS = 14;
