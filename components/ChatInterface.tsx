'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import MessageBubble from './MessageBubble';
import { ChatMessage } from '@/lib/kb-data';

// Brand sparkle mark reused for the logo and AI avatar.
function SparkMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.5c.4 3.3 1.7 4.6 5 5-3.3.4-4.6 1.7-5 5-.4-3.3-1.7-4.6-5-5 3.3-.4 4.6-1.7 5-5z" />
      <path d="M18.5 13c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5z" opacity="0.7" />
    </svg>
  );
}

export default function ChatInterface() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State hooks
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Monotonic counter guarantees unique message keys even when several
  // messages are created within the same millisecond.
  const idCounter = React.useRef(0);
  const makeId = React.useCallback(
    (role: 'user' | 'ai') => `m-${Date.now()}-${idCounter.current++}-${role}`,
    []
  );

  // Suggested chip queries
  const suggestedChips = [
    { label: 'How do I request PTO?', query: 'How do I request PTO?' },
    { label: 'Support SLA & hours', query: 'What are the support hours for enterprise clients' },
    { label: 'Growth Plan Pricing', query: 'Show me pricing and plans' },
  ];

  // Handle message sending action
  const handleSend = React.useCallback(async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Create user message
    const userMsg: ChatMessage = {
      id: makeId('user'),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Query the RAG pipeline: retrieve + rerank + grounded answer with citations.
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const data: { text: string; sources?: Array<{ name: string; type: string }> } =
        await res.json();

      const aiMsg: ChatMessage = {
        id: makeId('ai'),
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
        sources: data.sources,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const aiMsg: ChatMessage = {
        id: makeId('ai'),
        sender: 'ai',
        text:
          "Sorry — I ran into a problem reaching the knowledge base. Please make sure your Cohere API key is configured and try again.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [makeId]);

  // Helper: auto-scroll to latest message
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Check query parameters for a redirected landing-page query and send it
  // once. The guard prevents React Strict Mode's double effect invocation
  // (and any re-run) from dispatching the same query twice — which created
  // two messages sharing one key.
  const landingHandledRef = React.useRef(false);
  React.useEffect(() => {
    if (landingHandledRef.current) return;
    const landingQuery = searchParams?.get('q');
    if (landingQuery) {
      landingHandledRef.current = true;
      // Defer to a microtask so we don't call setState synchronously inside
      // the effect; the guard above already blocks the duplicate dispatch.
      Promise.resolve().then(() => handleSend(landingQuery));
      // Clean URL parameters cleanly
      router.replace('/chat', { scroll: false });
    }
  }, [searchParams, router, handleSend]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    handleSend(inputVal.trim());
  };

  const isEmpty = messages.length === 0 && !isTyping;

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full px-4 sm:px-6">

      {/* Top bar */}
      <header className="flex items-center justify-between py-4 select-none flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
            <SparkMark className="h-4 w-4" />
          </span>
          <span className="text-white/80 text-sm font-semibold tracking-tight group-hover:text-white transition-colors duration-200">
            AskFlow
          </span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors duration-200 rounded-full border border-white/10 hover:border-white/20 px-3 py-1.5"
        >
          ← Home
        </Link>
      </header>

      {/* Body */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 min-h-0">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <span className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-violet-500/25 mb-5">
              <SparkMark className="h-7 w-7" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Ask your knowledge base
            </h1>
            <p className="mt-2.5 text-sm text-white/45 max-w-md leading-relaxed">
              Grounded answers from your documents and custom Q&amp;A — with the exact sources cited.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-7">
              {suggestedChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.query)}
                  className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/25 text-xs text-white/70 hover:text-white transition-all duration-150 cursor-pointer focus:outline-none"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-6 px-1 scrollbar-thin scrollbar-thumb-white/10 min-h-0">
          <div>
            {messages.map((item) => (
              <MessageBubble key={item.id} message={item} />
            ))}

            {/* Thinking indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full justify-start mb-6"
              >
                <div className="flex gap-3 max-w-[75%]">
                  <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-violet-500/20">
                    <SparkMark className="h-4 w-4 animate-pulse" />
                  </span>
                  <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-md px-4.5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white/40 font-medium mr-1">Searching your knowledge base</span>
                      <span className="h-1.5 w-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="pt-3 pb-5 flex-shrink-0">
        <form
          onSubmit={onFormSubmit}
          className="relative flex items-end gap-2 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-2 pl-4 focus-within:border-white/25 focus-within:bg-white/[0.06] hover:border-white/15 transition-all duration-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isTyping}
            placeholder="Ask a question from your documents…"
            className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/30 py-2.5 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isTyping}
            className={`flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
              inputVal.trim() && !isTyping
                ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white hover:scale-105 shadow-lg shadow-violet-500/30 cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
            </svg>
          </button>
        </form>

        <p className="text-[10px] text-white/20 text-center mt-2.5">
          AskFlow prioritizes your custom Q&amp;A over document matches. Answers may cite sources below each reply.
        </p>
      </div>

    </div>
  );
}
