'use client';

import * as React from 'react';
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <main className="h-screen bg-[#03020a] relative overflow-hidden">
      {/* Aurora-style ambient background matching the homepage dark section */}
      <div className="aurora-bg pointer-events-none" />

      {/* Radial glow from center */}
      <div className="chat-page-glow" />

      {/* Centered Chat Layout */}
      <div className="relative z-10 h-full">
        <React.Suspense fallback={
          <div className="flex h-full items-center justify-center text-sm font-semibold text-white/40 font-sans">
            Initializing AskFlow chat instance...
          </div>
        }>
          <ChatInterface />
        </React.Suspense>
      </div>
    </main>
  );
}
