import { NextResponse } from 'next/server';
import { del, get } from '@vercel/blob';
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
export const maxDuration = 60;

function makeId() {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const arrayBuffer = await new Response(stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function createFileRecord(
  fileName: string,
  fileSize: number,
  buffer: Buffer
): Promise<NextResponse> {
  const type = getFileType(fileName);
  if (!type) {
    return NextResponse.json(
      { error: 'Unsupported file type. Use PDF, DOCX, XLSX, XLS, or CSV.' },
      { status: 400 }
    );
  }

  const record: KBFileRecord = {
    id: makeId(),
    name: fileName,
    type,
    size: formatSize(fileSize),
    status: 'Processing',
    uploadedAt: new Date().toISOString(),
    chunks: [],
  };
  await addFileRecord(record);

  try {
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

export async function GET() {
  try {
    const store = await readStore();
    return NextResponse.json({ files: store.files.map(toPublicFile) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load documents.';
    return NextResponse.json({ error: message, files: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    let body: { blobPathname?: string; name?: string; size?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const blobPathname = body.blobPathname?.trim();
    const fileName = body.name?.trim();
    if (!blobPathname || !fileName) {
      return NextResponse.json(
        { error: 'blobPathname and name are required.' },
        { status: 400 }
      );
    }

    try {
      const blob = await get(blobPathname, { access: 'private', useCache: false });
      if (!blob || blob.statusCode !== 200) {
        return NextResponse.json({ error: 'Uploaded blob was not found.' }, { status: 404 });
      }

      const buffer = await streamToBuffer(blob.stream);
      const response = await createFileRecord(fileName, body.size ?? blob.blob.size, buffer);

      // The raw upload is only a handoff object. The indexed KB is stored separately.
      await del(blobPathname).catch(() => undefined);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Blob processing failed.';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

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

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    return createFileRecord(file.name, file.size, buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
