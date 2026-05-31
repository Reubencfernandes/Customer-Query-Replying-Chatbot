import * as React from 'react';
import Image from 'next/image';

// Colored brand logos from icons8 — these are multicolor icons, so the
// `color` query param is intentionally omitted (it has no effect on them).
const ICON_SOURCES: Record<string, string> = {
  PDF: 'https://img.icons8.com/?size=100&id=l0vjMqIboTRs&format=png',
  DOC: 'https://img.icons8.com/?size=100&id=EqxMzyq5jqdz&format=png',
  DOCX: 'https://img.icons8.com/?size=100&id=EqxMzyq5jqdz&format=png',
  EXCEL: 'https://img.icons8.com/?size=100&id=13654&format=png',
  XLS: 'https://img.icons8.com/?size=100&id=13654&format=png',
  XLSX: 'https://img.icons8.com/?size=100&id=13654&format=png',
  CSV: 'https://img.icons8.com/?size=100&id=13654&format=png',
};

interface FileTypeIconProps {
  type: string;
  size?: number;
  className?: string;
}

/**
 * Renders the icons8 brand logo for a known document type (PDF, Word,
 * Excel/CSV). Returns `null` for anything else so callers can fall back
 * to their own glyph (e.g. custom Q&A sources).
 */
export default function FileTypeIcon({ type, size = 24, className = '' }: FileTypeIconProps) {
  const src = ICON_SOURCES[type.toUpperCase()];
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={`${type} document`}
      width={size}
      height={size}
      className={className}
    />
  );
}
