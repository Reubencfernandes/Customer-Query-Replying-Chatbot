'use client';

import * as React from 'react';
import QACard from './QACard';
import { KBPair } from '@/lib/kb-data';

interface QABuilderPanelProps {
  qaList: KBPair[];
  onAdd: (q: string, a: string, cat: string, prio: boolean) => void;
  onUpdate: (id: string, q: string, a: string, cat: string, prio: boolean) => void;
  onDelete: (id: string) => void;
}

export default function QABuilderPanel({ qaList, onAdd, onUpdate, onDelete }: QABuilderPanelProps) {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [category, setCategory] = React.useState('General');
  const [prioritize, setPrioritize] = React.useState(false);
  
  // Track active edit mode
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const categories = ['General', 'HR', 'Support', 'Pricing', 'Technical'];

  // Vibrant per-category gradients used when a chip is selected.
  const categoryGradients: Record<string, string> = {
    General: 'from-violet-500 to-indigo-500',
    HR: 'from-pink-500 to-fuchsia-500',
    Support: 'from-blue-500 to-cyan-500',
    Pricing: 'from-emerald-500 to-teal-500',
    Technical: 'from-orange-500 to-rose-500',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    if (editingId) {
      onUpdate(editingId, question.trim(), answer.trim(), category.trim(), prioritize);
      setEditingId(null);
    } else {
      onAdd(question.trim(), answer.trim(), category.trim(), prioritize);
    }

    // Reset fields
    setQuestion('');
    setAnswer('');
    setCategory('General');
    setPrioritize(false);
  };

  const handleEditInit = (qa: KBPair) => {
    setEditingId(qa.id);
    setQuestion(qa.question);
    setAnswer(qa.answer);
    setCategory(qa.category || 'General');
    setPrioritize(qa.prioritize);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setCategory('General');
    setPrioritize(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Headers */}
      <div>
        <h2 className="text-xl font-semibold text-white tracking-tight">Custom Q&A</h2>
        <p className="text-sm text-white/50 mt-1 leading-relaxed">
          Add direct answers for important questions your users may ask.
        </p>
      </div>

      {/* Main Q&A Form */}
      <form onSubmit={handleSubmit} className="mt-6 bg-black/20 border border-white/10 p-5 rounded-2xl flex flex-col gap-4">
        {editingId && (
          <div className="flex items-center justify-between bg-white text-black px-3.5 py-1.5 rounded-xl text-xs font-medium border border-white/20">
            <span className="flex items-center gap-1.5 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Editing Q&A Pair
            </span>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-neutral-500 hover:text-black transition-colors duration-150 underline decoration-dotted text-[11px] cursor-pointer"
            >
              Cancel Edit
            </button>
          </div>
        )}

        {/* Question Input */}
        <div>
          <label htmlFor="question-input" className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
            Question
          </label>
          <input
            id="question-input"
            type="text"
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are standard work hours?"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30 placeholder:text-white/30"
          />
        </div>

        {/* Answer Text Area */}
        <div>
          <label htmlFor="answer-textarea" className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
            Direct Answer
          </label>
          <textarea
            id="answer-textarea"
            required
            rows={3}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Provide a clear, detailed answer..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30 placeholder:text-white/30 resize-none"
          />
        </div>

        {/* Category + Suggestion Chips */}
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const acts = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer active:scale-95 ${
                    acts
                      ? `bg-gradient-to-r ${categoryGradients[cat]} text-white border-transparent shadow-lg shadow-black/30`
                      : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between pt-1 select-none">
          <div className="flex flex-col pr-4">
            <span className="text-xs font-bold text-white/90">Prioritize this answer</span>
            <span className="text-[10px] text-white/40 mt-0.5">
              Overrides document matches and returns this exact text.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPrioritize(!prioritize)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              prioritize ? 'bg-white' : 'bg-white/20'
            }`}
          >
            <span className="sr-only">Toggle prioritization</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow-sm ring-0 transition duration-200 ease-in-out ${
                prioritize ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Submit — animated GIF background matching the hero "documents" word */}
        <button
          type="submit"
          className="gif-bg group relative mt-2 w-full h-11 inline-flex items-center justify-center overflow-hidden rounded-full text-sm font-bold tracking-wide cursor-pointer ring-1 ring-white/20 transition-all duration-200 hover:ring-white/40 active:ring-white/50 active:scale-[0.98]"
        >
          {/* Dark scrim keeps the label legible over the moving GIF; clears on
              press so the button turns transparent on click. */}
          <span className="absolute inset-0 bg-black/35 group-hover:bg-black/20 group-active:bg-transparent transition-colors duration-200" />
          <span className="relative text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
            {editingId ? 'Update Q&A' : 'Add Q&A'}
          </span>
        </button>
      </form>

      {/* Custom Q&A list container */}
      <div className="mt-8">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
          Configured Pairings ({qaList.length})
        </h3>

        {qaList.length === 0 ? (
          <div className="p-8 border border-white/5 rounded-2xl bg-black/20 text-center text-xs text-white/30 select-none">
            No Q&A pairs configured yet. Add them above to bypass search algorithms.
          </div>
        ) : (
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {qaList.map((qa) => (
              <QACard
                key={qa.id}
                qa={qa}
                onEdit={handleEditInit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
