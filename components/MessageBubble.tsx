'use client';

import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
          <span className="text-[13px] text-violet-500">*</span>
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

function MarkdownContent({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mt-6 first:mt-0 mb-2 text-xl font-bold tracking-tight text-neutral-950">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-5 first:mt-0 mb-2 text-lg font-bold tracking-tight text-neutral-950">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-5 first:mt-0 mb-1 text-[13px] font-bold uppercase tracking-wide text-neutral-900">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className={`${compact ? 'mt-1 leading-6' : 'mt-3 leading-7'} first:mt-0 text-[15px] text-neutral-700`}>
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-neutral-900">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-neutral-800">{children}</em>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className={`${compact ? 'mt-2' : 'mt-3'} space-y-1.5 pl-5 text-[15px] text-neutral-700 list-disc`}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className={`${compact ? 'mt-2' : 'mt-3'} space-y-1.5 pl-5 text-[15px] text-neutral-700 list-decimal`}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-7 marker:text-violet-400">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mt-4 border-l-2 border-violet-300 pl-4 text-neutral-600">
            {children}
          </blockquote>
        ),
        code: ({ className, children, ...props }) => {
          const isBlock = className?.startsWith('language-');

          if (isBlock) {
            return (
              <code className={`block overflow-x-auto whitespace-pre p-4 text-[13px] ${className ?? ''}`} {...props}>
                {children}
              </code>
            );
          }

          return (
            <code
              className="rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 font-mono text-[13px] font-medium text-violet-700"
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-950 text-neutral-50 shadow-sm">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-full border-collapse text-left text-sm text-neutral-700">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-neutral-200 bg-neutral-50 px-3 py-2 font-semibold text-neutral-900">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-t border-neutral-100 px-3 py-2 align-top">{children}</td>
        ),
        hr: () => <hr className="my-5 border-neutral-200" />,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full justify-end mb-6"
      >
        <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-neutral-100 border border-neutral-200/80 px-4 py-2.5">
          <MarkdownContent text={message.text} compact />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full mb-10"
    >
      <MarkdownContent text={message.text} />

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
