'use client';

import * as React from 'react';
import Badge from './Badge';
import FileTypeIcon from './FileTypeIcon';
import { KBFile } from '@/lib/kb-data';

interface UploadedFileCardProps {
  file: KBFile;
  onDelete: (id: string) => void;
}

// Per-type aurora glow colors that bleed up from the bottom of the card.
const AURORA: Record<string, React.CSSProperties> = {
  PDF: { ['--aurora-1' as string]: 'rgba(244,63,94,0.55)', ['--aurora-2' as string]: 'rgba(249,115,22,0.45)' },
  DOCX: { ['--aurora-1' as string]: 'rgba(59,130,246,0.55)', ['--aurora-2' as string]: 'rgba(34,211,238,0.45)' },
  EXCEL: { ['--aurora-1' as string]: 'rgba(16,185,129,0.55)', ['--aurora-2' as string]: 'rgba(132,204,22,0.4)' },
  CSV: { ['--aurora-1' as string]: 'rgba(168,85,247,0.55)', ['--aurora-2' as string]: 'rgba(99,102,241,0.45)' },
};

export default function UploadedFileCard({ file, onDelete }: UploadedFileCardProps) {
  // Brand logo for the file type, sitting on a subtle dark tile to match
  // the admin theme.
  const renderIcon = () => (
    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
      <FileTypeIcon type={file.type} size={22} />
    </div>
  );

  const statusVariants: Record<string, 'success' | 'warning' | 'danger'> = {
    Ready: 'success',
    Processing: 'warning',
    Failed: 'danger',
  };

  return (
    <div
      style={AURORA[file.type] ?? AURORA.CSV}
      className="aurora-card flex items-center justify-between p-4 bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300 select-none"
    >
      {/* File Metainfo */}
      <div className="flex items-center gap-3 min-w-0 pr-4">
        {renderIcon()}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-white/50 font-mono">{file.size}</span>
            <span className="text-white/30 text-[10px]">•</span>
            <Badge variant={file.type === 'PDF' ? 'danger' : file.type === 'EXCEL' ? 'success' : file.type === 'DOCX' ? 'info' : 'purple'} className="py-0 px-1.5 text-[9px] bg-white/10 text-white border-white/10">
              {file.type}
            </Badge>
          </div>
        </div>
      </div>

      {/* Delete and Status */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Badge
          variant={statusVariants[file.status] || 'neutral'}
          className={`text-[10px] py-0.5 px-2 bg-white/10 text-white border-white/10 ${file.status === 'Processing' ? 'animate-pulse' : ''}`}
        >
          {file.status}
        </Badge>

        <button
          onClick={() => onDelete(file.id)}
          aria-label="Delete document"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-colors duration-200 border border-transparent cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
