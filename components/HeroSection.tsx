'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import FloatingChatInput from './FloatingChatInput';
import MessageBubble from './MessageBubble';
import { useChatSession } from '@/lib/use-chat-session';

export default function HeroSection() {
  const bloomRef = React.useRef<HTMLDivElement>(null);
  const threadRef = React.useRef<HTMLDivElement>(null);

  // Inline conversation — runs the chat right here on `/` instead of routing
  // away to the dedicated /chat page.
  const { messages, isTyping, sendMessage, reset } = useChatSession();
  const active = messages.length > 0 || isTyping;

  // Follow-up input shown inside the chat view (separate from the big hero input).
  const [chatInput, setChatInput] = React.useState('');
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || isTyping) return;
    setChatInput('');
    sendMessage(text);
  };

  // Auto-scroll the *thread container only* (not the window) to the latest
  // message. Using scrollIntoView here would scroll the whole page and push
  // the header off-screen.
  React.useEffect(() => {
    const el = threadRef.current;
    if (active && el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping, active]);

  // GSAP-driven entrance + breathing on the bloom container.
  // The two pseudo-element layers keep drifting via CSS, so this composes on
  // top of the liquid effect rather than replacing it.
  React.useEffect(() => {
    const bloom = bloomRef.current;
    if (!bloom) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // Skip animation; just reveal it in its resting state.
      gsap.set(bloom, { opacity: 1, clearProps: 'transform,filter' });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. Cinematic bottom-to-top power-up on load.
      tl.fromTo(
        bloom,
        {
          scaleY: 0.1,
          scaleX: 0.85,
          y: 100,
          opacity: 0,
          filter: 'blur(20px) brightness(0.4)',
        },
        {
          scaleY: 1,
          scaleX: 1,
          y: 0,
          opacity: 1,
          filter: 'blur(0px) brightness(1)',
          duration: 2.4,
          ease: 'power4.out',
        }
      );

      // 2. Organic breathing loop once the entrance settles.
      tl.to(bloom, {
        scaleY: 1.02,
        scaleX: 1.01,
        y: -8,
        filter: 'blur(0px) brightness(1.04)',
        duration: 6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }, bloom);

    return () => ctx.revert();
  }, []);

  // Drive CSS variables so the gradient's bright core follows the cursor.
  // (We set variables, not transforms, so this never fights the GSAP tweens.)
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const bloom = bloomRef.current;
      if (!bloom) return;
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      bloom.style.setProperty('--bloom-mx', String(x));
      bloom.style.setProperty('--bloom-my', String(y));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section
      id="hero"
      className={`relative min-h-screen flex flex-col items-center overflow-hidden transition-colors duration-700 ${
        active ? 'bg-white' : ''
      }`}
    >
      {/* Radial multi-gradient bloom rising from the bottom-center.
          Starts hidden; GSAP fades/sweeps it in (see effect above).
          In chat mode it drops lower to sit just above the input. */}
      <div
        ref={bloomRef}
        className={`hero-bloom ${active ? 'is-chatting' : ''}`}
        style={{ opacity: 0 }}
      />

      {/* White wash behind the headline — only while in landing (idle) mode. */}
      {!active && <div className="hero-top-wash" />}

      <AnimatePresence mode="wait" initial={false}>
        {active ? (
          /* ─────────────── Inline chat view ─────────────── */
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-3xl mx-auto flex flex-col h-screen px-4 sm:px-6"
          >
            {/* Minimalist navbar — controls only, no logo */}
            <header className="flex items-center justify-end gap-1.5 py-4 select-none flex-shrink-0">
              {/* New chat — subtle text+icon button */}
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-150 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New chat
              </button>
              {/* Admin — subtle outlined pill */}
              <Link
                href="/admin"
                className="inline-flex items-center rounded-full border border-neutral-200 bg-white/60 backdrop-blur px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 transition-all duration-150"
              >
                Admin
              </Link>
            </header>

            {/* Thread — only this scrolls. The inner wrapper is min-h-full with
                justify-end so a few messages rest just above the input, while a
                long conversation still scrolls naturally from the top. */}
            <div ref={threadRef} className="flex-1 overflow-y-auto no-scrollbar px-1 min-h-0">
              <div className="min-h-full flex flex-col justify-end py-8">
                {messages.map((item) => (
                  <MessageBubble key={item.id} message={item} />
                ))}

                {/* Thinking indicator — minimal, document-style (no avatar/bubble) */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mb-10 flex items-center gap-2 text-[15px] text-neutral-400"
                  >
                    <span>Searching your knowledge base</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Follow-up input pinned to the bottom — dark, matching the home input */}
            <div className="flex-shrink-0 pb-5 pt-2">
              <form
                onSubmit={handleChatSubmit}
                className="relative flex items-center gap-2 rounded-full bg-[#262626] border border-white/10 shadow-xl shadow-black/25 pl-5 pr-2 py-2 focus-within:border-white/20 transition-all duration-200"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isTyping}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 bg-transparent text-[15px] text-white placeholder-white/40 focus:outline-none py-2 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  aria-label="Send message"
                  className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    chatInput.trim() && !isTyping
                      ? 'bg-white text-black hover:scale-105 active:scale-95 cursor-pointer'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
                  </svg>
                </button>
              </form>
              <p className="text-[10px] text-white/45 text-center mt-2.5">
                AskFlow prioritizes your custom Q&amp;A over document matches and cites its sources.
              </p>
            </div>
          </motion.div>
        ) : (
          /* ─────────────── Landing (idle) view ─────────────── */
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full flex flex-col items-center"
          >
            {/* ── Headline content (sits on the white wash) ── */}
            <div className="w-full flex flex-col items-center pt-28 px-6">
              {/* Large Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="text-[40px] sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold tracking-tight text-neutral-900 leading-[1.05] max-w-3xl text-center"
              >
                Chat with your{' '}
                <span className="gif-clipped-word italic select-all">documents</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 text-[15px] sm:text-base md:text-lg text-neutral-500 max-w-2xl font-normal leading-relaxed mx-auto text-center"
              >
                Upload PDFs, Word docs, and spreadsheets. Add custom Q&A. Get fast, grounded answers with sources.
              </motion.p>

              {/* Premium Dual CTA Pill Container */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-col items-center gap-3 w-full"
              >
                <div className="flex items-center justify-between bg-neutral-100 backdrop-blur-md pl-5 pr-1 py-1 rounded-full border border-neutral-200 shadow-xs max-w-md w-full sm:w-auto gap-4">
                  <span className="text-xs sm:text-[13px] font-sans font-normal text-neutral-500 tracking-tight text-left">
                    Build your knowledge base
                  </span>
                  <Link href="/admin" className="flex-shrink-0">
                    <button className="bg-neutral-900 hover:bg-neutral-800 text-white font-sans font-semibold text-xs px-4.5 py-2 rounded-full transition-all duration-150 active:scale-95 shadow-2xl cursor-pointer">
                      Open Admin
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* ── Floating AI Chat Input (sits in the dark, above the bloom) ── */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.36, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 w-full max-w-4xl px-6 mt-12"
            >
              <FloatingChatInput onSubmitText={sendMessage} />
            </motion.div>

            {/* Spacer so the bloom has room to breathe below the input */}
            <div className="min-h-[18vh]" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
