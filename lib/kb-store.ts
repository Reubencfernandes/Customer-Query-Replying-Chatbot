import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { KBFile, KBPair } from './kb-data';

// Server-side source of truth for the knowledge base: a single JSON file on disk.
// Holds parsed document chunks + embeddings and Q&A pairs + embeddings.
//
// This is a dev/single-instance store. Serverless or multi-instance deployments
// would need a real database / vector store — only this module would change.

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'kb.json');
const TMP_PATH = path.join(DATA_DIR, 'kb.json.tmp');

export interface Chunk {
  id: string;
  text: string;
  embedding: number[];
}

export interface KBFileRecord {
  id: string;
  name: string;
  type: KBFile['type'];
  size: string;
  status: KBFile['status'];
  uploadedAt: string;
  error?: string;
  chunks: Chunk[];
}

export interface QARecord extends KBPair {
  embedding: number[];
}

export interface KBStore {
  version: 1;
  files: KBFileRecord[];
  qa: QARecord[];
}

// Uniform retrieval candidate produced from both files and Q&A pairs.
export interface RetrievalCandidate {
  kind: 'file' | 'qa';
  sourceName: string;
  sourceType: string;
  text: string;
  embedding: number[];
  prioritize: boolean;
}

const EMPTY_STORE: KBStore = { version: 1, files: [], qa: [] };

// --- In-process write lock -------------------------------------------------
// Chains every read-modify-write so concurrent route invocations in the same
// Node process don't interleave and clobber each other. (Single process only.)
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  // Keep the chain alive even if a step rejects.
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readStore(): Promise<KBStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<KBStore>;
    return {
      version: 1,
      files: parsed.files ?? [],
      qa: parsed.qa ?? [],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...EMPTY_STORE };
    }
    // Corrupt JSON or other read error: fail safe to an empty store rather than crash.
    console.error('Failed to read kb.json, starting empty:', err);
    return { ...EMPTY_STORE };
  }
}

async function writeStore(store: KBStore): Promise<void> {
  await ensureDataDir();
  // Atomic write: write to a temp file, then rename over the target.
  await fs.writeFile(TMP_PATH, JSON.stringify(store), 'utf8');
  await fs.rename(TMP_PATH, STORE_PATH);
}

// --- Public projections (strip embeddings/chunks before sending to client) --

export function toPublicFile(rec: KBFileRecord): KBFile {
  return {
    id: rec.id,
    name: rec.name,
    type: rec.type,
    size: rec.size,
    status: rec.status,
    uploadedAt: rec.uploadedAt,
  };
}

export function toPublicQA(rec: QARecord): KBPair {
  return {
    id: rec.id,
    question: rec.question,
    answer: rec.answer,
    category: rec.category,
    prioritize: rec.prioritize,
  };
}

// --- File record mutations -------------------------------------------------

export function addFileRecord(rec: KBFileRecord): Promise<void> {
  return withLock(async () => {
    const store = await readStore();
    store.files.push(rec);
    await writeStore(store);
  });
}

export function updateFileRecord(
  id: string,
  patch: Partial<KBFileRecord>
): Promise<KBFileRecord | null> {
  return withLock(async () => {
    const store = await readStore();
    const idx = store.files.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    store.files[idx] = { ...store.files[idx], ...patch };
    await writeStore(store);
    return store.files[idx];
  });
}

export function deleteFileRecord(id: string): Promise<boolean> {
  return withLock(async () => {
    const store = await readStore();
    const before = store.files.length;
    store.files = store.files.filter((f) => f.id !== id);
    if (store.files.length === before) return false;
    await writeStore(store);
    return true;
  });
}

// --- Q&A mutations ---------------------------------------------------------

export function addQA(rec: QARecord): Promise<void> {
  return withLock(async () => {
    const store = await readStore();
    store.qa.push(rec);
    await writeStore(store);
  });
}

export function updateQA(
  id: string,
  patch: Partial<QARecord>
): Promise<QARecord | null> {
  return withLock(async () => {
    const store = await readStore();
    const idx = store.qa.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    store.qa[idx] = { ...store.qa[idx], ...patch };
    await writeStore(store);
    return store.qa[idx];
  });
}

export function deleteQA(id: string): Promise<boolean> {
  return withLock(async () => {
    const store = await readStore();
    const before = store.qa.length;
    store.qa = store.qa.filter((q) => q.id !== id);
    if (store.qa.length === before) return false;
    await writeStore(store);
    return true;
  });
}

// --- Retrieval -------------------------------------------------------------

/** Flatten every Ready file's chunks plus every Q&A pair into uniform candidates. */
export async function getAllChunksWithMeta(): Promise<RetrievalCandidate[]> {
  const store = await readStore();
  const candidates: RetrievalCandidate[] = [];

  for (const file of store.files) {
    if (file.status !== 'Ready') continue;
    for (const chunk of file.chunks) {
      candidates.push({
        kind: 'file',
        sourceName: file.name,
        sourceType: file.type,
        text: chunk.text,
        embedding: chunk.embedding,
        prioritize: false,
      });
    }
  }

  for (const qa of store.qa) {
    candidates.push({
      kind: 'qa',
      sourceName: `Custom Q&A: ${qa.category}`,
      sourceType: 'Q&A',
      text: `Q: ${qa.question}\nA: ${qa.answer}`,
      embedding: qa.embedding,
      prioritize: qa.prioritize,
    });
  }

  return candidates;
}
