import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, ApplicationStatus } from "@workspace/api-client-react";
import { Button } from "@workspace/design-system/button";
import { Card, CardContent } from "@workspace/design-system/card";
import { Input } from "@workspace/design-system/input";
import { Label } from "@workspace/design-system/label";
import { Textarea } from "@workspace/design-system/textarea";
import { RadioGroup, RadioGroupItem } from "@workspace/design-system/radio-group";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/lib/auth";
import { getCandidateProfile, getCandidateResumeHref } from "@/lib/candidate-profile-api";
import { submitJobApplicationAndNavigate } from "@/lib/candidate-application-flow";
import { SCREENING_QUESTIONS } from "@/lib/mock-data";
import {
  candidateJobQueryKey,
  getApplicationStatusLabel,
  getCandidateJobDetails,
} from "@/lib/candidate-jobs-api";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import NotFound from "@/pages/not-found";
import { cn } from "@workspace/design-system/utils";
import { motion } from "framer-motion";
import { StepTransition, useStepDirection } from "@/components/shared/step-transition";
import { Stepper } from "@/components/shared/stepper";
import { Confetti } from "@/components/shared/confetti";

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
const URL_PATTERN = /^https?:\/\/[^\s]+\.[^\s]+$/i;

interface ScreeningFormValues {
  answers: Record<string, string>;
  motivation: string;
}

function isLinkQuestion(question: string) {
  return /link|portfolio|website|url/i.test(question);
}

function isValidResumeUrl(value: string): boolean {
  if (/^\/api\/candidates\/profile\/resume\/[0-9a-f-]{36}\.(?:pdf|docx)$/i.test(value)) {
    return true;
  }

  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data;
    if (data && typeof data === "object") {
      const body = data as { error?: { message?: unknown }; message?: unknown };
      if (typeof body.error?.message === "string") return body.error.message;
      if (typeof body.message === "string") return body.message;
    }
  }

  return error instanceof Error ? error.message : "The request failed. Please try again.";
}

export default function ApplyFlow() {
  const { id, step } = useParams();
  const [, setLocation] = useLocation();
  const { user, role, signOut } = useAuth();
  const queryClient = useQueryClient();
  const parsedJobId = Number(id);
  const jobId = Number.isSafeInteger(parsedJobId) && parsedJobId > 0 ? parsedJobId : undefined;
  const jobQuery = useQuery({
    queryKey: candidateJobQueryKey(jobId ?? 0, user?.id ?? 0),
    queryFn: ({ signal }) =>
      jobId === undefined
        ? Promise.reject(new Error("A valid job ID is required."))
        : getCandidateJobDetails(jobId, signal),
    enabled: jobId !== undefined && Boolean(user && role === "candidate"),
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 1,
  });
  const candidateProfileQuery = useQuery({
    queryKey: ["candidate-profile", user?.id],
    queryFn: ({ signal }) => getCandidateProfile(signal),
    enabled: Boolean(user && role === "candidate" && jobId !== undefined),
    retry: false,
  });
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionPending = useRef(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [candidateDetails, setCandidateDetails] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    location: "",
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors: screeningErrors },
  } = useForm<ScreeningFormValues>({ defaultValues: { answers: {}, motivation: "" } });
  const screeningValues = watch();
  const candidateProfile = candidateProfileQuery.data;
  const savedResumeUrl = candidateProfile?.resumeUrl?.trim() ?? "";
  const hasValidResume = Boolean(savedResumeUrl && isValidResumeUrl(savedResumeUrl));

  // Hooks must run unconditionally above any early return, so the step index
  // (and the direction it implies) is computed before the not-found bail-outs.
  const currentStepIndex = steps.indexOf((step ?? "details") as StepId);
  const direction = useStepDirection(currentStepIndex);

  useEffect(() => {
    if (candidateProfile) {
      setCandidateDetails({
        name: candidateProfile.name,
        email: candidateProfile.email,
        location: candidateProfile.location ?? "",
      });
    }
  }, [candidateProfile]);

  useEffect(() => {
    const error = candidateProfileQuery.error;
    if (error instanceof ApiError && error.status === 401) {
      void signOut().then(() => setLocation("/"));
    }
  }, [candidateProfileQuery.error, setLocation, signOut]);

  if (jobId === undefined) return <NotFound />;
  if (currentStepIndex === -1) return <NotFound />;
  if (!user || role !== "candidate") return null;
  if (jobQuery.isPending || jobQuery.isFetching) {
    return (
      <main className="flex min-h-64 items-center justify-center text-sm text-muted-foreground" role="status">
        Loading job details…
      </main>
    );
  }
  if (jobQuery.error instanceof ApiError && jobQuery.error.status === 404) return <NotFound />;
  if (jobQuery.error) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-destructive" role="alert">
            {getApiErrorMessage(jobQuery.error)}
          </p>
          <Button variant="outline" onClick={() => void jobQuery.refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }
  const job = jobQuery.data;
  if (!job) return <NotFound />;
  const applicationStatusLabel = getApplicationStatusLabel(job.applicationStatus);
  if (applicationStatusLabel && !hasSubmitted) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-lg font-semibold">{applicationStatusLabel}</h1>
          <p className="text-sm text-muted-foreground">
            An application already exists for this job. You can’t submit another one.
          </p>
          <Link href={`/candidate/jobs/${job.id}`}>
            <Button variant="outline">Back to job details</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  if (candidateProfileQuery.isPending) {
    return (
      <main className="flex min-h-64 items-center justify-center text-sm text-muted-foreground" role="status">
        Loading your profile…
      </main>
    );
  }
  if (candidateProfileQuery.error instanceof ApiError && candidateProfileQuery.error.status === 404) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-lg font-semibold">Complete your candidate profile</h1>
          <p className="text-sm text-muted-foreground">
            Create your profile and add a resume before applying for this role.
          </p>
          <Link href="/candidate/profile">
            <Button>Go to your profile</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  if (candidateProfileQuery.error) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-destructive" role="alert">
            {getApiErrorMessage(candidateProfileQuery.error)}
          </p>
          <Button variant="outline" onClick={() => void candidateProfileQuery.refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const goToStep = (s: StepId) => setLocation(`/candidate/apply/${id}/${s}`);

  const handleBack = () => {
    if (currentStepIndex > 0) goToStep(steps[currentStepIndex - 1]);
    else setLocation(`/candidate/jobs/${id}`);
  };

  const handleResumeContinue = () => {
    if (!hasValidResume) {
      setResumeError(
        savedResumeUrl
          ? "Your saved resume link is invalid. Update your candidate profile before applying."
          : "Add a resume to your candidate profile before applying.",
      );
      return;
    }
    setResumeError(null);
    goToStep("screening");
  };

  const onScreeningValid = () => goToStep("review");

  const handleReviewSubmit = async () => {
    if (submissionPending.current) return;
    submissionPending.current = true;
    setApplicationError(null);
    setIsSubmitting(true);
    try {
      const coverLetter = screeningValues.motivation.trim();
      await submitJobApplicationAndNavigate(
        job.id,
        coverLetter || undefined,
        () => {
          queryClient.setQueryData(
            candidateJobQueryKey(job.id, user.id),
            (current: typeof job | undefined) =>
              current ? { ...current, applicationStatus: ApplicationStatus.applied } : current,
          );
          setHasSubmitted(true);
        },
        setLocation,
      );
    } catch (error) {
      setApplicationError(getApiErrorMessage(error));
    } finally {
      submissionPending.current = false;
      setIsSubmitting(false);
    }
  };

  const handlePrimaryAction = () => {
    if (step === "details") handleResumeContinue();
    else if (step === "screening") void handleSubmit(onScreeningValid)();
    else if (step === "review") void handleReviewSubmit();
  };

  const applicationIdParam = new URLSearchParams(window.location.search).get("applicationId");
  const successApplicationId = Number(applicationIdParam);
  const hasValidSuccessApplicationId =
    applicationIdParam !== null &&
    Number.isSafeInteger(successApplicationId) &&
    successApplicationId > 0;

  if (step === "success" && !hasValidSuccessApplicationId) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-destructive" role="alert">
            Application confirmation is unavailable. Please return to the application review and try again.
          </p>
          <Button variant="outline" onClick={() => setLocation(`/candidate/apply/${job.id}/review`)}>
            Return to application review
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "success" && hasValidSuccessApplicationId) {
    return (
      <div className="relative max-w-2xl mx-auto py-12 text-center animate-in zoom-in-95 duration-700">
        <Confetti />
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

        <h1 className="text-[26px] font-semibold text-foreground tracking-[-0.02em] mb-4">Application Submitted!</h1>
        <p className="text-muted-foreground text-[15px] mb-8 max-w-md mx-auto">
          Your application for <span className="font-semibold text-foreground">{job.title}</span> at <span className="font-semibold text-foreground">{job.company}</span> has been sent.
        </p>

        <Card className="bg-surface-subtle mb-8 text-left">
          <CardContent className="p-6">
            <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> What happens next?
            </h3>
            <ul className="space-y-3 text-[13.5px] text-muted-foreground">
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                The recruitment team will review your application.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                If there's a match, you'll receive an invitation for a video interview via email and in your Maqbool dashboard.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                You can track your application status in "My Applications".
              </li>
            </ul>
          </CardContent>
        </Card>

        <Link href="/candidate/dashboard">
          <Button size="lg" className="w-full sm:w-auto px-8">
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
        <Button variant="ghost" size="sm" className="mb-4 -ml-3 text-muted-foreground hover:text-foreground" onClick={handleBack} disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStepIndex === 0 ? "Back to Job" : "Back"}
        </Button>

        <PageHeader
          title={job.title}
          eyebrow={`Step ${currentStepIndex + 1} of ${FORM_STEP_COUNT}`}
          description={`Applying at ${job.company} · ${job.location}`}
          className="mb-6"
        />

        <Stepper
          steps={[{ label: "Details" }, { label: "Questions" }, { label: "Review" }]}
          current={Math.min(currentStepIndex, FORM_STEP_COUNT - 1)}
        />
      </div>

      {/* Content */}
      <Card className="overflow-hidden">
        <CardContent className="p-6 sm:p-8">
        <StepTransition stepKey={step ?? "details"} direction={direction}>
          {step === "details" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">Personal Information</h2>
                <p className="text-[13.5px] text-muted-foreground mt-1">
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

              <div className="border-t border-border/60 pt-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground">Resume</h3>
                    <p className="text-[13.5px] text-muted-foreground mt-1">
                      Your current profile resume will be included with this application.
                    </p>
                  </div>
                </div>

                {hasValidResume ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface-subtle p-4">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <a
                        href={getCandidateResumeHref(savedResumeUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary underline underline-offset-4"
                      >
                        View your saved resume
                      </a>
                      <p className="text-xs text-muted-foreground">This is the resume the application will use.</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    <p>
                      {savedResumeUrl
                        ? "Your profile resume link is invalid."
                        : "No resume is saved in your candidate profile."}
                    </p>
                    <Link href="/candidate/profile" className="mt-2 inline-block text-primary underline underline-offset-4">
                      Update your candidate profile
                    </Link>
                  </div>
                )}

              {resumeError && <p className="text-sm text-destructive" role="alert">{resumeError}</p>}

              </div>
            </div>
          )}

          {step === "screening" && (
            <form className="space-y-8" onSubmit={handleSubmit(onScreeningValid)}>
              <div>
                <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">Screening Questions</h2>
                <p className="text-[13.5px] text-muted-foreground mt-1">
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
                  <div className="flex items-start justify-between gap-4">
                    {screeningErrors.motivation ? (
                      <p className="text-sm text-destructive">{screeningErrors.motivation.message}</p>
                    ) : <span />}
                    <span className={cn("text-[12px] tabular-nums shrink-0", (screeningValues.motivation?.length ?? 0) >= 20 ? "text-success" : "text-muted-foreground")}>
                      {screeningValues.motivation?.length ?? 0} / 20 min
                    </span>
                  </div>
                </div>
              </div>
            </form>
          )}

          {step === "review" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">Review Application</h2>
                <p className="text-[13.5px] text-muted-foreground mt-1">
                  Please review your details before submitting.
                </p>
              </div>

              <div className="space-y-6 divide-y divide-border/60">
                <div className="pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[14px] font-semibold text-foreground">Personal Information</h3>
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
                    <h3 className="text-[14px] font-semibold text-foreground">Resume</h3>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-primary" onClick={() => goToStep("details")}>Edit</Button>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-md border border-border/60 bg-surface-subtle">
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {hasValidResume ? "Saved profile resume" : "No valid resume saved"}
                    </span>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[14px] font-semibold text-foreground">Screening Answers</h3>
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
        </StepTransition>

          {/* Footer Actions */}
          {applicationError && (
            <p className="mt-6 text-sm text-destructive" role="alert">
              {applicationError}
            </p>
          )}
          <div className="mt-8 pt-6 border-t border-border/60 flex justify-end gap-3">
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handlePrimaryAction} disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? "Submitting..." : step === "review" ? "Submit Application" : "Continue"}
              {!isSubmitting && step !== "review" && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
