// Exponential time decay (half-life based), Hacker-News-style: an event
// from `halfLifeDays` ago counts for half as much as one from today.
export function recencyWeight(date: Date, halfLifeDays = 7): number {
  const ageDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, Math.max(ageDays, 0) / halfLifeDays);
}

// Caps spam at one counted unit per actor per calendar day, using each
// day's most recent timestamp for the decay weight. Without this, flooding
// a conversation with messages would inflate the score without limit.
export function decayedDailyActivityScore(
  events: Array<{ actorId: string; createdAt: Date }>,
  halfLifeDays = 7
): number {
  const latestPerActorDay = new Map<string, Date>();
  for (const event of events) {
    const day = event.createdAt.toISOString().slice(0, 10);
    const key = `${event.actorId}:${day}`;
    const existing = latestPerActorDay.get(key);
    if (!existing || event.createdAt > existing) {
      latestPerActorDay.set(key, event.createdAt);
    }
  }

  let score = 0;
  for (const date of latestPerActorDay.values()) {
    score += recencyWeight(date, halfLifeDays);
  }
  return score;
}
