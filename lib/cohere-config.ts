// Central, editable configuration for the Cohere RAG pipeline.
// Swap these model names if your Cohere account exposes different versions.

export const EMBED_MODEL = 'embed-v4.0';
export const RERANK_MODEL = 'rerank-v4.0-pro';
export const CHAT_MODEL = 'command-a-plus-05-2026';

// Chunking: Cohere recommends ~400-word chunks for best retrieval performance.
export const CHUNK_WORDS = 400;
export const CHUNK_OVERLAP_WORDS = 50;

// Retrieval tuning.
export const RETRIEVE_TOP_K = 30; // candidates pulled by cosine similarity before rerank
export const RERANK_TOP_N = 6; // documents handed to the chat model after rerank
export const QA_PRIORITY_BOOST = 0.15; // cosine-score bonus for prioritized Q&A pairs
export const EMBED_BATCH = 96; // max texts per embed request
