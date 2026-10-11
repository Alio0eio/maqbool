import React, { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { MOCK_INTERVIEWS } from "@/lib/mock-data";
import { Button } from "@workspace/design-system/button";
import { Card, CardContent } from "@workspace/design-system/card";
import { Progress } from "@workspace/design-system/progress";
import { PageHeader } from "@/components/shared/page-header";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";
import { Waveform } from "@/components/shared/waveform";
import { VideoScrubber } from "@/components/shared/video-scrubber";
import {
  ArrowLeft,
  Video,
  Mic,
  StopCircle,
  CheckCircle2,
  AlertCircle,
  Camera,
  PartyPopper
} from "lucide-react";
import NotFound from "@/pages/not-found";
import { Badge } from "@workspace/design-system/badge";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@workspace/design-system/utils";
import { Spinner } from "@/components/shared/spinner";
import { Confetti } from "@/components/shared/confetti";

type CheckState = "idle" | "testing" | "ok";

/** Device check row: click runs a short simulated test, then settles on a green check. */
function DeviceCheck({
  icon: Icon,
  label,
  state,
  onTest,
  testId,
  children,
}: {
  icon: React.ElementType;
  label: string;
  state: CheckState;
  onTest: () => void;
  testId: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onTest}
      disabled={state === "testing"}
      className={cn(
        "w-full flex items-center justify-between gap-4 p-4 rounded-xl border text-left transition-all duration-200",
        state === "ok" ? "border-success/40 bg-success/[0.05]" : "border-border/70 bg-white hover:border-secondary/40 hover:shadow-md",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", state === "ok" ? "bg-success/10 text-success" : "bg-primary/[0.07] text-primary")}>
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-foreground">{label}</p>
          <p className="text-[12.5px] text-muted-foreground" aria-live="polite">
            {state === "idle" ? "Click to test" : state === "testing" ? "Testing…" : "Working"}
          </p>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        {state === "ok" && children}
        {state === "testing" && <Spinner className="w-5 h-5 text-secondary" />}
        {state === "ok" && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, duration: 0.45 }}>
            <CheckCircle2 className="w-5 h-5 text-success" />
          </motion.span>
        )}
      </div>
    </button>
  );
}

const QUESTIONS = [
  { id: 1, text: "Tell us about a complex B2B enterprise platform you designed. What were the main challenges?", timeLimit: 120, retakeLimit: 1 },
  { id: 2, text: "How do you balance user needs with technical constraints and business goals?", timeLimit: 120, retakeLimit: 1 },
  { id: 3, text: "Describe your experience working with and establishing design systems.", timeLimit: 180, retakeLimit: 2 }
];

const PRACTICE_QUESTION = { id: 0, text: "What's your name and what role are you interviewing for today?", timeLimit: 30, retakeLimit: 1 };

type Phase = "techcheck" | "practice" | "interview" | "submitting" | "complete";

export default function CandidateInterview() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const interview = MOCK_INTERVIEWS.find(i => i.id === Number(id));

  const [phase, setPhase] = useState<Phase>("techcheck");
  const [cameraState, setCameraState] = useState<CheckState>("idle");
  const [micState, setMicState] = useState<CheckState>("idle");
  const cameraChecked = cameraState === "ok";
  const micChecked = micState === "ok";
  const runCheck = (set: (s: CheckState) => void) => {
    set("testing");
    window.setTimeout(() => set("ok"), 900);
  };
  const [submitProgress, setSubmitProgress] = useState(0);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTIONS[0].timeLimit);
  const [hasRecordedCurrent, setHasRecordedCurrent] = useState(false);
  const [retakesUsed, setRetakesUsed] = useState(0);

  useEffect(() => {
    let timer: number;
    if (isRecording && timeLeft > 0 && (phase === "interview" || phase === "practice")) {
      timer = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRecording) {
      handleStopRecording();
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, timeLeft, phase]);

  // Hooks must run unconditionally above this line — the not-found bail-out
  // comes after, so navigating between /candidate/interviews/:id routes
  // never changes the number of hooks called on a re-render.
  if (!interview) return <NotFound />;

  const handleStartRecording = () => {
    setIsRecording(true);
    setHasRecordedCurrent(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasRecordedCurrent(true);
  };

  const handleRetake = () => {
    if (retakesUsed >= currentQuestion.retakeLimit) return;
    setRetakesUsed(prev => prev + 1);
    setHasRecordedCurrent(false);
    setTimeLeft(currentQuestion.timeLimit);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(QUESTIONS[currentQuestionIndex + 1].timeLimit);
      setHasRecordedCurrent(false);
      setRetakesUsed(0);
    } else {
      setPhase("submitting");
      setSubmitProgress(8);
      window.setTimeout(() => setSubmitProgress(100), 60);
      window.setTimeout(() => setPhase("complete"), 2200);
    }
  };

  const handleContinueToInterview = () => {
    setPhase("interview");
    setHasRecordedCurrent(false);
    setRetakesUsed(0);
    setTimeLeft(QUESTIONS[0].timeLimit);
  };

  const formatTime = (seconds: number) => {
    const safe = Math.max(0, seconds);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Tech check ---
  if (phase === "techcheck") {
    return (
      <div className="max-w-2xl mx-auto py-16 animate-in fade-in duration-500">
        <Link href="/candidate/dashboard">
          <Button variant="ghost" size="sm" className="-ml-3 text-muted-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit
          </Button>
        </Link>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8" />
          </div>
          <h1 className="text-[26px] font-semibold text-foreground tracking-[-0.02em] mb-2">Let's check your setup</h1>
          <p className="text-muted-foreground">Before you begin, make sure your camera and microphone are working. You'll have {QUESTIONS.length} questions, with time to review each one before recording.</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-5 space-y-3">
            <DeviceCheck icon={Camera} label="Camera" state={cameraState} testId="btn-check-camera" onTest={() => runCheck(setCameraState)}>
              <span className="hidden sm:inline text-[12px] font-medium text-success">HD · 30fps</span>
            </DeviceCheck>
            <DeviceCheck icon={Mic} label="Microphone" state={micState} testId="btn-check-mic" onTest={() => runCheck(setMicState)}>
              <div className="flex items-end gap-[3px] h-5" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="wave-bar w-[3px] h-full rounded-full bg-success" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            </DeviceCheck>
          </CardContent>
        </Card>

        <div className="bg-surface-subtle rounded-lg p-4 text-sm text-muted-foreground mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="font-medium text-foreground mb-1">Before you start</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Find a quiet, well-lit space.</li>
                <li>You'll do one practice question first that isn't scored.</li>
                <li>Each question has a time limit and a limited number of retakes.</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full h-14 text-base font-semibold"
          disabled={!cameraChecked || !micChecked}
          onClick={() => {
            setTimeLeft(PRACTICE_QUESTION.timeLimit);
            setPhase("practice");
          }}
        >
          Continue to Practice Question
        </Button>
      </div>
    );
  }

  // --- Submitting ---
  if (phase === "submitting") {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-[26px] font-semibold text-foreground tracking-[-0.02em] mb-4">Submitting Interview</h1>
        <p className="text-muted-foreground">Please wait while we upload your responses securely...</p>
        <Progress value={submitProgress} className="h-2 max-w-sm mx-auto mt-8 bg-surface-subtle [&>div]:duration-[2000ms]" />
      </div>
    );
  }

  // --- Complete ---
  if (phase === "complete") {
    return (
      <div className="relative max-w-2xl mx-auto py-20 text-center animate-in zoom-in duration-500">
        <Confetti />
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.55, duration: 0.7 }}
          className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_0_10px_hsl(var(--success)/0.06)]"
        >
          <PartyPopper className="w-10 h-10" />
        </motion.div>
        <h1 className="text-[26px] font-semibold text-foreground tracking-[-0.02em] mb-3">Interview Complete!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thanks for taking the time to complete your async interview. The hiring team will review your responses and follow up soon — you can track the status from your dashboard.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/candidate/interviews">
            <Button variant="outline" size="lg">View All Interviews</Button>
          </Link>
          <Link href="/candidate/dashboard">
            <Button size="lg">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // --- Practice / Interview ---
  const isPractice = phase === "practice";
  const currentQuestion = isPractice ? PRACTICE_QUESTION : QUESTIONS[currentQuestionIndex];
  const progress = isPractice ? 0 : ((currentQuestionIndex + (hasRecordedCurrent ? 1 : 0)) / QUESTIONS.length) * 100;
  const elapsed = currentQuestion.timeLimit - timeLeft;
  const retakesLeft = currentQuestion.retakeLimit - retakesUsed;

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      <PageHeader
        sticky
        className="mb-6 shrink-0"
        eyebrow={`${interview.application?.job?.title ?? "Async interview"} · ${isPractice ? "Practice round" : `${Math.round(progress)}% complete`}`}
        title={isPractice ? "Practice Question" : `Question ${currentQuestionIndex + 1} of ${QUESTIONS.length}`}
        actions={
          <div className="flex items-center gap-4">
            {!isPractice && (
              <div className="w-32">
                <Progress value={progress} className="h-2 bg-surface-subtle" />
              </div>
            )}
            <Link href="/candidate/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground" disabled={isRecording}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Exit
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col min-h-0 relative rounded-xl overflow-hidden bg-black shadow-lg">
          {/* Recording surface */}
          <div className="flex-1 relative flex items-center justify-center">
            {isRecording ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-white font-mono text-sm z-10 border border-white/10">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-record animate-pulse" />
                  {formatTime(elapsed)}
                </div>
                <div className="relative w-28 h-28 flex items-center justify-center mb-8" role="timer" aria-label={`${formatTime(timeLeft)} remaining`}>
                  <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="4" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="hsl(var(--accent-record))"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 45}
                      strokeDashoffset={2 * Math.PI * 45 * (elapsed / currentQuestion.timeLimit)}
                      className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="absolute inset-3 rounded-full bg-accent-record/10 animate-ping" aria-hidden />
                  <span className="relative font-mono text-[22px] font-medium text-white tabular-nums">{formatTime(timeLeft)}</span>
                </div>
                <div className="w-full max-w-md h-14 px-8">
                  <Waveform variant="loading" bars={40} barClassName="!bg-accent-record/70" />
                </div>
                <p className="text-white/50 text-xs mt-6 tracking-wide">Recording · speak naturally</p>
              </div>
            ) : hasRecordedCurrent ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white z-10 gap-5 p-6">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-success" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg">Response recorded</p>
                  <p className="text-white/60 text-sm mt-1">Review your answer below, or retake if you'd like another take.</p>
                </div>
                <div className="w-full max-w-sm bg-white rounded-lg p-4 text-foreground shadow-lg">
                  <VideoScrubber durationSeconds={Math.max(1, elapsed)} />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white z-10">
                <Video className="w-16 h-16 text-white/20 mb-4" />
                <p className="font-medium text-lg">Camera is ready</p>
                <p className="text-white/60 text-sm mt-2">Read the question and click Start Recording when ready.</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="h-20 bg-zinc-950 flex items-center justify-center gap-6 px-6 border-t border-white/10 shrink-0">
            {!isRecording && !hasRecordedCurrent && (
              <Button onClick={handleStartRecording} size="lg" className="bg-accent-record hover:bg-accent-record/90 text-zinc-900 rounded-full px-8 h-12 shadow-[0_0_20px_rgba(242,169,59,0.4)]">
                <div className="w-3 h-3 rounded-full bg-zinc-900 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button onClick={handleStopRecording} size="lg" className="bg-white hover:bg-white/90 text-black rounded-full px-8 h-12">
                <StopCircle className="w-5 h-5 mr-2 text-accent-record-ink" />
                Stop Recording
              </Button>
            )}

            {!isRecording && hasRecordedCurrent && (
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 h-11"
                onClick={handleRetake}
                disabled={retakesLeft <= 0}
              >
                {retakesLeft > 0 ? `Retake (${retakesLeft} left)` : "No retakes left"}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <ViewfinderCard viewfinder className="flex-1">
            <CardContent className="p-6 h-full flex flex-col">
              {!isPractice && (
                <ol className="flex items-center gap-1.5 mb-5" aria-label="Question progress">
                  {QUESTIONS.map((q, i) => {
                    const done = i < currentQuestionIndex || (i === currentQuestionIndex && hasRecordedCurrent);
                    const current = i === currentQuestionIndex;
                    return (
                      <li key={q.id} className="flex-1" aria-current={current ? "step" : undefined}>
                        <span
                          className={cn(
                            "block h-1.5 rounded-full transition-colors duration-500",
                            done ? "bg-success" : current ? "bg-accent-record" : "bg-muted",
                          )}
                        />
                        <span className="sr-only">{`Question ${i + 1}${done ? " done" : ""}`}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
              <div className="mb-4">
                <Badge variant="outline" className="bg-accent-record-tint text-accent-record-ink border-accent-record/30 mb-3">
                  {isPractice ? "Practice Question" : `Question ${currentQuestionIndex + 1}`}
                </Badge>
                <h3 className="text-lg font-semibold text-foreground leading-snug">
                  {currentQuestion.text}
                </h3>
              </div>

              <div className="mt-auto bg-surface-subtle rounded-lg p-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Tips for a great answer</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Use the STAR method (Situation, Task, Action, Result).</li>
                      <li>Be concise and specific.</li>
                      <li>Make eye contact with the camera.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </ViewfinderCard>

          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold"
            disabled={!hasRecordedCurrent || isRecording}
            onClick={isPractice ? handleContinueToInterview : handleNextQuestion}
          >
            {isPractice
              ? "Continue to Interview"
              : currentQuestionIndex === QUESTIONS.length - 1 ? "Submit Interview" : "Next Question"}
          </Button>
        </div>
      </div>
    </div>
  );
}
