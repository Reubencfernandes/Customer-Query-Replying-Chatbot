import { NextResponse } from 'next/server';
import { deleteFileRecord } from '@/lib/kb-store';

export const runtime = 'nodejs';

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const removed = await deleteFileRecord(id);
  if (!removed) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
