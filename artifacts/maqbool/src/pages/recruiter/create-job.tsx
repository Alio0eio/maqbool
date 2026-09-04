import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Controller, useForm } from 'react-hook-form';
import { Check, ChevronRight, ArrowLeft, Plus, X } from 'lucide-react';
import { SCREENING_QUESTIONS } from '@/lib/mock-data';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { CardContent } from '@workspace/design-system/card';
import { Button } from '@workspace/design-system/button';
import { Input } from '@workspace/design-system/input';
import { Textarea } from '@workspace/design-system/textarea';
import { Label } from '@workspace/design-system/label';
import { Badge } from '@workspace/design-system/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/design-system/select';
import { cn } from '@workspace/design-system/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { StepTransition, useStepDirection } from '@/components/shared/step-transition';

const STEPS = [
  { key: 'basic', label: 'Basic Info', desc: 'Title, location, type' },
  { key: 'description', label: 'Description', desc: 'Role details & requirements' },
  { key: 'screening', label: 'Screening', desc: 'Filter questions' },
  { key: 'publish', label: 'Publish', desc: 'Review & go live' },
] as const;

type Step = (typeof STEPS)[number]['key'];

interface JobFormValues {
  title: string;
  department: string;
  experienceLevel: string;
  location: string;
  locationType: string;
  type: string;
  salaryMin: string;
  salaryMax: string;
  closingDate: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
}

// Which fields must pass validation before the wizard allows advancing past
// a given step. Screening/publish have no plain-text fields of their own.
const STEP_FIELDS: Record<Step, (keyof JobFormValues)[]> = {
  basic: ['title', 'location'],
  description: ['description'],
  screening: [],
  publish: [],
};

export default function CreateJobFlow() {
  const params = useParams<{ step: string }>();
  const step = (params.step ?? 'basic') as Step;
  const [, setLocation] = useLocation();

  const stepIdx = STEPS.findIndex(s => s.key === step);
  const direction = useStepDirection(stepIdx);

  const {
    register,
    control,
    trigger,
    watch,
    formState: { errors },
  } = useForm<JobFormValues>({
    mode: 'onBlur',
    defaultValues: {
      title: '', department: '', experienceLevel: 'Senior', location: '', locationType: 'hybrid',
      type: 'full_time', salaryMin: '', salaryMax: '', closingDate: '',
      description: '', requirements: '', responsibilities: '', benefits: '',
    },
  });
  const form = watch();

  const [skills, setSkills] = useState(['Figma', 'User Research']);
  const [questions, setQuestions] = useState(SCREENING_QUESTIONS.slice(0, 3));
  const remainingQuestions = SCREENING_QUESTIONS.filter(sq => !questions.some(q => q.id === sq.id));

  async function next() {
    const fields = STEP_FIELDS[step];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    const nextStep = STEPS[stepIdx + 1];
    if (nextStep) setLocation(`/recruiter/jobs/new/${nextStep.key}`);
  }
  function prev() {
    const prevStep = STEPS[stepIdx - 1];
    if (prevStep) setLocation(`/recruiter/jobs/new/${prevStep.key}`);
    else setLocation('/recruiter/jobs');
  }
  function publish() {
    setLocation('/recruiter/jobs');
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-8">
      <PageHeader
        sticky
        title="Create New Job"
        eyebrow={`Step ${stepIdx + 1} of ${STEPS.length} · ${STEPS[stepIdx].label}`}
        description={STEPS[stepIdx].desc}
        actions={
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            aria-label={stepIdx === 0 ? 'Cancel' : 'Back'}
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
          </Button>
        }
      />

      {/* Step indicator */}
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <motion.div
                animate={i === stepIdx ? { scale: [0.85, 1] } : { scale: 1 }}
                transition={{ type: 'spring', bounce: 0.35, duration: 0.4 }}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-colors',
                  i < stepIdx ? 'bg-success text-success-foreground' :
                  i === stepIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={i < stepIdx ? 'done' : 'pending'}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center"
                  >
                    {i < stepIdx ? <Check className="w-4 h-4" /> : i + 1}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
              <div className="text-[11px] font-medium mt-1.5 text-center hidden md:block">
                <span className={i === stepIdx ? 'text-primary font-semibold' : 'text-muted-foreground'}>{s.label}</span>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-px mx-2 mb-5 transition-colors duration-300', i < stepIdx ? 'bg-success' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <ViewfinderCard className="overflow-hidden">
        <CardContent className="p-6">
        <StepTransition stepKey={step} direction={direction}>
        {step === 'basic' && (
          <div className="space-y-6">
            <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">Basic information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="title">Job title *</Label>
                <Input
                  id="title"
                  data-testid="input-title"
                  {...register('title', { required: 'Job title is required.' })}
                  placeholder="e.g. Senior Product Designer"
                  className={cn(errors.title && 'border-destructive focus-visible:border-destructive')}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Design', 'Engineering', 'Product', 'Data & Analytics', 'Marketing', 'Sales', 'Operations'].map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Experience level</Label>
                <Controller
                  name="experienceLevel"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Entry', 'Mid', 'Senior', 'Lead', 'Director'].map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  data-testid="input-location"
                  {...register('location', { required: 'Location is required.' })}
                  placeholder="e.g. San Francisco, CA"
                  className={cn(errors.location && 'border-destructive focus-visible:border-destructive')}
                />
                {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Work type</Label>
                <Controller
                  name="locationType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-location-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Employment type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full-time</SelectItem>
                        <SelectItem value="part_time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="closingDate">Closing date</Label>
                <Input
                  id="closingDate"
                  data-testid="input-closing"
                  type="date"
                  {...register('closingDate', {
                    validate: (v) => !v || v >= new Date().toISOString().slice(0, 10) || 'Closing date must be in the future.',
                  })}
                  className={cn(errors.closingDate && 'border-destructive focus-visible:border-destructive')}
                />
                {errors.closingDate && <p className="text-xs text-destructive">{errors.closingDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salaryMin">Salary min ($)</Label>
                <Input id="salaryMin" data-testid="input-salary-min" type="number" {...register('salaryMin')} placeholder="130000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salaryMax">Salary max ($)</Label>
                <Input
                  id="salaryMax"
                  data-testid="input-salary-max"
                  type="number"
                  {...register('salaryMax', {
                    validate: (v) => !v || !form.salaryMin || Number(v) >= Number(form.salaryMin) || 'Max salary must be at least the minimum.',
                  })}
                  placeholder="170000"
                  className={cn(errors.salaryMax && 'border-destructive focus-visible:border-destructive')}
                />
                {errors.salaryMax && <p className="text-xs text-destructive">{errors.salaryMax.message}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 'description' && (
          <div className="space-y-6">
            <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">Job description</h2>
            <div className="space-y-1.5">
              <Label htmlFor="description">Job description *</Label>
              <Textarea
                id="description"
                data-testid="input-description"
                {...register('description', {
                  required: 'A job description is required.',
                  minLength: { value: 40, message: 'Please write at least 40 characters.' },
                })}
                placeholder="Describe the role, team, and impact..."
                rows={5}
                className={cn('resize-none', errors.description && 'border-destructive focus-visible:border-destructive')}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            {[
              { key: 'responsibilities' as const, label: 'Responsibilities', placeholder: '• Lead end-to-end design for key product areas\n• Collaborate with engineers and PMs...' },
              { key: 'requirements' as const, label: 'Requirements', placeholder: '• 5+ years of product design experience\n• Expert-level Figma skills...' },
              { key: 'benefits' as const, label: 'Benefits & Perks', placeholder: '• Competitive equity package\n• Comprehensive health benefits...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <Textarea id={key} data-testid={`input-${key}`} {...register(key)} placeholder={placeholder} rows={5} className="resize-none" />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Skills (tags)</Label>
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-[10px] border border-border/60 bg-white">
                {skills.map(s => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1.5">
                    {s}
                    <button
                      type="button"
                      onClick={() => setSkills(prev => prev.filter(sk => sk !== s))}
                      className="text-primary/60 hover:text-primary"
                      aria-label={`Remove ${s}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  placeholder="Add skill…"
                  className="outline-none text-sm flex-1 min-w-24 bg-transparent placeholder:text-muted-foreground/70"
                  onKeyDown={e => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (v) { setSkills(prev => [...prev, v]); (e.target as HTMLInputElement).value = ''; } }}}
                />
              </div>
            </div>
          </div>
        )}

        {step === 'screening' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">Screening questions</h2>
              <p className="text-[13px] text-muted-foreground mt-1">Add questions to filter candidates before they advance to interviews.</p>
            </div>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="p-4 rounded-[10px] border border-border/60 bg-surface-subtle/60">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-foreground">{q.question}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <Badge variant="info" className="capitalize">{q.type.replace('_', ' ')}</Badge>
                        {q.required && <Badge variant="destructive">Required</Badge>}
                      </div>
                    </div>
                    <button
                      onClick={() => setQuestions(qs => qs.filter(x => x.id !== q.id))}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors shrink-0"
                      aria-label="Remove question"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-[13px] text-muted-foreground text-center py-6">No screening questions yet — candidates will go straight through without prescreening.</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              disabled={remainingQuestions.length === 0}
              onClick={() => {
                if (remainingQuestions.length) setQuestions(qs => [...qs, remainingQuestions[0]]);
              }}
            >
              <Plus className="w-4 h-4" />
              {remainingQuestions.length === 0 ? 'All available questions added' : 'Add question'}
            </Button>
          </div>
        )}

        {step === 'publish' && (
          <div className="space-y-6">
            <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">Review & publish</h2>
            <div className="p-4 bg-success/10 border border-success/30 rounded-[10px]">
              <p className="text-[13.5px] font-semibold text-success">Ready to publish</p>
              <p className="text-[12.5px] text-success/80 mt-1">Your job posting is complete. Publishing will make it live and visible to candidates.</p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Title', value: form.title || '—' },
                { label: 'Department', value: form.department || '—' },
                { label: 'Location', value: form.location ? `${form.location} · ${form.locationType}` : '—' },
                { label: 'Type', value: form.type.replace('_', '-') },
                { label: 'Salary', value: form.salaryMin || form.salaryMax ? `$${form.salaryMin || '0'} – $${form.salaryMax || '0'}` : 'Not specified' },
                { label: 'Screening Questions', value: `${questions.length} question${questions.length === 1 ? '' : 's'} configured` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-[13.5px] border-b border-border/60 pb-2.5">
                  <span className="text-muted-foreground font-medium">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        </StepTransition>
        </CardContent>
      </ViewfinderCard>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" data-testid="btn-back" onClick={prev}>
          <ArrowLeft className="w-[15px] h-[15px]" /> {stepIdx === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step === 'publish' ? (
          <Button data-testid="btn-publish" onClick={publish}>
            <Check className="w-[15px] h-[15px]" /> Publish job
          </Button>
        ) : (
          <Button data-testid="btn-next" onClick={next}>
            Continue <ChevronRight className="w-[15px] h-[15px]" />
          </Button>
        )}
      </div>
    </div>
  );
}
