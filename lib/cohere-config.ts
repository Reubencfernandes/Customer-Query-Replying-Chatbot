// Central, editable configuration for the Cohere RAG pipeline.
// Swap these model names if your Cohere account exposes different versions.

export const EMBED_MODEL = 'embed-v4.0';
export const RERANK_MODEL = 'rerank-v4.0-pro';
export const CHAT_MODEL = 'command-a-plus-05-2026';

// Chunking: Cohere recommends ~400-word chunks for best retrieval performance.
export const CHUNK_WORDS = 400;
export const CHUNK_OVERLAP_WORDS = 50;

// Retrieval tuning.
// A wide cosine pool so a blended multi-topic query ("X and Y") still pulls in
// the weaker topic's chunks before reranking — for most small KBs this is
// effectively "rerank everything", which is the most robust option.
export const RETRIEVE_TOP_K = 120; // candidates pulled by cosine similarity before rerank
export const CONTEXT_TOP_N = 12; // chunks handed to the chat model after rerank + diversification
export const PER_SOURCE_CAP = 5; // max chunks from any single document in the final context
export const QA_PRIORITY_BOOST = 0.15; // cosine-score bonus for prioritized Q&A pairs
export const EMBED_BATCH = 96; // max texts per embed request

export const CHAT_SYSTEM_PROMPT = [
  'You are Query Bot, a helpful knowledge-base assistant.',
  'Answer only from the supplied documents and custom Q&A context.',
  'Keep responses accurate, relevant, and conversational.',
  'If the context is insufficient or does not answer the question, say that clearly and ask for the missing document or detail.',
  'Do not invent facts, numbers, citations, policies, names, or conclusions that are not supported by the context.',
  'When useful, mention the source context briefly in natural language.',
].join(' ');
