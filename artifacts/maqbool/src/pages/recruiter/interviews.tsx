import React from "react";
import { Link } from "wouter";
import { MOCK_INTERVIEWS, MOCK_APPLICATIONS, MOCK_CANDIDATES } from "@/lib/mock-data";
import { CardContent } from "@workspace/design-system/card";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { DateTile, relativeDay } from "@/components/shared/date-tile";
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
        eyebrow={`${interviews.length} interview${interviews.length === 1 ? "" : "s"} · ${pendingCount} awaiting response`}
        description="Review upcoming and completed candidate interviews."
        actions={
          <div className="flex gap-2">
            <Link href="/recruiter/completion-monitoring">
              <Button variant="outline">
                <Gauge className="w-4 h-4 mr-2" /> Completion Monitor
              </Button>
            </Link>
            <Link href="/recruiter/interviews/1/questions">
              <Button variant="outline">
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
        <div className="grid gap-3">
          {interviews.map(({ interview, application, candidate }) => {
            const when = relativeDay(interview.scheduledAt);
            return (
              <ViewfinderCard key={interview.id}>
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-5">
                  <DateTile iso={interview.scheduledAt} />

                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <Avatar className="w-11 h-11 ring-2 ring-white shadow-[0_0_0_1px_hsl(var(--border))]">
                      <AvatarImage src={candidate?.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                        {(candidate?.name ?? "?").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold tracking-[-0.01em] truncate">
                        {candidate?.name ?? "Unknown candidate"}
                      </h3>
                      <p className="text-[13px] text-muted-foreground truncate">
                        {application?.job?.title ?? "Unknown role"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 capitalize">
                          {interview.type === "live_video" ? <Video className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {interview.type.replace(/_/g, " ")}
                        </span>
                        {interview.scheduledAt && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            {when && <span className="text-foreground/70">· {when}</span>}
                          </span>
                        )}
                        <Badge variant="outline" className="capitalize h-5 text-[11px]">{application?.stage ?? "n/a"}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <StatusBadge status={interview.status} />
                    {interview.status === "invited" ? (
                      <Link href={`/recruiter/interviews/${interview.id}/invite`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Send className="w-3.5 h-3.5" /> Invite
                        </Button>
                      </Link>
                    ) : interview.status === "completed" ? (
                      <Link href={`/recruiter/interviews/${interview.id}/feedback`}>
                        <Button size="sm" className="gap-1.5" data-testid={`btn-review-answers-${interview.id}`}>
                          <Play className="w-3.5 h-3.5" /> Review answers
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-[12.5px] text-muted-foreground">Awaiting completion</span>
                    )}
                  </div>
                </CardContent>
              </ViewfinderCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
