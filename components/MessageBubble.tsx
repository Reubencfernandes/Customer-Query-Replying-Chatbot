'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import Badge from './Badge';
import FileTypeIcon from './FileTypeIcon';
import { ChatMessage } from '@/lib/kb-data';

interface SourceCardProps {
  name: string;
  type: string;
}

function SourceCard({ name, type }: SourceCardProps) {
  const isFileType = ['PDF', 'DOC', 'DOCX', 'EXCEL', 'XLS', 'XLSX', 'CSV'].includes(
    type.toUpperCase()
  );

  const getBadgeColor = (): 'danger' | 'success' | 'info' | 'purple' | 'neutral' => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return 'danger';
      case 'EXCEL':
      case 'XLS':
        return 'success';
      case 'DOCX':
        return 'info';
      case 'Q&A':
        return 'purple';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-full text-xs text-white/60 transition-colors duration-200 cursor-default">
      <span className="flex-shrink-0 flex items-center justify-center">
        {isFileType ? (
          <FileTypeIcon type={type} size={16} className="block" />
        ) : (
          <span className="text-[13px] text-violet-300">✦</span>
        )}
      </span>
      <span className="font-medium truncate max-w-[150px]" title={name}>
        {name}
      </span>
      <Badge variant={getBadgeColor()} className="px-1.5 py-0 text-[8px] font-bold">
        {type}
      </Badge>
    </div>
  );
}

// Brand sparkle used as the AI avatar mark.
function SparkMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.5c.4 3.3 1.7 4.6 5 5-3.3.4-4.6 1.7-5 5-.4-3.3-1.7-4.6-5-5 3.3-.4 4.6-1.7 5-5z" />
      <path d="M18.5 13c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5z" opacity="0.7" />
    </svg>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';

  // Lightweight visual parser for simple bold, backtick code, bullet points, and newlines
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // Markdown-style headings (#, ##, ###)
      const headingMatch = line.match(/^\s*(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        return (
          <p
            key={lineIdx}
            className="text-[13px] font-bold text-white uppercase tracking-wide mt-3.5 first:mt-0 mb-0.5"
          >
            {headingMatch[2]}
          </p>
        );
      }

      // Check if it's a bullet item
      const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•');
      let cleanLine = line;
      if (isBullet) {
        cleanLine = line.trim().substring(1).trim();
      }

      // Process Code bits and Bolds
      const parts: React.ReactNode[] = [];
      let currentPointer = 0;

      // Tokenize bold and backticks
      const regex = /(\*\*.*?\*\*|`.*?`)/g;
      let match;
      let partKey = 0;

      while ((match = regex.exec(cleanLine)) !== null) {
        const matchStr = match[0];
        const matchIndex = match.index;

        // Push preceding plain text
        if (matchIndex > currentPointer) {
          parts.push(cleanLine.substring(currentPointer, matchIndex));
        }

        if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
          parts.push(
            <strong key={partKey++} className="font-semibold text-white">
              {matchStr.substring(2, matchStr.length - 2)}
            </strong>
          );
        } else if (matchStr.startsWith('`') && matchStr.endsWith('`')) {
          parts.push(
            <code key={partKey++} className="font-mono text-xs font-medium bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-violet-200">
              {matchStr.substring(1, matchStr.length - 1)}
            </code>
          );
        }

        currentPointer = regex.lastIndex;
      }

      // Push remaining text
      if (currentPointer < cleanLine.length) {
        parts.push(cleanLine.substring(currentPointer));
      }

      if (isBullet) {
        return (
          <li key={lineIdx} className="list-disc ml-5 mt-1.5 text-white/75 leading-relaxed text-sm marker:text-violet-300/60">
            <span>{parts.length > 0 ? parts : cleanLine}</span>
          </li>
        );
      }

      return (
        <p key={lineIdx} className="text-white/80 leading-relaxed text-sm min-h-[1.25rem] mt-1.5 first:mt-0">
          {parts.length > 0 ? parts : cleanLine}
        </p>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 last:mb-1`}
    >
      <div className={`flex gap-3 max-w-[88%] sm:max-w-[78%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

        {/* Avatar */}
        {isUser ? (
          <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 select-none">
            <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        ) : (
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center text-white flex-shrink-0 select-none shadow-lg shadow-violet-500/20">
            <SparkMark className="h-4 w-4" />
          </div>
        )}

        {/* Bubble */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className={`px-4.5 py-3 rounded-2xl text-sm ${
            isUser
              ? 'bg-gradient-to-br from-white/[0.13] to-white/[0.06] text-white/90 rounded-tr-md border border-white/10'
              : 'bg-white/[0.05] text-white/85 rounded-tl-md border border-white/[0.08]'
          }`}>
            <div>
              {parseContent(message.text)}
            </div>
          </div>

          {/* Citations */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {message.sources.map((src, idx) => (
                <SourceCard key={idx} name={src.name} type={src.type} />
              ))}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
