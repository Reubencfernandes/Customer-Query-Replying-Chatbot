'use client';

import * as React from 'react';
import UploadedFileCard from './UploadedFileCard';
import FileTypeIcon from './FileTypeIcon';
import { KBFile } from '@/lib/kb-data';

interface FileUploadPanelProps {
  files: KBFile[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => void;
  deletingIds: Set<string>;
}

type UploadStatus = 'uploading' | 'done' | 'error';

interface PendingUpload {
  id: string;
  name: string;
  file: File;
  progress: number;
  status: UploadStatus;
}

let uploadSeq = 0;

export default function FileUploadPanel({ files, onUpload, onDelete, deletingIds }: FileUploadPanelProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [uploads, setUploads] = React.useState<PendingUpload[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const dismissUpload = (id: string) =>
    setUploads((prev) => prev.filter((u) => u.id !== id));

  // Upload a real file: parsing + embedding happens server-side, so we show an
  // indeterminate progress bar that creeps toward 90% until the POST resolves.
  const startUpload = (file: File) => {
    const fileId = `up-${uploadSeq++}`;

    setUploads((prev) => [
      ...prev,
      { id: fileId, name: file.name, file, progress: 8, status: 'uploading' },
    ]);

    let prog = 8;
    const interval = setInterval(() => {
      prog = Math.min(90, prog + Math.floor(Math.random() * 8) + 4);
      setUploads((prev) =>
        prev.map((u) => (u.id === fileId && u.status === 'uploading' ? { ...u, progress: prog } : u))
      );
    }, 300);

    const succeed = () => {
      clearInterval(interval);
      // Don't show a separate "file uploaded" card. The file is already added
      // to the knowledge-base list below, so just remove the progress toast and
      // let the file card itself signal completion.
      dismissUpload(fileId);
    };

    const fail = () => {
      clearInterval(interval);
      setUploads((prev) =>
        prev.map((u) => (u.id === fileId ? { ...u, status: 'error' } : u))
      );
    };

    Promise.resolve(onUpload(file)).then(succeed, fail);
  };

  const retryUpload = (u: PendingUpload) => {
    dismissUpload(u.id);
    startUpload(u.file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const eligibleFiles = droppedFiles.filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        return ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'csv'].includes(ext);
      });

      if (eligibleFiles.length > 0) {
        eligibleFiles.forEach((f) => startUpload(f));
      } else {
        alert('Please drop accepted file types (PDF, DOCX, XLSX, XLS, CSV).');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      selected.forEach((f) => startUpload(f));
      // Reset input value to allow uploading same file again if deleted
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Headers */}
      <div>
        <h2 className="text-xl font-semibold text-white tracking-tight">Upload documents</h2>
        <p className="text-sm text-white/50 mt-1 leading-relaxed">
          Drag and drop PDFs, Word documents, and spreadsheets into your knowledge base.
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-white/40 bg-white/5 hover:border-white/50'
            : 'border-white/10 bg-black/20 hover:border-white/20'
        }`}
      >
        {/* Document Icons – fanned-out brand logos */}
        <div className="flex items-end justify-center mb-5">
          <FileTypeIcon
            type="PDF"
            size={44}
            className="-rotate-12 translate-y-1 drop-shadow-xl transition-transform duration-300"
          />
          <FileTypeIcon
            type="DOCX"
            size={54}
            className="-mx-2 z-10 drop-shadow-2xl transition-transform duration-300"
          />
          <FileTypeIcon
            type="EXCEL"
            size={44}
            className="rotate-12 translate-y-1 drop-shadow-xl transition-transform duration-300"
          />
        </div>

        <p className="text-sm font-medium text-white/90">Drop your files here</p>
        <p className="text-xs text-white/40 mt-1">PDF, DOCX, XLSX, XLS, or CSV up to 25MB</p>

        <button
          type="button"
          onClick={triggerBrowse}
          className="mt-5 inline-flex items-center justify-center h-9 px-4 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors duration-150 active:scale-[0.98] cursor-pointer"
        >
          Browse files
        </button>
      </div>

      {/* Files List Heading */}
      <div className="mt-8">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">
          Knowledge Base (Files)
        </h3>

        {/* Upload status toasts (uploading / done / error) */}
        {uploads.length > 0 && (
          <div className="mt-3 space-y-2.5">
            {uploads.map((u) => (
              <UploadToast
                key={u.id}
                upload={u}
                onCancel={() => dismissUpload(u.id)}
                onRetry={() => retryUpload(u)}
              />
            ))}
          </div>
        )}

        {/* Stable List of Files */}
        {files.length === 0 && uploads.length === 0 ? (
          <div className="mt-3 p-8 border border-white/5 rounded-2xl bg-black/20 text-center text-xs text-white/30">
            No documents uploaded yet. Place your documents here to augment AI knowledge.
          </div>
        ) : (
          <div className="mt-3 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {files.map((file) => (
              <UploadedFileCard
                key={file.id}
                file={file}
                onDelete={onDelete}
                isDeleting={deletingIds.has(file.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom informational footline */}
      <p className="text-[11px] text-white/30 mt-auto pt-6 leading-normal flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Documents are indexed for AI search after upload.
      </p>
    </div>
  );
}

const TOAST_CONFIG: Record<
  UploadStatus,
  { glow: string; ring: string; bar: string; title: string; desc: string; icon: React.ReactNode }
> = {
  uploading: {
    glow: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, rgba(59,130,246,0.25) 45%, transparent 72%)',
    ring: 'border-indigo-400/60 text-indigo-300',
    bar: 'from-indigo-400 to-violet-400',
    title: 'Just a minute…',
    desc: 'Your file is uploading right now. Hang tight while we finish.',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l5-5m-5 5l-5-5" />
      </svg>
    ),
  },
  done: {
    glow: 'radial-gradient(circle, rgba(16,185,129,0.55) 0%, rgba(20,184,166,0.2) 45%, transparent 72%)',
    ring: 'border-emerald-400/60 text-emerald-300',
    bar: 'from-emerald-400 to-teal-400',
    title: 'Your file was uploaded!',
    desc: 'Added to your knowledge base and queued for AI indexing.',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    glow: 'radial-gradient(circle, rgba(244,63,94,0.55) 0%, rgba(225,29,72,0.2) 45%, transparent 72%)',
    ring: 'border-rose-400/60 text-rose-300',
    bar: 'from-rose-400 to-pink-400',
    title: 'We are so sorry!',
    desc: "There was an error and your file couldn't be uploaded. Try again?",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
      </svg>
    ),
  },
};

interface UploadToastProps {
  upload: PendingUpload;
  onCancel: () => void;
  onRetry: () => void;
}

function UploadToast({ upload, onCancel, onRetry }: UploadToastProps) {
  const { name, progress, status } = upload;
  const cfg = TOAST_CONFIG[status];
  const btn =
    'inline-flex items-center justify-center h-8 px-4 rounded-lg text-xs font-semibold bg-white/[0.06] border border-white/10 text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#161616]/90 backdrop-blur-md p-4">
      {/* Soft corner glow tinted by status */}
      <div
        className="pointer-events-none absolute -top-12 -right-10 h-32 w-52 blur-3xl opacity-70"
        style={{ background: cfg.glow }}
      />

      <div className="relative flex gap-3.5">
        {/* Status icon ring */}
        <div className={`mt-0.5 h-9 w-9 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${cfg.ring} ${status === 'uploading' ? 'animate-pulse' : ''}`}>
          {cfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">{cfg.title}</p>
          <p className="text-xs text-white/50 mt-1 leading-relaxed">{cfg.desc}</p>
          <p className="text-[11px] text-white/40 mt-1 truncate font-mono" title={name}>
            {name}
          </p>

          {status === 'uploading' && (
            <div className="mt-3 flex items-end gap-3">
              <div className="flex-1">
                <div className="flex justify-end mb-1">
                  <span className="text-[11px] font-semibold text-white/70 font-mono">{progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${cfg.bar} transition-all duration-200`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <button onClick={onCancel} className={btn}>
                Cancel
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-3 flex items-center gap-2">
              <button onClick={onRetry} className={btn}>
                Retry
              </button>
              <button onClick={onCancel} className={btn}>
                Cancel
              </button>
            </div>
          )}

          {status === 'done' && (
            <div className="mt-3">
              <button onClick={onCancel} className={btn}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
