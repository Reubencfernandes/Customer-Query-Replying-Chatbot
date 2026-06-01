'use client';

import * as React from 'react';
import { ChatMessage } from '@/lib/kb-data';

/**
 * Shared chat session logic (messages + RAG request handling).
 *
 * Extracted so the same conversation engine drives both the dedicated
 * `/chat` page and the inline chat on the homepage (`/`).
 */
export function useChatSession() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);

  // Monotonic counter guarantees unique keys even within the same millisecond.
  const idCounter = React.useRef(0);
  const makeId = React.useCallback(
    (role: 'user' | 'ai') => `m-${Date.now()}-${idCounter.current++}-${role}`,
    []
  );

  const sendMessage = React.useCallback(
    async (textToSend: string) => {
      if (!textToSend.trim()) return;

      const userMsg: ChatMessage = {
        id: makeId('user'),
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, userMsg]);
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
    },
    [makeId]
  );

  const reset = React.useCallback(() => {
    setMessages([]);
    setIsTyping(false);
  }, []);

  return { messages, isTyping, sendMessage, reset };
}
