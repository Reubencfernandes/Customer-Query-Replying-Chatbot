'use client';

import * as React from 'react';
import AdminHeader from '@/components/AdminHeader';
import FileUploadPanel from '@/components/FileUploadPanel';
import QABuilderPanel from '@/components/QABuilderPanel';
import { KBFile, KBPair } from '@/lib/kb-data';

export default function AdminPage() {
  const [files, setFiles] = React.useState<KBFile[]>([]);
  const [qaList, setQaList] = React.useState<KBPair[]>([]);
  const [status, setStatus] = React.useState<'Draft' | 'Published'>('Draft');
  const [lastUpdated, setLastUpdated] = React.useState<string>('Just now');

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
    setStatus('Draft'); // Switch status to Draft when edits are made
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
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setFiles((prev) => prev.filter((f) => f.id !== id));
      triggerUpdateTimestamp();
    } catch (e) {
      console.error('Delete failed', e);
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
    try {
      await fetch(`/api/qa/${id}`, { method: 'DELETE' });
      setQaList((prev) => prev.filter((qa) => qa.id !== id));
      triggerUpdateTimestamp();
    } catch (e) {
      console.error('Delete Q&A failed', e);
    }
  };

  // 3. Publish Configuration Action
  const handlePublish = () => {
    setStatus('Published');
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // Calculating counters
  const totalFiles = files.length;
  const readyFilesCount = files.filter((f) => f.status === 'Ready').length;
  const totalQAs = qaList.length;

  return (
    <main className="min-h-screen bg-black/95 text-white pt-10 pb-16 relative overflow-hidden">
      {/* Decorative dark aurora hints behind the panels */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none aurora-bg" />
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-0" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Admin header */}
        <AdminHeader status={status} onPublish={handlePublish} />

        {/* Core Workspace Panels split side-by-side or stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-6">
          
          {/* Left panel: File documents loader */}
          <section className="bg-[#141414]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl hover:border-white/15 transition-all duration-300">
            <FileUploadPanel
              files={files}
              onUpload={handleUploadFile}
              onDelete={handleDeleteFile}
            />
          </section>

          {/* Right panel: Custom Q&A compiler */}
          <section className="bg-[#141414]/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl hover:border-white/15 transition-all duration-300">
            <QABuilderPanel
              qaList={qaList}
              onAdd={handleAddQA}
              onUpdate={handleUpdateQA}
              onDelete={handleDeleteQA}
            />
          </section>

        </div>

        {/* Bottom informational metrics footer */}
        <div className="mt-8 bg-[#141414]/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center shadow-2xl">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 sm:gap-10 w-full sm:w-auto">
            {/* Metric 1 */}
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Total Documents</p>
              <p className="text-xl font-semibold text-white mt-0.5">{totalFiles}</p>
            </div>
            {/* Metric 2 */}
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Indexed (Ready)</p>
              <p className="text-xl font-semibold text-emerald-400 mt-0.5">{readyFilesCount}</p>
            </div>
            {/* Metric 3 */}
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Custom Q&As</p>
              <p className="text-xl font-semibold text-white mt-0.5">{totalQAs}</p>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0 w-full sm:w-auto">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Last Sync State</p>
            <p className="text-sm font-medium text-white/70 mt-0.5">Updated {lastUpdated}</p>
          </div>
        </div>

      </div>
    </main>
  );
}
