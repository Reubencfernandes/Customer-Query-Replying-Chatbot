import { NextResponse } from 'next/server';
import { readStore, addQA, toPublicQA, type QARecord } from '@/lib/kb-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function qaEmbeddingText(question: string, answer: string): string {
  return `Q: ${question}\nA: ${answer}`;
}

// GET — public list of Q&A pairs (no embeddings).
export async function GET() {
  try {
    const store = await readStore();
    return NextResponse.json({ qa: store.qa.map(toPublicQA) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load Q&A pairs.';
    return NextResponse.json({ error: message, qa: [] }, { status: 500 });
  }
}

// POST — create a Q&A pair, embed it for retrieval.
export async function POST(request: Request) {
  let body: {
    question?: string;
    answer?: string;
    category?: string;
    prioritize?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const question = body.question?.trim();
  const answer = body.answer?.trim();
  if (!question || !answer) {
    return NextResponse.json(
      { error: 'Both question and answer are required.' },
      { status: 400 }
    );
  }

  const { embedDocuments } = await import('@/lib/cohere');
  const [embedding] = await embedDocuments([qaEmbeddingText(question, answer)]);

  const record: QARecord = {
    id: `qa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question,
    answer,
    category: body.category?.trim() || 'General',
    prioritize: Boolean(body.prioritize),
    embedding: embedding ?? [],
  };
  await addQA(record);

  return NextResponse.json({ qa: toPublicQA(record) });
}
