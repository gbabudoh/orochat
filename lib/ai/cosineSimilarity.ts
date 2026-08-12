// Pure vector math, deliberately kept free of any dependency on
// lib/ai/embeddings.ts — that module does a top-level `import '@tensorflow/tfjs'`,
// and anything importing cosineSimilarity from there drags the entire TensorFlow.js
// bundle into its compile graph (multi-minute/hanging dev compiles) even though
// this function itself needs nothing but arithmetic.
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
