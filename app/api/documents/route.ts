import { NextResponse } from 'next/server';
import {
  readStore,
  addFileRecord,
  updateFileRecord,
  toPublicFile,
  type KBFileRecord,
  type Chunk,
} from '@/lib/kb-store';
import {
  extractText,
  chunkText,
  getFileType,
  formatSize,
} from '@/lib/parsers';
import { embedDocuments } from '@/lib/cohere';

// pdf-parse / mammoth / xlsx require Node, not the edge runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function makeId() {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// GET — public list of files (no chunks/embeddings).
export async function GET() {
  const store = await readStore();
  return NextResponse.json({ files: store.files.map(toPublicFile) });
}

// POST — upload, parse, chunk, embed, persist.
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  const type = getFileType(file.name);
  if (!type) {
    return NextResponse.json(
      { error: 'Unsupported file type. Use PDF, DOCX, XLSX, XLS, or CSV.' },
      { status: 400 }
    );
  }

  const record: KBFileRecord = {
    id: makeId(),
    name: file.name,
    type,
    size: formatSize(file.size),
    status: 'Processing',
    uploadedAt: new Date().toISOString(),
    chunks: [],
  };
  await addFileRecord(record);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractText(buffer, type);
    const chunkTexts = chunkText(text);

    if (chunkTexts.length === 0) {
      const updated = await updateFileRecord(record.id, {
        status: 'Failed',
        error: 'No extractable text found in the document.',
      });
      return NextResponse.json({ file: toPublicFile(updated ?? record) }, { status: 422 });
    }

    const embeddings = await embedDocuments(chunkTexts);
    const chunks: Chunk[] = chunkTexts.map((t, i) => ({
      id: `${record.id}-c${i}`,
      text: t,
      embedding: embeddings[i] ?? [],
    }));

    const updated = await updateFileRecord(record.id, { status: 'Ready', chunks });
    return NextResponse.json({ file: toPublicFile(updated ?? record) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed.';
    const updated = await updateFileRecord(record.id, { status: 'Failed', error: message });
    return NextResponse.json(
      { file: toPublicFile(updated ?? record), error: message },
      { status: 500 }
    );
  }
}
