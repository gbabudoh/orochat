import { db } from '@/lib/db';
import { embedText } from '@/lib/ai/embeddings';

interface EmbeddableUser {
  title?: string | null;
  company?: string | null;
  bio?: string | null;
  location?: string | null;
}

export function buildUserEmbeddingText(user: EmbeddableUser): string {
  return [user.title, user.company, user.bio, user.location]
    .filter(Boolean)
    .join('. ');
}

// Recomputes and persists a user's profile embedding. Safe to call after any
// edit to title/company/bio/location — silently skips users with none of
// those fields filled in yet.
export async function regenerateUserEmbedding(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { title: true, company: true, bio: true, location: true },
  });
  if (!user) return;

  const text = buildUserEmbeddingText(user);
  const embedding = text ? await embedText(text) : [];

  await db.user.update({
    where: { id: userId },
    data: { embedding },
  });
}
