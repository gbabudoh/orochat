/**
 * One-off backfill: creates the "General" Channel row for every Slate that
 * was created before Oroslate's multi-channel chat shipped. New Slates get
 * this row automatically (see createSlate/convertConversationToSlate in
 * features/oroslate/actions.ts) — this script only covers pre-existing ones,
 * wrapping each Slate's existing nest.conversationId so no chat history is
 * lost or duplicated. Safe to re-run: skips any Slate that already has a
 * Channel row.
 *
 * Usage: npx tsx scripts/backfill-general-channels.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const slates = await db.nest.findMany({
    where: { organizationId: { not: null }, channels: { none: {} } },
    select: { id: true, name: true, conversationId: true },
  });

  if (slates.length === 0) {
    console.log('No Slates need backfilling — every Slate already has a General channel.');
    return;
  }

  for (const slate of slates) {
    await db.channel.create({
      data: { nestId: slate.id, name: 'General', conversationId: slate.conversationId },
    });
    console.log(`Created General channel for Slate "${slate.name}" (${slate.id})`);
  }

  console.log(`\nBackfilled ${slates.length} Slate(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
