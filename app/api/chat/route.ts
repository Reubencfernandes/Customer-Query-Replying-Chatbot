import { NextResponse } from 'next/server';
import { getAllChunksWithMeta } from '@/lib/kb-store';
import {
  embedQuery,
  rerank,
  chatWithDocuments,
  cosineSimilarity,
} from '@/lib/cohere';
import { RETRIEVE_TOP_K, QA_PRIORITY_BOOST } from '@/lib/cohere-config';

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

    // 2. Rerank the top-K candidates for precision.
    const reranked = await rerank(query, scored.map((c) => c.text));
    const finalDocs =
      reranked.length > 0 ? reranked.map((r) => scored[r.index]) : scored.slice(0, 6);

    // 3. Build Cohere documents + an id -> source map for citation resolution.
    const idToSource = new Map<string, Source>();
    const documents = finalDocs.map((c, i) => {
      const id = String(i);
      idToSource.set(id, { name: c.sourceName, type: c.sourceType });
      return { id, data: { title: c.sourceName, text: c.text } };
    });

    // 4. Generate the grounded answer with citations.
    const { text, citations } = await chatWithDocuments(query, documents);

    // 5. Resolve cited document ids back to UI sources, deduped by name.
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
