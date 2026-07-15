'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import type { CreateSurveyInput } from '@cement/shared-types';
import { apiClient, ApiError } from '../../../lib/api';

interface QuestionDraft {
  text: string;
  options: string[];
}

/**
 * فرم‌ساز نظرسنجی (بخش ۹.۹.۵). افزودن پویای سوال و گزینه؛ هر سوال حداقل ۲ گزینه.
 * ذخیره اولیه در وضعیت DRAFT.
 */
export function SurveyBuilderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}): React.ReactElement {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { text: '', options: ['', ''] },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(qi: number, text: string): void {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, text } : q)));
  }
  function updateOption(qi: number, oi: number, value: string): void {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q,
      ),
    );
  }
  function addQuestion(): void {
    setQuestions((qs) => [...qs, { text: '', options: ['', ''] }]);
  }
  function removeQuestion(qi: number): void {
    setQuestions((qs) => qs.filter((_, i) => i !== qi));
  }
  function addOption(qi: number): void {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, options: [...q.options, ''] } : q)));
  }
  function removeOption(qi: number, oi: number): void {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q)),
    );
  }

  function validate(): string | null {
    if (title.trim() === '') return 'عنوان نظرسنجی الزامی است';
    if (questions.length === 0) return 'نظرسنجی باید حداقل یک سوال داشته باشد';
    for (const q of questions) {
      if (q.text.trim() === '') return 'متن همه سوالات را کامل کنید';
      const filled = q.options.filter((o) => o.trim() !== '');
      if (filled.length < 2) return 'هر سوال باید حداقل دو گزینه معتبر داشته باشد';
    }
    return null;
  }

  async function submit(): Promise<void> {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setBusy(true);
    const payload: CreateSurveyInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()).filter((o) => o !== ''),
      })),
    };
    try {
      await apiClient.post('/admin/surveys', payload);
      onCreated();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'ایجاد نظرسنجی ناموفق بود');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl p-6 shadow-lg animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">ایجاد نظرسنجی جدید</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="بستن">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">عنوان</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">توضیح (اختیاری)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
            />
          </div>

          {questions.map((q, qi) => (
            <div key={qi} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">سوال {qi + 1}</span>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qi)}
                    className="text-red-500 hover:text-red-700"
                    title="حذف سوال"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <input
                value={q.text}
                onChange={(e) => updateQuestion(qi, e.target.value)}
                placeholder="متن سوال"
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-600"
              />
              <div className="space-y-2">
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      value={o}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`گزینه ${oi + 1}`}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-600"
                    />
                    {q.options.length > 2 && (
                      <button
                        onClick={() => removeOption(qi, oi)}
                        className="text-slate-400 hover:text-red-600"
                        title="حذف گزینه"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => addOption(qi)}
                className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-3.5 w-3.5" />
                افزودن گزینه
              </button>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            افزودن سوال
          </button>

          {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              انصراف
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2 text-sm text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              ذخیره پیش‌نویس
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
