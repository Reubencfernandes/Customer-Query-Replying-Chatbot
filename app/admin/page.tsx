'use client';

import * as React from 'react';
import AdminHeader from '@/components/AdminHeader';
import FileUploadPanel from '@/components/FileUploadPanel';
import QABuilderPanel from '@/components/QABuilderPanel';
import { KBFile, KBPair } from '@/lib/kb-data';

export default function AdminPage() {
  const [files, setFiles] = React.useState<KBFile[]>([]);
  const [qaList, setQaList] = React.useState<KBPair[]>([]);
  const [lastUpdated, setLastUpdated] = React.useState<string>('Just now');

  // Ids currently being deleted, so the cards can show a "Removing…" state.
  const [deletingFileIds, setDeletingFileIds] = React.useState<Set<string>>(new Set());
  const [deletingQaIds, setDeletingQaIds] = React.useState<Set<string>>(new Set());

  // Load the knowledge base from the server on mount.
  React.useEffect(() => {
    (async () => {
      try {
        const [filesRes, qaRes] = await Promise.all([
          fetch('/api/documents'),
          fetch('/api/qa'),
        ]);
        const filesData = await filesRes.json();
        const qaData = await qaRes.json();
        setFiles(filesData.files ?? []);
        setQaList(qaData.qa ?? []);
      } catch (e) {
        console.error('Failed to load knowledge base', e);
      }
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    })();
  }, []);

  // Update Last Updated Timestamp helper
  const triggerUpdateTimestamp = () => {
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // 1. Files Upload and Management — parse + embed happens server-side.
  const handleUploadFile = async (file: File) => {
    // Let failures reject so the upload panel can surface an error state.
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/documents', { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const data = await res.json();
    if (!data.file) throw new Error('Upload returned no file');
    setFiles((prev) => {
      const others = prev.filter((f) => f.id !== data.file.id);
      return [...others, data.file];
    });
    triggerUpdateTimestamp();
  };

  const handleDeleteFile = async (id: string) => {
    setDeletingFileIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      triggerUpdateTimestamp();
    } catch (e) {
      console.error('Delete failed', e);
    } finally {
      setDeletingFileIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // 2. Custom Q&A Management
  const handleAddQA = async (question: string, answer: string, category: string, prioritize: boolean) => {
    try {
      const res = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, category, prioritize }),
      });
      const data = await res.json();
      if (data.qa) {
        setQaList((prev) => [...prev, data.qa]);
        triggerUpdateTimestamp();
      }
    } catch (e) {
      console.error('Add Q&A failed', e);
    }
  };

  const handleUpdateQA = async (id: string, question: string, answer: string, category: string, prioritize: boolean) => {
    try {
      const res = await fetch(`/api/qa/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, category, prioritize }),
      });
      const data = await res.json();
      if (data.qa) {
        setQaList((prev) => prev.map((qa) => (qa.id === id ? data.qa : qa)));
        triggerUpdateTimestamp();
      }
    } catch (e) {
      console.error('Update Q&A failed', e);
    }
  };

  const handleDeleteQA = async (id: string) => {
    setDeletingQaIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/qa/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setQaList((prev) => prev.filter((qa) => qa.id !== id));
      triggerUpdateTimestamp();
    } catch (e) {
      console.error('Delete Q&A failed', e);
    } finally {
      setDeletingQaIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Calculating counters
  const totalFiles = files.length;
  const readyFilesCount = files.filter((f) => f.status === 'Ready').length;
  const totalQAs = qaList.length;

  return (
    <main className="min-h-screen bg-black/95 text-white pt-10 pb-16 relative overflow-hidden font-sans">
      {/* Decorative dark aurora hints behind the panels */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none aurora-bg" />
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-0" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Admin header */}
        <AdminHeader />

        {/* Core Workspace Panels split side-by-side or stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-6">

          {/* Left column: File loader + its index metrics */}
          <div className="flex flex-col gap-8">
            <section className="bg-[#141414]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl hover:border-white/15 transition-all duration-300">
              <FileUploadPanel
                files={files}
                onUpload={handleUploadFile}
                onDelete={handleDeleteFile}
                deletingIds={deletingFileIds}
              />
            </section>

            {/* Index metrics — sits directly below Upload documents */}
            <div className="bg-[#141414]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-wrap gap-6 sm:gap-10 items-center justify-between shadow-2xl">
              <div className="flex items-center gap-6 sm:gap-10">
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Total Documents</p>
                  <p className="text-2xl font-semibold text-white mt-0.5 tracking-tight">{totalFiles}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Indexed (Ready)</p>
                  <p className="text-2xl font-semibold text-emerald-400 mt-0.5 tracking-tight">{readyFilesCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Custom Q&As</p>
                  <p className="text-2xl font-semibold text-white mt-0.5 tracking-tight">{totalQAs}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Last Sync</p>
                <p className="text-sm font-medium text-white/70 mt-0.5">Updated {lastUpdated}</p>
              </div>
            </div>
          </div>

          {/* Right panel: Custom Q&A compiler */}
          <section className="bg-[#141414]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl hover:border-white/15 transition-all duration-300">
            <QABuilderPanel
              qaList={qaList}
              onAdd={handleAddQA}
              onUpdate={handleUpdateQA}
              onDelete={handleDeleteQA}
              deletingIds={deletingQaIds}
            />
          </section>

        </div>

      </div>
    </main>
  );
}
