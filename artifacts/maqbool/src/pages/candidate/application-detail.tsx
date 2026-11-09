import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@workspace/api-client-react";
import { Button } from "@workspace/design-system/button";
import { Card, CardContent } from "@workspace/design-system/card";
import { StatusBadge } from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/lib/auth";
import {
  candidateApplicationDetailsQueryKey,
  getCandidateApplicationDetails,
} from "@/lib/candidate-applications-api";
import { ArrowLeft, Briefcase, LoaderCircle, MapPin } from "lucide-react";
import NotFound from "@/pages/not-found";

export default function CandidateApplicationDetail() {
  const { id } = useParams();
  const { user, role } = useAuth();
  const parsedId = Number(id);
  const applicationId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
  const applicationQuery = useQuery({
    queryKey: candidateApplicationDetailsQueryKey(user?.id ?? 0, applicationId ?? 0),
    queryFn: ({ signal }) =>
      applicationId === undefined
        ? Promise.reject(new Error("A valid application ID is required."))
        : getCandidateApplicationDetails(applicationId, signal),
    enabled: applicationId !== undefined && Boolean(user?.id) && role === "candidate",
    retry: 1,
  });

  if (applicationId === undefined) return <NotFound />;

  const application = applicationQuery.data;
  const appliedAt = application?.appliedAt ?? application?.createdAt;
  const isMissing = applicationQuery.error instanceof ApiError && applicationQuery.error.status === 404;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <PageHeader
        title={application?.job.title ?? "Application details"}
        eyebrow={application ? `Application #${application.id}` : "Application"}
        description={application ? `${application.job.company.name} · ${application.job.location}` : undefined}
        actions={
          <Link href="/candidate/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
          </Link>
        }
      />

      {applicationQuery.isPending ? (
        <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading application…
        </div>
      ) : applicationQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6 text-center">
          <p className="text-sm text-destructive" role="alert">
            {isMissing
              ? "We couldn’t find that application."
              : "We couldn’t load this application. Please try again."}
          </p>
          {!isMissing && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void applicationQuery.refetch()}
              disabled={applicationQuery.isFetching}
            >
              {applicationQuery.isFetching && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {applicationQuery.isFetching ? "Retrying…" : "Try again"}
            </Button>
          )}
        </div>
      ) : application ? (
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{application.job.company.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {application.job.location}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Applied {appliedAt ? new Date(appliedAt).toLocaleDateString() : "date unavailable"}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-border/60 pt-5">
              <Link href={`/candidate/jobs/${application.job.id}`}>
                <Button variant="outline" className="gap-2">
                  <Briefcase className="h-4 w-4" /> View job
                </Button>
              </Link>
              <Link href="/candidate/dashboard">
                <Button variant="ghost">Back to applications</Button>
              </Link>
            </div>

            {application.interview && (
              <section className="space-y-2 border-t border-border/60 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">Interview</h2>
                  <StatusBadge status={application.interview.status} />
                </div>
                {application.interview.scheduledAt && (
                  <p className="text-sm text-muted-foreground">
                    Scheduled {new Date(application.interview.scheduledAt).toLocaleString()}
                  </p>
                )}
                {application.interview.deadline && (
                  <p className="text-sm text-muted-foreground">
                    Deadline {new Date(application.interview.deadline).toLocaleString()}
                  </p>
                )}
                {application.interview.invitationNote && (
                  <p className="text-sm text-muted-foreground">{application.interview.invitationNote}</p>
                )}
              </section>
            )}

            {application.status === "rejected" && application.feedback && (
              <section className="space-y-2 border-t border-border/60 pt-5">
                <h2 className="text-sm font-semibold">Feedback</h2>
                <p className="text-sm text-muted-foreground">{application.feedback}</p>
              </section>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
