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
  const [cameraChecked, setCameraChecked] = useState(false);
  const [micChecked, setMicChecked] = useState(false);

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
      setTimeout(() => setPhase("complete"), 2000);
    }
  };

  const handleContinueToInterview = () => {
    setPhase("interview");
    setHasRecordedCurrent(false);
    setRetakesUsed(0);
    setTimeLeft(QUESTIONS[0].timeLimit);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
          <CardContent className="p-6 space-y-4">
            <button
              data-testid="btn-check-camera"
              onClick={() => setCameraChecked(true)}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${cameraChecked ? 'border-success bg-success/5' : 'border-border/60 hover:border-primary/40'}`}
            >
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Test Camera</span>
              </div>
              {cameraChecked ? <CheckCircle2 className="w-5 h-5 text-success" /> : <span className="text-xs text-muted-foreground">Click to test</span>}
            </button>
            <button
              data-testid="btn-check-mic"
              onClick={() => setMicChecked(true)}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${micChecked ? 'border-success bg-success/5' : 'border-border/60 hover:border-primary/40'}`}
            >
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Test Microphone</span>
              </div>
              {micChecked ? <CheckCircle2 className="w-5 h-5 text-success" /> : <span className="text-xs text-muted-foreground">Click to test</span>}
            </button>
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
          onClick={() => setPhase("practice")}
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
        <Progress value={90} className="h-2 max-w-sm mx-auto mt-8 bg-surface-subtle" />
      </div>
    );
  }

  // --- Complete ---
  if (phase === "complete") {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
          <PartyPopper className="w-10 h-10" />
        </div>
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
                <div className="relative w-20 h-20 rounded-full bg-accent-record/10 flex items-center justify-center mb-8">
                  <span className="absolute inset-0 rounded-full bg-accent-record/20 animate-ping" />
                  <div className="w-3.5 h-3.5 rounded-full bg-accent-record relative z-10" />
                </div>
                <div className="w-full max-w-md h-14 px-8">
                  <Waveform variant="loading" bars={40} barClassName="!bg-accent-record/70" />
                </div>
                <p className="text-white/50 text-xs font-mono mt-6 tracking-wide">{formatTime(timeLeft)} remaining</p>
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
