'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import FileTypeIcon from './FileTypeIcon';
import Badge from './Badge';
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
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-full text-xs text-neutral-600 shadow-sm transition-colors duration-200 cursor-default">
      <span className="flex-shrink-0 flex items-center justify-center">
        {isFileType ? (
          <FileTypeIcon type={type} size={16} className="block" />
        ) : (
          <span className="text-[13px] text-violet-500">✦</span>
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

interface MessageBubbleProps {
  message: ChatMessage;
}

// Lightweight visual parser for simple bold, backtick code, bullet points and
// newlines. Renders as document-style flowing text (no bubble) for both turns.
function parseContent(text: string) {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // Markdown-style headings (#, ##, ###)
    const headingMatch = line.match(/^\s*(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      return (
        <p
          key={lineIdx}
          className="text-[13px] font-bold uppercase tracking-wide text-neutral-900 mt-5 first:mt-0 mb-1"
        >
          {headingMatch[2]}
        </p>
      );
    }

    const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•');
    let cleanLine = line;
    if (isBullet) {
      cleanLine = line.trim().substring(1).trim();
    }

    const parts: React.ReactNode[] = [];
    let currentPointer = 0;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;
    let partKey = 0;

    while ((match = regex.exec(cleanLine)) !== null) {
      const matchStr = match[0];
      const matchIndex = match.index;

      if (matchIndex > currentPointer) {
        parts.push(cleanLine.substring(currentPointer, matchIndex));
      }

      if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
        parts.push(
          <strong key={partKey++} className="font-semibold text-neutral-900">
            {matchStr.substring(2, matchStr.length - 2)}
          </strong>
        );
      } else if (matchStr.startsWith('`') && matchStr.endsWith('`')) {
        parts.push(
          <code
            key={partKey++}
            className="font-mono text-[13px] font-medium px-1.5 py-0.5 rounded border bg-violet-50 border-violet-200 text-violet-700"
          >
            {matchStr.substring(1, matchStr.length - 1)}
          </code>
        );
      }

      currentPointer = regex.lastIndex;
    }

    if (currentPointer < cleanLine.length) {
      parts.push(cleanLine.substring(currentPointer));
    }

    if (isBullet) {
      return (
        <li
          key={lineIdx}
          className="list-disc ml-5 mt-1.5 leading-7 text-[15px] text-neutral-700 marker:text-violet-400"
        >
          <span>{parts.length > 0 ? parts : cleanLine}</span>
        </li>
      );
    }

    return (
      <p
        key={lineIdx}
        className="leading-7 text-[15px] text-neutral-700 mt-3 first:mt-0 min-h-[1.25rem]"
      >
        {parts.length > 0 ? parts : cleanLine}
      </p>
    );
  });
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';

  // User turn — a compact, right-aligned pill so it stays distinct from the
  // full-width assistant text without an avatar.
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full justify-end mb-6"
      >
        <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-neutral-100 border border-neutral-200/80 px-4 py-2.5">
          {parseContent(message.text)}
        </div>
      </motion.div>
    );
  }

  // Assistant turn — full-width, document-style flowing text (no bubble, no
  // avatar). Citations sit underneath.
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full mb-10"
    >
      <div>{parseContent(message.text)}</div>

      {message.sources && message.sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {message.sources.map((src, idx) => (
            <SourceCard key={idx} name={src.name} type={src.type} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
