import React, { useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { MOCK_CANDIDATES, MOCK_JOBS, MOCK_USERS, SCREENING_QUESTIONS } from "@/lib/mock-data";
import { Button } from "@workspace/design-system/button";
import { CardContent } from "@workspace/design-system/card";
import { Input } from "@workspace/design-system/input";
import { Label } from "@workspace/design-system/label";
import { Textarea } from "@workspace/design-system/textarea";
import { RadioGroup, RadioGroupItem } from "@workspace/design-system/radio-group";
import { Progress } from "@workspace/design-system/progress";
import { PageHeader } from "@/components/shared/page-header";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Pencil,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import NotFound from "@/pages/not-found";
import { cn } from "@workspace/design-system/utils";
import { motion } from "framer-motion";

// The application steps a candidate walks through. "success" is a terminal
// screen, not a form step, so it's excluded from the step-progress affordance.
const steps = ["details", "screening", "review", "success"] as const;
type StepId = (typeof steps)[number];
const FORM_STEP_COUNT = steps.length - 1; // details, screening, review

// The pool of possible screening questions lives in mock-data (also used by
// recruiter/create-job.tsx to compose a job's question set). We take the same
// default slice a newly-created job would get, so the questions shown here
// are real shared data rather than copy hardcoded to one specific job/company.
const screeningSet = SCREENING_QUESTIONS.slice(0, 3);

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ACCEPTED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];
const URL_PATTERN = /^https?:\/\/[^\s]+\.[^\s]+$/i;

interface ScreeningFormValues {
  answers: Record<string, string>;
  motivation: string;
}

function isLinkQuestion(question: string) {
  return /link|portfolio|website|url/i.test(question);
}

export default function ApplyFlow() {
  const { id, step } = useParams();
  const [, setLocation] = useLocation();
  const job = MOCK_JOBS.find(j => j.id === Number(id));
  const user = MOCK_USERS.candidate;
  const candidate = MOCK_CANDIDATES.find(c => c.email === user.email);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidateDetails, setCandidateDetails] = useState({
    name: candidate?.name ?? user.name,
    email: candidate?.email ?? user.email,
    location: candidate?.location ?? "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors: screeningErrors },
  } = useForm<ScreeningFormValues>({ defaultValues: { answers: {}, motivation: "" } });
  const screeningValues = watch();

  if (!job) return <NotFound />;

  const currentStepIndex = steps.indexOf((step ?? "details") as StepId);
  if (currentStepIndex === -1) return <NotFound />;

  const goToStep = (s: StepId) => setLocation(`/candidate/apply/${id}/${s}`);

  const handleBack = () => {
    if (currentStepIndex > 0) goToStep(steps[currentStepIndex - 1]);
    else setLocation(`/candidate/jobs/${id}`);
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_RESUME_EXTENSIONS.includes(ext)) {
      setFileError("Please upload a PDF, DOC, or DOCX file.");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setFileError("That file is too large. Max size is 5MB.");
      return;
    }
    setFileError(null);
    setResumeFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ""; // allow re-selecting the same file after removing it
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleResumeContinue = () => {
    if (!resumeFile && !candidate?.resumeUrl) {
      setFileError("Please upload your resume to continue.");
      return;
    }
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
      goToStep("screening");
    }, 1500);
  };

  const onScreeningValid = () => goToStep("review");

  const handleReviewSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      goToStep("success");
    }, 2000);
  };

  const handlePrimaryAction = () => {
    if (step === "details") handleResumeContinue();
    else if (step === "screening") void handleSubmit(onScreeningValid)();
    else if (step === "review") handleReviewSubmit();
  };

  if (step === "success") {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-in zoom-in-95 duration-700">
        <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
          <div className="absolute inset-0 rounded-full border-4 border-success/20 animate-ping" />
        </div>

        <h1 className="text-3xl font-display font-bold text-foreground mb-4">Application Submitted!</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          Your application for <span className="font-semibold text-foreground">{job.title}</span> at <span className="font-semibold text-foreground">{job.company}</span> has been sent.
        </p>

        <ViewfinderCard className="bg-surface-subtle border-border shadow-sm mb-8 text-left">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> What happens next?
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                The recruitment team will review your application.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                If there's a match, you'll receive an invitation for a video interview via email and in your EMPO dashboard.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                You can track your application status in "My Applications".
              </li>
            </ul>
          </CardContent>
        </ViewfinderCard>

        <Link href="/candidate/dashboard">
          <Button size="lg" className="w-full sm:w-auto px-8 shadow-sm">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4 -ml-3 text-muted-foreground hover:text-foreground" onClick={handleBack} disabled={isParsing || isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStepIndex === 0 ? "Back to Job" : "Back"}
        </Button>

        <PageHeader
          title={job.title}
          eyebrow={`STEP ${currentStepIndex + 1} OF ${FORM_STEP_COUNT}`}
          description={`Applying at ${job.company} · ${job.location}`}
          className="mb-6"
        />

        {/* Step progress */}
        <div>
          <div className="flex gap-1.5 mb-2">
            {steps.slice(0, FORM_STEP_COUNT).map((s, idx) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  idx <= currentStepIndex ? "bg-primary" : "bg-surface-subtle"
                )}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            <span className={cn(step === "details" && "text-primary font-semibold")}>01 Details</span>
            <span className={cn(step === "screening" && "text-primary font-semibold")}>02 Questions</span>
            <span className={cn(step === "review" && "text-primary font-semibold")}>03 Review</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <ViewfinderCard className="border-border shadow-sm">
        <CardContent className="p-6 sm:p-8">
          {step === "details" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">Personal Information</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Review the information saved to your profile before applying.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="application-name">Full name</Label>
                  <Input id="application-name" value={candidateDetails.name} onChange={(e) => setCandidateDetails({ ...candidateDetails, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="application-email">Email address</Label>
                  <Input id="application-email" type="email" value={candidateDetails.email} onChange={(e) => setCandidateDetails({ ...candidateDetails, email: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="application-location">Address or location</Label>
                  <Input id="application-location" value={candidateDetails.location} onChange={(e) => setCandidateDetails({ ...candidateDetails, location: e.target.value })} placeholder="City, State" />
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Resume</h3>
                    <p className="text-sm text-muted-foreground mt-1">Use your saved resume or upload a newer version.</p>
                  </div>
                  <Pencil className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>

                {candidate?.resumeUrl && !resumeFile && (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-subtle p-4">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{candidate.resumeUrl}</p>
                      <p className="text-xs text-muted-foreground">Saved in your profile</p>
                    </div>
                  </div>
                )}

              <div
                role="button"
                tabIndex={0}
                aria-label="Upload resume"
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer hover:bg-surface-subtle outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  resumeFile ? "border-primary bg-primary/5" : fileError ? "border-destructive" : "border-border"
                )}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_RESUME_EXTENSIONS.join(",")}
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                {resumeFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="font-medium text-foreground">{resumeFile.name}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">{(resumeFile.size / 1024).toFixed(1)} KB · PDF</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResumeFile(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-surface-subtle flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="font-medium text-foreground mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs">Upload a replacement · PDF, DOC, DOCX up to 5MB</p>
                  </div>
                )}
              </div>

              {fileError && <p className="text-sm text-destructive">{fileError}</p>}

              {isParsing && (
                <div className="bg-accent-record-tint border border-accent-record/30 rounded-lg p-4 flex items-center gap-4 animate-in fade-in">
                  <Sparkles className="w-5 h-5 text-accent-record-ink animate-pulse shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-accent-record-ink">AI is extracting your profile details...</p>
                    <Progress value={65} className="h-1.5 mt-2 bg-accent-record-tint [&>div]:bg-accent-record" />
                  </div>
                  <span className="font-mono text-xs text-accent-record-ink tabular-nums shrink-0">65%</span>
                </div>
              )}
              </div>
            </div>
          )}

          {step === "screening" && (
            <form className="space-y-8" onSubmit={handleSubmit(onScreeningValid)}>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">Screening Questions</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Please answer these questions from {job.company}.
                </p>
              </div>

              <div className="space-y-6">
                {screeningSet.map((q) => {
                  const fieldName = `answers.${q.id}` as FieldPath<ScreeningFormValues>;
                  const fieldError = screeningErrors.answers?.[String(q.id)];
                  return (
                    <div className="space-y-3" key={q.id}>
                      <Label className="text-base font-medium">
                        {q.question} {q.required && "*"}
                      </Label>
                      {q.type === "yes_no" ? (
                        <Controller
                          control={control}
                          name={fieldName}
                          rules={{ required: q.required ? "Please select an answer." : false }}
                          render={({ field }) => (
                            <RadioGroup value={(field.value as string) ?? ""} onValueChange={field.onChange}>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id={`q${q.id}-yes`} />
                                <Label htmlFor={`q${q.id}-yes`} className="font-normal">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id={`q${q.id}-no`} />
                                <Label htmlFor={`q${q.id}-no`} className="font-normal">No</Label>
                              </div>
                            </RadioGroup>
                          )}
                        />
                      ) : (
                        <Input
                          {...register(fieldName, {
                            required: q.required ? "This field is required." : false,
                            pattern: isLinkQuestion(q.question)
                              ? { value: URL_PATTERN, message: "Enter a valid URL, starting with http:// or https://." }
                              : undefined,
                          })}
                          placeholder={isLinkQuestion(q.question) ? "https://" : "Your answer..."}
                        />
                      )}
                      {fieldError?.message && <p className="text-sm text-destructive">{String(fieldError.message)}</p>}
                    </div>
                  );
                })}

                <div className="space-y-3">
                  <Label className="text-base font-medium">Why are you interested in joining {job.company}? *</Label>
                  <Textarea
                    placeholder="Share your motivation..."
                    className="min-h-[100px]"
                    {...register("motivation", {
                      required: "Tell us why you're interested.",
                      minLength: { value: 20, message: "Please write at least 20 characters." },
                    })}
                  />
                  {screeningErrors.motivation && (
                    <p className="text-sm text-destructive">{screeningErrors.motivation.message}</p>
                  )}
                </div>
              </div>
            </form>
          )}

          {step === "review" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">Review Application</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Please review your details before submitting.
                </p>
              </div>

              <div className="space-y-6 divide-y divide-border">
                <div className="pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-foreground">Personal Information</h3>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-primary" onClick={() => goToStep("details")}>Edit</Button>
                  </div>
                  <div className="grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <span className="text-muted-foreground block mb-1">Full Name</span>
                      <span className="font-medium text-foreground">{candidateDetails.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Email</span>
                      <span className="font-medium text-foreground">{candidateDetails.email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Address or location</span>
                      <span className="font-medium text-foreground">{candidateDetails.location || "Not provided"}</span>
                    </div>
                  </div>
                </div>

                <div className="py-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-foreground">Resume</h3>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-primary" onClick={() => goToStep("details")}>Edit</Button>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-surface-subtle">
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{resumeFile?.name || candidate?.resumeUrl || "No resume uploaded"}</span>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-foreground">Screening Answers</h3>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-primary" onClick={() => goToStep("screening")}>Edit</Button>
                  </div>
                  <div className="space-y-4 text-sm">
                    {screeningSet.map((q) => (
                      <div key={q.id}>
                        <span className="text-muted-foreground block mb-1">{q.question}</span>
                        <span className="font-medium text-foreground">
                          {q.type === "yes_no"
                            ? screeningValues.answers?.[q.id] === "yes"
                              ? "Yes"
                              : screeningValues.answers?.[q.id] === "no"
                                ? "No"
                                : "—"
                            : screeningValues.answers?.[q.id] || "—"}
                        </span>
                      </div>
                    ))}
                    <div>
                      <span className="text-muted-foreground block mb-1">Why you're interested</span>
                      <span className="font-medium text-foreground">{screeningValues.motivation || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
            <Button variant="outline" onClick={handleBack} disabled={isParsing || isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handlePrimaryAction} disabled={isParsing || isSubmitting} className="min-w-[120px]">
              {isParsing ? "Processing..." : isSubmitting ? "Submitting..." : step === "review" ? "Submit Application" : "Continue"}
              {!isParsing && !isSubmitting && step !== "review" && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </ViewfinderCard>
    </div>
  );
}
