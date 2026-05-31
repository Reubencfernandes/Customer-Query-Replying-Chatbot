'use client';

import * as React from 'react';
import Link from 'next/link';

interface AdminHeaderProps {
  status: 'Draft' | 'Published';
  onPublish: () => void;
}

export default function AdminHeader({ status, onPublish }: AdminHeaderProps) {
  const [justPublished, setJustPublished] = React.useState(false);

  const handlePublishClick = () => {
    onPublish();
    setJustPublished(true);
    setTimeout(() => {
      setJustPublished(false);
    }, 3000);
  };

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

      {/* Right Action Bar */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {/* Publish Trigger */}
        <button
          type="button"
          onClick={handlePublishClick}
          className="inline-flex items-center justify-center h-9 px-5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-600 shadow-lg shadow-fuchsia-500/25 hover:brightness-110 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          {justPublished ? 'Saving...' : status === 'Draft' ? 'Publish' : 'Re-publish'}
        </button>
      </div>
    </div>
  );
}
