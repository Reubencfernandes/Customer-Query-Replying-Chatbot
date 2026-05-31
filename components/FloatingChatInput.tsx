'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

const PLACEHOLDERS = [
  "Ask your documents a question...",
  "Summarize the Q3 financial report...",
  "Extract action items from the meeting notes...",
  "Find clauses about termination...",
];

export default function FloatingChatInput() {
  const router = useRouter();
  const [val, setVal] = React.useState('');
  const [phText, setPhText] = React.useState('');
  const [phIndex, setPhIndex] = React.useState(0);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const currentString = PLACEHOLDERS[phIndex];
    let timeout: NodeJS.Timeout;
    
    if (isDeleting) {
      timeout = setTimeout(() => {
        setPhText(currentString.substring(0, phText.length - 1));
        if (phText.length <= 1) {
          setIsDeleting(false);
          setPhIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }
      }, 40);
    } else {
      timeout = setTimeout(() => {
        setPhText(currentString.substring(0, phText.length + 1));
        if (phText.length === currentString.length) {
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, 2500);
        }
      }, 60);
    }

    return () => clearTimeout(timeout);
  }, [phText, isDeleting, phIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(val.trim())}`);
  };

  const handleKeydown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mt-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col relative bg-[#262626]/90 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-[0_12px_50px_-6px_rgba(0,0,0,0.3)] focus-within:shadow-[0_16px_60px_-4px_rgba(0,0,0,0.5)] focus-within:border-white/15 hover:border-white/10 transition-all duration-300 p-3 min-h-[140px] max-w-[720px] mx-auto"
      >
        {/* Input Area */}
        <div className="flex-1 px-3 pt-2 pb-2">
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={handleKeydown}
            placeholder={phText}
            className="w-full h-full min-h-[60px] bg-transparent text-white placeholder-neutral-400 focus:outline-none text-base resize-none font-sans"
          />
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-end px-2 pt-2 border-t border-transparent">
          {/* Right Actions (Submit) */}
          <button
            type="submit"
            disabled={!val.trim()}
            className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
              val.trim() 
                ? 'bg-white text-black hover:scale-105 active:scale-95 cursor-pointer' 
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
