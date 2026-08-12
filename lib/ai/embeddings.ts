import '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { cosineSimilarity } from './cosineSimilarity';

export { cosineSimilarity };

// The Universal Sentence Encoder downloads its weights from TF Hub on first
// load, so we load it once per server process and reuse it for every call.
let modelPromise: Promise<use.UniversalSentenceEncoder> | null = null;

function loadModel() {
  if (!modelPromise) {
    modelPromise = use.load();
  }
  return modelPromise;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const model = await loadModel();
  const embeddings = await model.embed(texts);
  const vectors = await embeddings.array();
  embeddings.dispose();
  return vectors;
}

export async function embedText(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector;
}
