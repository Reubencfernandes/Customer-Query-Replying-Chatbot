import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { CHUNK_WORDS, CHUNK_OVERLAP_WORDS } from './cohere-config';
import type { FileType } from './file-meta';

export { ACCEPTED_EXTENSIONS, formatSize, getFileType } from './file-meta';

// Document parsing (server-side only; these libraries require the Node runtime).

async function extractPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

function extractSpreadsheet(buffer: Buffer): string {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const blocks: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) {
      blocks.push(`Sheet: ${sheetName}\n${csv}`);
    }
  }
  return blocks.join('\n\n');
}

/** Extract plain text from an uploaded file buffer based on its type. */
export async function extractText(
  buffer: Buffer,
  type: FileType
): Promise<string> {
  switch (type) {
    case 'PDF':
      return extractPdf(buffer);
    case 'DOCX':
      return extractDocx(buffer);
    case 'EXCEL':
    case 'CSV':
      return extractSpreadsheet(buffer);
    default:
      return '';
  }
}

/** Split text into ~CHUNK_WORDS-word windows with CHUNK_OVERLAP_WORDS overlap. */
export function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  const step = Math.max(1, CHUNK_WORDS - CHUNK_OVERLAP_WORDS);
  for (let i = 0; i < words.length; i += step) {
    const slice = words.slice(i, i + CHUNK_WORDS);
    const chunk = slice.join(' ').trim();
    if (chunk) chunks.push(chunk);
    if (i + CHUNK_WORDS >= words.length) break;
  }
  return chunks;
}
