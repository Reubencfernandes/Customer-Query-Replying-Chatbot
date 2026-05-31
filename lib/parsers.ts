import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import type { KBFile } from './kb-data';
import { CHUNK_WORDS, CHUNK_OVERLAP_WORDS } from './cohere-config';

// Document parsing (server-side only — these libraries require the Node runtime).

export type FileType = KBFile['type'];

const EXT_TO_TYPE: Record<string, FileType> = {
  pdf: 'PDF',
  doc: 'DOCX',
  docx: 'DOCX',
  xls: 'EXCEL',
  xlsx: 'EXCEL',
  csv: 'CSV',
};

export const ACCEPTED_EXTENSIONS = Object.keys(EXT_TO_TYPE);

/** Map a filename to one of the KBFile.type labels. Returns null if unsupported. */
export function getFileType(fileName: string): FileType | null {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_TYPE[ext] ?? null;
}

/** Human-readable size string matching the original FileUploadPanel formatting. */
export function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(1)} MB`;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // pdf-parse v2: construct PDFParse with the data buffer, then getText().
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    // Join per-page text (clean) rather than result.text, which interleaves
    // "-- N of M --" page markers that would add noise to embeddings.
    return result.pages.map((p) => p.text).join('\n\n');
  } finally {
    await parser.destroy();
  }
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
