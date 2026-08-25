import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { SCREENING_QUESTIONS } from '@/lib/mock-data';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { CardContent } from '@workspace/design-system/card';
import { cn } from '@workspace/design-system/utils';

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

  const {
    register,
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
    <div className="max-w-3xl mx-auto pb-12">
      <PageHeader
        sticky
        title="Create New Job"
        eyebrow={`STEP ${stepIdx + 1} OF ${STEPS.length} · ${STEPS[stepIdx].label.toUpperCase()}`}
        description={STEPS[stepIdx].desc}
        className="mb-6"
        actions={
          <button
            onClick={prev}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all"
            aria-label={stepIdx === 0 ? 'Cancel' : 'Back'}
          >
            <ArrowLeft size={18} />
          </button>
        }
      />

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center font-display font-semibold text-sm transition-all',
                i < stepIdx ? 'bg-success text-success-foreground' :
                i === stepIdx ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              )}>
                {i < stepIdx ? <Check size={16} /> : i + 1}
              </div>
              <div className="text-xs font-medium mt-1 text-center hidden md:block">
                <div className={i === stepIdx ? 'text-primary font-semibold' : 'text-muted-foreground'}>{s.label}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 mb-5', i < stepIdx ? 'bg-success' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <ViewfinderCard className="shadow-sm">
        <CardContent className="p-6">
        {step === 'basic' && (
          <div className="space-y-5">
            <h2 className="text-lg font-display font-semibold text-foreground">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">Job Title *</label>
                <input
                  data-testid="input-title"
                  {...register('title', { required: 'Job title is required.' })}
                  placeholder="e.g. Senior Product Designer"
                  className={cn(
                    'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                    errors.title ? 'border-destructive' : 'border-border'
                  )}
                />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Department</label>
                <select data-testid="select-department" {...register('department')}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                  <option value="">Select department</option>
                  {['Design', 'Engineering', 'Product', 'Data & Analytics', 'Marketing', 'Sales', 'Operations'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Experience Level</label>
                <select data-testid="select-level" {...register('experienceLevel')}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                  {['Entry', 'Mid', 'Senior', 'Lead', 'Director'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Location *</label>
                <input
                  data-testid="input-location"
                  {...register('location', { required: 'Location is required.' })}
                  placeholder="e.g. San Francisco, CA"
                  className={cn(
                    'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                    errors.location ? 'border-destructive' : 'border-border'
                  )}
                />
                {errors.location && <p className="text-xs text-destructive mt-1">{errors.location.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Work Type</label>
                <select data-testid="select-location-type" {...register('locationType')}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Employment Type</label>
                <select data-testid="select-type" {...register('type')}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Closing Date</label>
                <input
                  data-testid="input-closing"
                  type="date"
                  {...register('closingDate', {
                    validate: (v) => !v || v >= new Date().toISOString().slice(0, 10) || 'Closing date must be in the future.',
                  })}
                  className={cn(
                    'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                    errors.closingDate ? 'border-destructive' : 'border-border'
                  )}
                />
                {errors.closingDate && <p className="text-xs text-destructive mt-1">{errors.closingDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Salary Min ($)</label>
                <input data-testid="input-salary-min" type="number" {...register('salaryMin')}
                  placeholder="130000" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Salary Max ($)</label>
                <input
                  data-testid="input-salary-max"
                  type="number"
                  {...register('salaryMax', {
                    validate: (v) => !v || !form.salaryMin || Number(v) >= Number(form.salaryMin) || 'Max salary must be at least the minimum.',
                  })}
                  placeholder="170000"
                  className={cn(
                    'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                    errors.salaryMax ? 'border-destructive' : 'border-border'
                  )}
                />
                {errors.salaryMax && <p className="text-xs text-destructive mt-1">{errors.salaryMax.message}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 'description' && (
          <div className="space-y-5">
            <h2 className="text-lg font-display font-semibold text-foreground">Job Description</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Job Description *</label>
              <textarea
                data-testid="input-description"
                {...register('description', {
                  required: 'A job description is required.',
                  minLength: { value: 40, message: 'Please write at least 40 characters.' },
                })}
                placeholder="Describe the role, team, and impact..."
                rows={5}
                className={cn(
                  'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none',
                  errors.description ? 'border-destructive' : 'border-border'
                )}
              />
              {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
            </div>
            {[
              { key: 'responsibilities' as const, label: 'Responsibilities', placeholder: '• Lead end-to-end design for key product areas\n• Collaborate with engineers and PMs...' },
              { key: 'requirements' as const, label: 'Requirements', placeholder: '• 5+ years of product design experience\n• Expert-level Figma skills...' },
              { key: 'benefits' as const, label: 'Benefits & Perks', placeholder: '• Competitive equity package\n• Comprehensive health benefits...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
                <textarea data-testid={`input-${key}`} {...register(key)}
                  placeholder={placeholder} rows={5}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Skills (tags)</label>
              <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg">
                {skills.map(s => (
                  <span key={s} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium flex items-center gap-1">
                    {s}
                    <button onClick={() => setSkills(prev => prev.filter(sk => sk !== s))} className="text-primary/60 hover:text-primary ml-1">×</button>
                  </span>
                ))}
                <input placeholder="Add skill…" className="outline-none text-sm flex-1 min-w-24"
                  onKeyDown={e => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (v) { setSkills(prev => [...prev, v]); (e.target as HTMLInputElement).value = ''; } }}} />
              </div>
            </div>
          </div>
        )}

        {step === 'screening' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">Screening Questions</h2>
              <p className="text-sm text-muted-foreground mt-1">Add questions to filter candidates before they advance to interviews.</p>
            </div>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={q.id} className="p-4 border border-border rounded-xl bg-muted/30">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{q.question}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full capitalize">{q.type.replace('_', ' ')}</span>
                        {q.required && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full">Required</span>}
                      </div>
                    </div>
                    <button onClick={() => setQuestions(qs => qs.filter(x => x.id !== q.id))}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors">×</button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No screening questions yet — candidates will go straight through without prescreening.</p>
              )}
            </div>
            <button
              disabled={remainingQuestions.length === 0}
              onClick={() => {
                if (remainingQuestions.length) setQuestions(qs => [...qs, remainingQuestions[0]]);
              }}
              className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted-foreground">
              {remainingQuestions.length === 0 ? 'All available questions added' : '+ Add Question'}
            </button>
          </div>
        )}

        {step === 'publish' && (
          <div className="space-y-5">
            <h2 className="text-lg font-display font-semibold text-foreground">Review & Publish</h2>
            <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
              <p className="text-sm font-semibold text-success">Ready to publish</p>
              <p className="text-xs text-success/80 mt-1">Your job posting is complete. Publishing will make it live and visible to candidates.</p>
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
                <div key={label} className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground font-medium">{label}</span>
                  <span className="text-foreground font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        </CardContent>
      </ViewfinderCard>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button data-testid="btn-back" onClick={prev}
          className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-all">
          <ArrowLeft size={15} /> {stepIdx === 0 ? 'Cancel' : 'Back'}
        </button>
        {step === 'publish' ? (
          <button data-testid="btn-publish" onClick={publish}
            className="flex items-center gap-2 px-6 py-2.5 bg-success text-success-foreground rounded-lg text-sm font-semibold hover:bg-success/90 transition-all">
            <Check size={15} /> Publish Job
          </button>
        ) : (
          <button data-testid="btn-next" onClick={next}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all">
            Continue <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
