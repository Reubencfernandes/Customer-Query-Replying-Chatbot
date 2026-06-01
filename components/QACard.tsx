'use client';

import * as React from 'react';
import { KBPair } from '@/lib/kb-data';

interface QACardProps {
  qa: KBPair;
  onEdit: (qa: KBPair) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// Vibrant per-category gradient used for the category chip.
const CATEGORY_GRADIENT: Record<string, string> = {
  General: 'from-violet-500 to-indigo-500',
  HR: 'from-pink-500 to-fuchsia-500',
  Support: 'from-blue-500 to-cyan-500',
  Pricing: 'from-emerald-500 to-teal-500',
  Technical: 'from-orange-500 to-rose-500',
};

// Per-category aurora glow colors bleeding up from the bottom of the card.
const CATEGORY_AURORA: Record<string, React.CSSProperties> = {
  General: { ['--aurora-1' as string]: 'rgba(168,85,247,0.5)', ['--aurora-2' as string]: 'rgba(99,102,241,0.45)' },
  HR: { ['--aurora-1' as string]: 'rgba(236,72,153,0.5)', ['--aurora-2' as string]: 'rgba(168,85,247,0.4)' },
  Support: { ['--aurora-1' as string]: 'rgba(59,130,246,0.5)', ['--aurora-2' as string]: 'rgba(34,211,238,0.45)' },
  Pricing: { ['--aurora-1' as string]: 'rgba(16,185,129,0.5)', ['--aurora-2' as string]: 'rgba(132,204,22,0.4)' },
  Technical: { ['--aurora-1' as string]: 'rgba(249,115,22,0.5)', ['--aurora-2' as string]: 'rgba(244,63,94,0.4)' },
};

export default function QACard({ qa, onEdit, onDelete, isDeleting = false }: QACardProps) {
  const aurora = CATEGORY_AURORA[qa.category] ?? CATEGORY_AURORA.General;
  const gradient = CATEGORY_GRADIENT[qa.category] ?? CATEGORY_GRADIENT.General;
  return (
    <div
      style={aurora}
      className={`aurora-card p-4 bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl transition-all duration-300 select-none ${
        isDeleting ? 'opacity-50' : 'hover:border-white/20'
      }`}
    >
      <div className="flex flex-col gap-2">
        {/* badges line */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${gradient} px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm`}>
              {qa.category || 'General'}
            </span>
          </div>

          {/* edit + delete buttons (or a Removing… indicator) */}
          {isDeleting ? (
            <span className="inline-flex items-center gap-2 text-[11px] font-medium text-red-300/90">
              <Spinner className="w-3.5 h-3.5" />
              Removing…
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(qa)}
                title="Edit Q&A Pair"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 border border-transparent transition-all duration-200 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(qa.id)}
                title="Delete Q&A Pair"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/20 border border-transparent transition-all duration-200 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Question text */}
        <h4 className="text-sm font-semibold text-white/90 tracking-tight leading-snug">
          {qa.question}
        </h4>

        {/* Answer text */}
        <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
          {qa.answer}
        </p>
      </div>
    </div>
  );
}
