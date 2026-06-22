import { db } from '@/lib/db';
import { embedTexts } from '@/lib/ai/embeddings';
import { buildCompassEmbeddingText } from '@/lib/ai/compassEmbedding';

const BATCH_SIZE = 50;

async function main() {
  const communities = await db.compass.findMany({
    select: { id: true, name: true, description: true },
  });

  let updated = 0;
  for (let i = 0; i < communities.length; i += BATCH_SIZE) {
    const batch = communities.slice(i, i + BATCH_SIZE);
    const texts = batch.map(buildCompassEmbeddingText);
    const vectors = await embedTexts(texts);

    await Promise.all(
      batch.map((community, idx) =>
        db.compass.update({
          where: { id: community.id },
          data: { embedding: vectors[idx] },
        })
      )
    );

    updated += batch.length;
    console.log(`Embedded ${Math.min(i + BATCH_SIZE, communities.length)}/${communities.length} communities`);
  }

  console.log(`Done. ${updated} communities embedded.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
