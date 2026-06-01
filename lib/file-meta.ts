import type { KBFile } from './kb-data';

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
