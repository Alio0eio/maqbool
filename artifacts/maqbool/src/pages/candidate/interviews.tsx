import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { CardContent } from "@workspace/design-system/card";
import { DateTile, relativeDay } from "@/components/shared/date-tile";
import { Button } from "@workspace/design-system/button";
import { toast } from "@workspace/design-system/hooks/use-toast";
import { StatusBadge } from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";
import { EmptyState } from "@/components/shared/empty-state";
import { useCandidateInterviews } from "@/lib/use-candidate-interviews";
import { ArrowRight, Calendar, Clock, LoaderCircle, Video } from "lucide-react";

export default function CandidateInterviews() {
  const { user, role } = useAuth();
  const interviewsQuery = useCandidateInterviews(
    user?.id ?? 0,
    Boolean(user?.id) && role === "candidate",
  );
  const interviews = interviewsQuery.data ?? [];

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
        eyebrow={
          interviewsQuery.isPending
            ? "Loading interviews"
            : interviewsQuery.isError
              ? "Interviews unavailable"
              : `${interviews.length} interview${interviews.length === 1 ? "" : "s"} · ${upcomingCount} upcoming`
        }
        description="Track your scheduled interviews and next steps."
        actions={
          <Button onClick={requestAvailability}>Request availability</Button>
        }
      />

      <div className="grid gap-4">
        {interviewsQuery.isPending ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading interviews…
          </div>
        ) : interviewsQuery.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6 text-center">
            <p className="text-sm text-destructive" role="alert">
              We couldn’t load your interviews. Please try again.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void interviewsQuery.refetch()}
              disabled={interviewsQuery.isFetching}
            >
              {interviewsQuery.isFetching && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {interviewsQuery.isFetching ? "Retrying…" : "Try again"}
            </Button>
          </div>
        ) : interviews.length > 0 ? (
          interviews.map(({ interview, application }) => {
            const when = relativeDay(interview.scheduledAt);
            const actionable = interview.status === "invited" || interview.status === "pending";
            return (
              <ViewfinderCard key={interview.id} viewfinder={actionable}>
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-5">
                  <DateTile iso={interview.scheduledAt} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{application.job.title}</h3>
                      <StatusBadge status={interview.status} />
                    </div>
                    <p className="text-[13.5px] text-muted-foreground mt-0.5">{application.job.company.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 capitalize">
                        <Video className="w-3.5 h-3.5" /> {interview.type.replace(/_/g, " ")}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {interview.durationMinutes ?? 30} mins
                      </span>
                      {interview.scheduledAt && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(interview.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          {when && <span className="text-foreground/70">· {when}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/candidate/interviews/${interview.id}`} className="shrink-0">
                    <Button variant={actionable ? "default" : "outline"} className="w-full md:w-auto gap-1.5">
                      {actionable ? "Start interview" : "View details"} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </ViewfinderCard>
            );
          })
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
