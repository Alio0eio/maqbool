import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Plus, ChevronUp, ChevronDown, Trash2, Save, Check, Video, FileText } from 'lucide-react';
import { INTERVIEW_QUESTIONS } from '@/lib/mock-data';
import { AnimatePresence, motion } from 'framer-motion';
import { ConfirmAction } from '@/components/shared/confirm-action';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@workspace/design-system/button';
import { Textarea } from '@workspace/design-system/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/design-system/select';
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
    <div className="max-w-2xl mx-auto pb-12 space-y-6">
      <PageHeader
        sticky
        title="Interview Question Set"
        eyebrow="Senior Product Designer · Async video"
        description={`${questions.length} question${questions.length === 1 ? '' : 's'} configured`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/recruiter/interviews')} aria-label="Back to interviews">
              <ArrowLeft className="w-[18px] h-[18px]" />
            </Button>
            <Button data-testid="btn-save" onClick={handleSave} variant={saved ? 'secondary' : 'default'}>
              {saved ? <Check className="w-[15px] h-[15px]" /> : <Save className="w-[15px] h-[15px]" />}
              {saved ? 'Saved!' : 'Save Set'}
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 text-[12.5px]" aria-label="Set summary">
        <span className="rounded-full bg-white/80 border border-border/70 px-3 py-1 font-medium">
          {questions.length} question{questions.length === 1 ? '' : 's'}
        </span>
        <span className="rounded-full bg-white/80 border border-border/70 px-3 py-1 font-medium">
          ~{Math.round(questions.reduce((n, q) => n + q.timeLimit, 0) / 60)} min total recording
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false} mode="popLayout">
        {questions.map((q, i) => {
          const isEmpty = showErrors && emptyIds.has(q.id);
          return (
            <motion.div
              key={q.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              data-testid={`question-${q.id}`}
              className={cn('rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] focus-within:border-secondary/40 focus-within:shadow-md transition-shadow', isEmpty ? 'border-destructive/50' : 'border-border/60')}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 mt-0.5 shrink-0">
                  <button
                    data-testid={`btn-move-up-${q.id}`}
                    onClick={() => move(q.id, -1)}
                    disabled={i === 0}
                    aria-label="Move question up"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">{i + 1}</span>
                  <button
                    data-testid={`btn-move-down-${q.id}`}
                    onClick={() => move(q.id, 1)}
                    disabled={i === questions.length - 1}
                    aria-label="Move question down"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <Textarea
                    value={q.question}
                    onChange={e => update(q.id, 'question', e.target.value)}
                    placeholder="Enter your question…"
                    rows={2}
                    className={cn('resize-none', isEmpty && 'border-destructive focus-visible:border-destructive')}
                  />
                  {isEmpty && <p className="text-xs text-destructive">Question text can't be empty.</p>}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-muted-foreground font-medium">Type:</span>
                      <Select value={q.type} onValueChange={v => update(q.id, 'type', v)}>
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="behavioral">Behavioral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-muted-foreground font-medium">Time limit:</span>
                      <Select value={String(q.timeLimit)} onValueChange={v => update(q.id, 'timeLimit', Number(v))}>
                        <SelectTrigger className="h-8 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">1 min</SelectItem>
                          <SelectItem value="90">1.5 min</SelectItem>
                          <SelectItem value="120">2 min</SelectItem>
                          <SelectItem value="180">3 min</SelectItem>
                          <SelectItem value="300">5 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-muted-foreground font-medium">Retakes:</span>
                      <Select value={String(q.retakes)} onValueChange={v => update(q.id, 'retakes', Number(v))}>
                        <SelectTrigger className="h-8 w-16 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3].map(r => <SelectItem key={r} value={String(r)}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                      {q.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
                {(() => {
                  const removeBtn = (
                    <button
                      type="button"
                      data-testid={`btn-remove-${q.id}`}
                      onClick={q.question.trim() ? undefined : () => remove(q.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                      aria-label={`Remove question ${i + 1}`}
                    >
                      <Trash2 className="w-[15px] h-[15px]" />
                    </button>
                  );
                  // Only ask before discarding a question that has content.
                  return q.question.trim() ? (
                    <ConfirmAction
                      title="Remove this question?"
                      description="The question text and its settings will be discarded."
                      confirmLabel="Remove question"
                      onConfirm={() => remove(q.id)}
                    >
                      {removeBtn}
                    </ConfirmAction>
                  ) : removeBtn;
                })()}
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
        {questions.length === 0 && (
          <p className="text-[13px] text-muted-foreground text-center py-6">No questions yet — add at least one before saving this set.</p>
        )}
      </div>

      <Button type="button" variant="outline" className="w-full border-dashed" onClick={addQuestion}>
        <Plus className="w-4 h-4" /> Add Question
      </Button>
    </div>
  );
}
