import { db } from '@/lib/db';
import { embedTexts } from '@/lib/ai/embeddings';
import { buildUserEmbeddingText } from '@/lib/ai/userEmbedding';

const BATCH_SIZE = 50;

async function main() {
  const users = await db.user.findMany({
    select: { id: true, title: true, company: true, bio: true, location: true },
  });

  let updated = 0;
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const texts = batch.map(buildUserEmbeddingText);
    const nonEmptyIdx = texts.map((t, idx) => (t ? idx : -1)).filter((idx) => idx !== -1);

    const vectors = await embedTexts(nonEmptyIdx.map((idx) => texts[idx]));

    await Promise.all(
      nonEmptyIdx.map((idx, vIdx) =>
        db.user.update({
          where: { id: batch[idx].id },
          data: { embedding: vectors[vIdx] },
        })
      )
    );

    updated += nonEmptyIdx.length;
    console.log(`Embedded ${Math.min(i + BATCH_SIZE, users.length)}/${users.length} users (${updated} had profile text)`);
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
