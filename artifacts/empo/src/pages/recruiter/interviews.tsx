import React from "react";
import { Link } from "wouter";
import { MOCK_INTERVIEWS, MOCK_APPLICATIONS, MOCK_CANDIDATES } from "@/lib/mock-data";
import { CardContent, CardHeader, CardTitle } from "@workspace/design-system/card";
import { Button } from "@workspace/design-system/button";
import { Badge } from "@workspace/design-system/badge";
import { StatusBadge } from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Calendar, Clock, Video, ListChecks, Gauge, Send, Play } from "lucide-react";

export default function RecruiterInterviews() {
  const interviews = MOCK_INTERVIEWS.map((interview) => {
    const application = MOCK_APPLICATIONS.find((app) => app.id === interview.applicationId);
    const candidate = application ? MOCK_CANDIDATES.find((c) => c.id === application.candidateId) : undefined;
    return { interview, application, candidate };
  });

  const pendingCount = interviews.filter(({ interview }) => interview.status === "invited" || interview.status === "pending").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Interviews"
        eyebrow={`${interviews.length} INTERVIEW${interviews.length === 1 ? "" : "S"} · ${pendingCount} AWAITING RESPONSE`}
        description="Review upcoming and completed candidate interviews."
        actions={
          <div className="flex gap-2">
            <Link href="/recruiter/completion-monitoring">
              <Button variant="outline" className="shadow-sm">
                <Gauge className="w-4 h-4 mr-2" /> Completion Monitor
              </Button>
            </Link>
            <Link href="/recruiter/interviews/1/questions">
              <Button variant="outline" className="shadow-sm">
                <ListChecks className="w-4 h-4 mr-2" /> Question Set
              </Button>
            </Link>
          </div>
        }
      />

      {interviews.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No interviews yet"
          description="Send an interview invite from a job's applicant list to get started."
          action={
            <Link href="/recruiter/jobs">
              <Button>View jobs</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {interviews.map(({ interview, application, candidate }) => (
            <ViewfinderCard key={interview.id} className="border-border shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
                <div>
                  <CardTitle className="text-lg font-display">Interview #{interview.id}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {application?.job?.title ?? "Unknown role"} · {candidate?.name ?? "Unknown candidate"}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <StatusBadge status={interview.status} />
                  <span className="text-sm text-muted-foreground flex items-center gap-2 font-mono">
                    <Calendar className="w-4 h-4" />
                    {interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString() : "TBD"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0">
                <div className="bg-surface-subtle rounded-xl p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Interview Type</div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
                    {interview.type === "live_video" ? <Video className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {interview.type.replace(/_/g, " ")}
                  </div>
                </div>

                <div className="bg-surface-subtle rounded-xl p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Candidate</div>
                  <div className="mt-3 space-y-1 text-sm text-foreground">
                    <div>{candidate?.name ?? "No candidate assigned"}</div>
                    <div className="text-muted-foreground">{candidate?.headline ?? "Profile incomplete"}</div>
                  </div>
                </div>

                <div className="bg-surface-subtle rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                    <div className="mt-3 text-sm text-foreground">{interview.status.replace(/_/g, " ")}</div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <Badge variant="outline" className="px-2 py-1">{application?.stage ?? "n/a"}</Badge>
                    {interview.status === "invited" ? (
                      <Link href={`/recruiter/interviews/${interview.id}/invite`}>
                        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-primary">
                          <Send className="w-3.5 h-3.5" /> Invite
                        </Button>
                      </Link>
                    ) : interview.status === "completed" ? (
                      <Link href={`/recruiter/interviews/${interview.id}/feedback`}>
                        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-primary" data-testid={`btn-review-answers-${interview.id}`}>
                          <Play className="w-3.5 h-3.5" /> Review Answers
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">Awaiting completion</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </ViewfinderCard>
          ))}
        </div>
      )}
    </div>
  );
}
