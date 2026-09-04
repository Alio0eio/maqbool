import React from "react";
import { Link } from "wouter";
import { MOCK_INTERVIEWS, MOCK_APPLICATIONS, MOCK_JOBS, MOCK_CANDIDATES } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { CardContent, CardHeader, CardTitle } from "@workspace/design-system/card";
import { Button } from "@workspace/design-system/button";
import { Badge } from "@workspace/design-system/badge";
import { toast } from "@workspace/design-system/hooks/use-toast";
import { StatusBadge } from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Video, ArrowRight } from "lucide-react";

export default function CandidateInterviews() {
  const { user } = useAuth();
  const myCandidateId = MOCK_CANDIDATES.find(c => c.email === user?.email)?.id;

  const interviews = MOCK_INTERVIEWS
    .map((interview) => {
      const application = MOCK_APPLICATIONS.find((app) => app.id === interview.applicationId);
      const job = application ? MOCK_JOBS.find((job) => job.id === application.jobId) : undefined;
      return { interview, application, job };
    })
    .filter(({ application }) => application?.candidateId === myCandidateId);

  const upcomingCount = interviews.filter(({ interview }) => interview.status === "invited" || interview.status === "pending").length;

  const requestAvailability = () => {
    toast({
      title: "Availability request sent",
      description: "We've let your recruiter know you're ready to schedule more time.",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="My Interviews"
        eyebrow={`${interviews.length} interview${interviews.length === 1 ? "" : "s"} · ${upcomingCount} upcoming`}
        description="Track your scheduled interviews and next steps."
        actions={
          <Button onClick={requestAvailability}>Request availability</Button>
        }
      />

      <div className="grid gap-4">
        {interviews.length > 0 ? (
          interviews.map(({ interview, job }) => (
            <ViewfinderCard key={interview.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
                <div>
                  <CardTitle className="text-[16px]">{job?.title ?? "Upcoming interview"}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{job?.company ?? "Stratos Financial"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={interview.status} />
                  <Badge variant="subtle" className="capitalize">
                    {interview.type.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0">
                <div className="bg-surface-subtle rounded-xl p-4">
                  <div className="text-xs font-medium text-muted-foreground">When</div>
                  <div className="mt-3 text-sm text-foreground">
                    {interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString() : "TBD"}
                  </div>
                </div>
                <div className="bg-surface-subtle rounded-xl p-4">
                  <div className="text-xs font-medium text-muted-foreground">Duration</div>
                  <div className="mt-3 text-sm text-foreground">{interview.duration ?? 30} mins</div>
                </div>
                <div className="bg-surface-subtle rounded-xl p-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Prep notes</div>
                  <Link href={`/candidate/interviews/${interview.id}`}>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </ViewfinderCard>
          ))
        ) : (
          <EmptyState
            icon={Video}
            title="No interviews scheduled"
            description="Once a recruiter invites you, interviews will appear here."
          />
        )}
      </div>
    </div>
  );
}
