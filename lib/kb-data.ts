// Shared types for the knowledge base UI. The source of truth lives server-side
// (see lib/kb-store.ts) and is accessed by the client through the /api routes.

export interface KBFile {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'EXCEL' | 'CSV';
  size: string;
  status: 'Processing' | 'Ready' | 'Failed';
  uploadedAt: string;
}

export interface KBPair {
  id: string;
  question: string;
  answer: string;
  category: string;
  prioritize: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sources?: Array<{ name: string; type: string }>;
}
