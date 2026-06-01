import { CohereClientV2, Cohere } from 'cohere-ai';
import {
  EMBED_MODEL,
  RERANK_MODEL,
  CHAT_MODEL,
  CHAT_SYSTEM_PROMPT,
  EMBED_BATCH,
} from './cohere-config';

// The only module that talks to Cohere. The API key is read server-side only
// and must never be imported into a client component.

let client: CohereClientV2 | null = null;

function getClient(): CohereClientV2 {
  const token = process.env.COHERE_API_KEY;
  if (!token) {
    throw new Error(
      'COHERE_API_KEY is not set. Add it to .env.local (see .env.example).'
    );
  }
  if (!client) {
    client = new CohereClientV2({ token });
  }
  return client;
}

/** Embed documents (for the knowledge base) in batches. Returns one float vector per text. */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const co = getClient();
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const res = await co.embed({
      model: EMBED_MODEL,
      inputType: 'search_document',
      embeddingTypes: ['float'],
      texts: batch,
    });
    const floats = res.embeddings.float ?? [];
    out.push(...floats);
  }
  return out;
}

/** Embed a single user query for retrieval. */
export async function embedQuery(text: string): Promise<number[]> {
  const co = getClient();
  const res = await co.embed({
    model: EMBED_MODEL,
    inputType: 'search_query',
    embeddingTypes: ['float'],
    texts: [text],
  });
  const vec = res.embeddings.float?.[0];
  if (!vec) throw new Error('Cohere returned no query embedding.');
  return vec;
}

/**
 * Rerank candidate document texts against the query. Returns index + relevance,
 * best first. By default returns *all* candidates ranked, so the caller can
 * apply its own selection (e.g. per-source diversification) on the full pool.
 */
export async function rerank(
  query: string,
  documents: string[],
  topN: number = documents.length
): Promise<{ index: number; relevanceScore: number }[]> {
  if (documents.length === 0) return [];
  const co = getClient();
  const res = await co.rerank({
    model: RERANK_MODEL,
    query,
    documents,
    topN: Math.min(topN, documents.length),
  });
  return res.results.map((r) => ({
    index: r.index,
    relevanceScore: r.relevanceScore,
  }));
}

/** Grounded chat: pass retrieved documents and get an answer plus fine-grained citations. */
export async function chatWithDocuments(
  query: string,
  documents: Cohere.Document[]
): Promise<{ text: string; citations: Cohere.Citation[] }> {
  const co = getClient();
  const res = await co.chat({
    model: CHAT_MODEL,
    messages: [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      { role: 'user', content: query },
    ],
    documents,
  });

  const text =
    res.message.content
      ?.filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('') ?? '';

  return { text, citations: res.message.citations ?? [] };
}

/** Cosine similarity between two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
