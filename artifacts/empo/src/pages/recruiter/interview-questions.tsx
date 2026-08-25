import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Plus, ChevronUp, ChevronDown, Trash2, Save, Video, FileText } from 'lucide-react';
import { INTERVIEW_QUESTIONS } from '@/lib/mock-data';
import { PageHeader } from '@/components/shared/page-header';
import { cn } from '@workspace/design-system/utils';

export default function InterviewQuestions() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [questions, setQuestions] = useState(INTERVIEW_QUESTIONS);
  const [saved, setSaved] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const emptyIds = new Set(questions.filter(q => !q.question.trim()).map(q => q.id));
  const hasErrors = emptyIds.size > 0;

  function handleSave() {
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }
  function addQuestion() {
    setQuestions(qs => [...qs, { id: Date.now(), question: '', type: 'video', timeLimit: 120, retakes: 1, order: qs.length + 1 }]);
  }
  function remove(id: number) { setQuestions(qs => qs.filter(q => q.id !== id)); }
  function update(id: number, field: string, value: any) {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, [field]: value } : q));
  }
  function move(id: number, direction: -1 | 1) {
    setQuestions(qs => {
      const idx = qs.findIndex(q => q.id === id);
      const targetIdx = idx + direction;
      if (idx === -1 || targetIdx < 0 || targetIdx >= qs.length) return qs;
      const next = [...qs];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <PageHeader
        sticky
        title="Interview Question Set"
        eyebrow="SENIOR PRODUCT DESIGNER · ASYNC VIDEO"
        description={`${questions.length} question${questions.length === 1 ? '' : 's'} configured`}
        className="mb-6"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setLocation('/recruiter/interviews')}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all">
              <ArrowLeft size={18} />
            </button>
            <button data-testid="btn-save" onClick={handleSave}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                saved ? 'bg-success text-success-foreground' : 'bg-primary text-white hover:bg-primary/90'
              )}>
              <Save size={15} />{saved ? 'Saved!' : 'Save Set'}
            </button>
          </div>
        }
      />

      <div className="space-y-3 mb-4">
        {questions.map((q, i) => {
          const isEmpty = showErrors && emptyIds.has(q.id);
          return (
            <div key={q.id} data-testid={`question-${q.id}`} className="bg-white rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 mt-0.5 shrink-0">
                  <button
                    data-testid={`btn-move-up-${q.id}`}
                    onClick={() => move(q.id, -1)}
                    disabled={i === 0}
                    aria-label="Move question up"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-mono font-bold">{i + 1}</span>
                  <button
                    data-testid={`btn-move-down-${q.id}`}
                    onClick={() => move(q.id, 1)}
                    disabled={i === questions.length - 1}
                    aria-label="Move question down"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex-1 space-y-3">
                  <textarea value={q.question} onChange={e => update(q.id, 'question', e.target.value)}
                    placeholder="Enter your question…" rows={2}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none',
                      isEmpty ? 'border-destructive' : 'border-border'
                    )} />
                  {isEmpty && <p className="text-xs text-destructive">Question text can't be empty.</p>}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Type:</span>
                      <select value={q.type} onChange={e => update(q.id, 'type', e.target.value)}
                        className="px-2 py-1 border border-border rounded text-xs bg-white focus:outline-none">
                        <option value="video">Video</option>
                        <option value="text">Text</option>
                        <option value="behavioral">Behavioral</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Time limit:</span>
                      <select value={q.timeLimit} onChange={e => update(q.id, 'timeLimit', Number(e.target.value))}
                        className="px-2 py-1 border border-border rounded text-xs bg-white focus:outline-none">
                        <option value={60}>1 min</option>
                        <option value={90}>1.5 min</option>
                        <option value={120}>2 min</option>
                        <option value={180}>3 min</option>
                        <option value={300}>5 min</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Retakes:</span>
                      <select value={q.retakes} onChange={e => update(q.id, 'retakes', Number(e.target.value))}
                        className="px-2 py-1 border border-border rounded text-xs bg-white focus:outline-none">
                        {[0, 1, 2, 3].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      {q.type === 'video' ? <Video size={14} className="text-purple-500" /> : <FileText size={14} className="text-blue-500" />}
                    </div>
                  </div>
                </div>
                <button data-testid={`btn-remove-${q.id}`} onClick={() => remove(q.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive transition-all shrink-0 mt-0.5">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No questions yet — add at least one before saving this set.</p>
        )}
      </div>

      <button data-testid="btn-add-question" onClick={addQuestion}
        className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
        <Plus size={16} /> Add Question
      </button>
    </div>
  );
}
