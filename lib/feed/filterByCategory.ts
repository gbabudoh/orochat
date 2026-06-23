import { cosineSimilarity } from '@/lib/ai/embeddings';
import { getCategoryEmbedding, CATEGORY_MIN_SIMILARITY } from '@/lib/ai/categoryEmbedding';

// Matches a post's author against a browsable category label using the same
// embedding-similarity approach as Explore's category search, since posts
// don't carry an explicit category field — only the author's profile does.
export async function filterPostsByCategory<T extends { author: { embedding: number[] } }>(
  posts: T[],
  category: string
): Promise<T[]> {
  const categoryVector = await getCategoryEmbedding(category);
  return posts.filter((post) =>
    post.author.embedding.length > 0 &&
    cosineSimilarity(categoryVector, post.author.embedding) >= CATEGORY_MIN_SIMILARITY
  );
}
