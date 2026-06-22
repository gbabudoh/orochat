import { db } from '@/lib/db';
import { embedText } from '@/lib/ai/embeddings';

interface EmbeddableCompass {
  name: string;
  description: string;
}

export function buildCompassEmbeddingText(compass: EmbeddableCompass): string {
  return [compass.name, compass.description].filter(Boolean).join('. ');
}

// Recomputes and persists a Compass community's embedding — used to score
// ad-campaign relevance against the community's actual topic.
export async function regenerateCompassEmbedding(compassId: string): Promise<void> {
  const compass = await db.compass.findUnique({
    where: { id: compassId },
    select: { name: true, description: true },
  });
  if (!compass) return;

  const text = buildCompassEmbeddingText(compass);
  const embedding = text ? await embedText(text) : [];

  await db.compass.update({
    where: { id: compassId },
    data: { embedding },
  });
}
