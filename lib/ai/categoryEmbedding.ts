import { embedText } from './embeddings';

// Below this, a "match" is just noise (unrelated profile that happens to
// share generic vocabulary with the category).
export const CATEGORY_MIN_SIMILARITY = 0.4;

// Fixed set of category labels, so their embeddings are cheap to cache for
// the lifetime of the server process instead of recomputing every search.
const categoryEmbeddingCache = new Map<string, number[]>();

export async function getCategoryEmbedding(label: string): Promise<number[]> {
  const cached = categoryEmbeddingCache.get(label);
  if (cached) return cached;
  const vector = await embedText(label);
  categoryEmbeddingCache.set(label, vector);
  return vector;
}
