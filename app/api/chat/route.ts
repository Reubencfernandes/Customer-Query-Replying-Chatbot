import { NextResponse } from 'next/server';
import { getAllChunksWithMeta } from '@/lib/kb-store';
import {
  embedQuery,
  rerank,
  chatWithDocuments,
  cosineSimilarity,
} from '@/lib/cohere';
import {
  RETRIEVE_TOP_K,
  CONTEXT_TOP_N,
  PER_SOURCE_CAP,
  QA_PRIORITY_BOOST,
} from '@/lib/cohere-config';

/**
 * Pick the final context chunks from a relevance-ranked list while guaranteeing
 * that multiple source documents are represented. Without this, a question that
 * spans two documents ("what is X and Y") gets answered from whichever document
 * dominates the ranking, because every top slot is filled from it.
 *
 * Strategy: round-robin across documents (one chunk per document per pass, in
 * relevance order) so each relevant document contributes its best chunks first,
 * capped per source and limited to `limit` chunks total.
 */
function diversifyBySource<T extends { sourceName: string }>(
  ranked: T[],
  limit: number,
  perSourceCap: number
): T[] {
  const bySource = new Map<string, T[]>();
  for (const chunk of ranked) {
    const arr = bySource.get(chunk.sourceName);
    if (arr) arr.push(chunk);
    else bySource.set(chunk.sourceName, [chunk]);
  }

  const used = new Map<string, number>();
  const result: T[] = [];
  let progressed = true;
  while (result.length < limit && progressed) {
    progressed = false;
    for (const [name, chunks] of bySource) {
      if ((used.get(name) ?? 0) >= perSourceCap) continue;
      const next = chunks.shift();
      if (!next) continue;
      result.push(next);
      used.set(name, (used.get(name) ?? 0) + 1);
      progressed = true;
      if (result.length >= limit) break;
    }
  }
  return result;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMPTY_KB_REPLY =
  "I couldn't find any documents or custom Q&A answers in your knowledge base yet. Head to the **Admin Dashboard** to upload documents (PDF, Word, Excel) or add custom Q&A pairs, and I'll be able to answer grounded questions.";

type Source = { name: string; type: string };

export async function POST(request: Request) {
  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: 'A query is required.' }, { status: 400 });
  }

  try {
    const candidates = await getAllChunksWithMeta();

    // Empty knowledge base — friendly fallback, no model call needed.
    if (candidates.length === 0) {
      return NextResponse.json({ text: EMPTY_KB_REPLY, sources: [] });
    }

    // 1. Embed the query and score candidates by cosine similarity.
    const qVec = await embedQuery(query);
    const scored = candidates
      .map((c) => {
        const base = cosineSimilarity(qVec, c.embedding);
        return { c, score: c.prioritize ? base + QA_PRIORITY_BOOST : base };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, RETRIEVE_TOP_K)
      .map((s) => s.c);

    // 2. Rerank the whole candidate pool for precision (best-first).
    const reranked = await rerank(query, scored.map((c) => c.text));
    const rankedChunks =
      reranked.length > 0 ? reranked.map((r) => scored[r.index]) : scored;

    // 3. Select the final context, balancing relevance with document coverage so
    //    multi-document questions are answered from every relevant document.
    const finalDocs = diversifyBySource(rankedChunks, CONTEXT_TOP_N, PER_SOURCE_CAP);

    // 4. Build Cohere documents + an id -> source map for citation resolution.
    const idToSource = new Map<string, Source>();
    const documents = finalDocs.map((c, i) => {
      const id = String(i);
      idToSource.set(id, { name: c.sourceName, type: c.sourceType });
      return { id, data: { title: c.sourceName, text: c.text } };
    });

    // 5. Generate the grounded answer with citations.
    const { text, citations } = await chatWithDocuments(query, documents);

    // 6. Resolve cited document ids back to UI sources, deduped by name.
    const seen = new Set<string>();
    const sources: Source[] = [];
    for (const citation of citations) {
      for (const src of citation.sources ?? []) {
        const id = src.id;
        if (!id) continue;
        const mapped = idToSource.get(id);
        if (mapped && !seen.has(mapped.name)) {
          seen.add(mapped.name);
          sources.push(mapped);
        }
      }
    }

    // If the model produced no citations, fall back to the top reranked sources.
    if (sources.length === 0) {
      for (const c of finalDocs.slice(0, 2)) {
        if (!seen.has(c.sourceName)) {
          seen.add(c.sourceName);
          sources.push({ name: c.sourceName, type: c.sourceType });
        }
      }
    }

    return NextResponse.json({ text, sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    console.error('Chat error:', message);
    return NextResponse.json(
      { error: 'Failed to generate a response. ' + message },
      { status: 500 }
    );
  }
}
