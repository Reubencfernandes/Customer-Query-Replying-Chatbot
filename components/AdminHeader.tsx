'use client';

import * as React from 'react';
import Link from 'next/link';

export default function AdminHeader() {
  return (
    <div className="w-full pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {/* Left Side: Back to home and Dashboard title */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center h-9 px-4 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-blue-500/25 hover:brightness-110 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          ← Home
        </Link>
        <h1 className="text-xl font-bold text-white tracking-tight">Knowledge Base Admin</h1>
      </div>

      {/* Changes save and publish automatically — no manual publish step. */}
      <div className="flex items-center gap-2 text-xs font-medium text-white/50">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Auto-saved &amp; published
      </div>
    </div>
  );
}
