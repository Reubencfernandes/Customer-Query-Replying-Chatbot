'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import FloatingChatInput from './FloatingChatInput';

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center overflow-hidden"
    >
      {/* Radial multi-gradient bloom rising from the bottom-center */}
      <div className="hero-bloom" />

      {/* White wash behind the headline, melting into the dark (no hard seam) */}
      <div className="hero-top-wash" />

      {/* ── Headline content (sits on the white wash) ── */}
      <div className="relative z-10 w-full flex flex-col items-center pt-28 px-6">
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
        <FloatingChatInput />
      </motion.div>

      {/* Spacer so the bloom has room to breathe below the input */}
      <div className="flex-1 min-h-[18vh]" />
    </section>
  );
}
