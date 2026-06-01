import { NextResponse } from 'next/server';
import { readStore, updateQA, deleteQA, toPublicQA } from '@/lib/kb-store';

export const runtime = 'nodejs';

function qaEmbeddingText(question: string, answer: string): string {
  return `Q: ${question}\nA: ${answer}`;
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

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

  const store = await readStore();
  const existing = store.qa.find((q) => q.id === id);
  if (!existing) {
    return NextResponse.json({ error: 'Q&A not found.' }, { status: 404 });
  }

  // Re-embed only if the question or answer text changed.
  const textChanged =
    existing.question !== question || existing.answer !== answer;
  const { embedDocuments } = textChanged
    ? await import('@/lib/cohere')
    : { embedDocuments: null };
  const embedding = textChanged
    ? (await embedDocuments!([qaEmbeddingText(question, answer)]))[0] ?? existing.embedding
    : existing.embedding;

  const updated = await updateQA(id, {
    question,
    answer,
    category: body.category?.trim() || 'General',
    prioritize: Boolean(body.prioritize),
    embedding,
  });

  return NextResponse.json({ qa: toPublicQA(updated!) });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const removed = await deleteQA(id);
  if (!removed) {
    return NextResponse.json({ error: 'Q&A not found.' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
