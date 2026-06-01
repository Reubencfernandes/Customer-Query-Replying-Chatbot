import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getFileType } from '@/lib/parsers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  }

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const fileName = pathname.split('/').pop() ?? pathname;
        if (!getFileType(fileName)) {
          throw new Error('Unsupported file type. Use PDF, DOCX, XLSX, XLS, or CSV.');
        }

        return {
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
        };
      },
    });

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload token generation failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
