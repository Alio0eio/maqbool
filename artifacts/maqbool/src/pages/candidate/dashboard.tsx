import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { greeting } from "@/lib/greeting";
import { useCandidateApplications } from "@/lib/use-candidate-applications";
import { SummaryStrip } from "@/components/shared/summary-strip";
import { CardContent } from "@workspace/design-system/card";
import { Button } from "@workspace/design-system/button";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { StatusBadge } from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import { cn } from "@workspace/design-system/utils";

function ApplicationSkeletons() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading applications">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-36 rounded-2xl border border-border bg-white/70 p-5">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
          <div className="mt-4 h-4 w-2/5 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-3 w-1/4 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function CandidateDashboard() {
  const { user, role } = useAuth();
  const applicationsQuery = useCandidateApplications(
    user?.id ?? 0,
    Boolean(user?.id) && role === "candidate",
  );
  const myApplications = applicationsQuery.data ?? [];
  const isApplicationsLoaded = applicationsQuery.isSuccess;
  const stages = ["applied", "screening", "interview", "offer"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title={greeting(user?.name)}
        eyebrow={
          applicationsQuery.isPending
            ? "Loading applications"
            : applicationsQuery.isError
              ? "Applications unavailable"
              : `${myApplications.length} application${myApplications.length === 1 ? "" : "s"}`
        }
        description="Track your application progress and upcoming opportunities."
      />

      {isApplicationsLoaded && (
        <SummaryStrip
          items={[
            { label: "Applications", value: myApplications.length },
            {
              label: "Interviewing",
              value: myApplications.filter(
                (application) => application.status === "interviewing" || application.stage === "interview",
              ).length,
            },
            {
              label: "In review",
              value: myApplications.filter(
                (application) =>
                  application.status === "reviewing" ||
                  application.status === "shortlisted" ||
                  application.stage === "screening",
              ).length,
            },
            {
              label: "Offers",
              value: myApplications.filter(
                (application) =>
                  application.status === "offered" ||
                  application.stage === "offer" ||
                  application.stage === "hired",
              ).length,
            },
          ]}
        />
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">My Applications</h2>
          <Link href="/candidate/jobs">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary gap-1">
              Find more jobs <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {applicationsQuery.isPending ? (
          <ApplicationSkeletons />
        ) : applicationsQuery.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6 text-center">
            <p className="text-sm text-destructive" role="alert">
              We couldn’t load your applications. Please try again.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void applicationsQuery.refetch()}
              disabled={applicationsQuery.isFetching}
            >
              {applicationsQuery.isFetching && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {applicationsQuery.isFetching ? "Retrying…" : "Try again"}
            </Button>
          </div>
        ) : myApplications.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            description="Jobs you apply to will show up here so you can track their progress."
            action={
              <Link href="/candidate/jobs">
                <Button>Browse jobs</Button>
              </Link>
            }
          />
        ) : (
          <StaggerGroup className="space-y-4">
            {myApplications.map((application) => {
              const stageIndexByName: Record<string, number> = {
                applied: 0,
                screening: 1,
                interview: 2,
                decision: 3,
                offer: 3,
                hired: 3,
                rejected: 3,
              };
              const currentStageIndex = stageIndexByName[application.stage] ?? 0;
              const isRejected = application.status === "rejected" || application.stage === "rejected";
              const isWithdrawn = application.status === "withdrawn";
              const isTerminal = isRejected || isWithdrawn;

              return (
                <StaggerItem key={application.id}>
                  <ViewfinderCard className={cn("overflow-hidden", isTerminal && "opacity-70")}>
                    <CardContent className="p-0">
                      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="w-11 h-11 rounded-[10px] ring-2 ring-white shadow-[0_0_0_1px_hsl(var(--border))]">
                            <AvatarImage src={application.job.company.logoUrl ?? ""} />
                            <AvatarFallback className="rounded-[10px] bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                              {application.job.company.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link href={`/candidate/jobs/${application.job.id}`}>
                              <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] hover:text-primary transition-colors line-clamp-1 outline-none">
                                {application.job.title}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-0.5">
                              <span className="font-medium text-foreground">{application.job.company.name}</span>
                              <span className="text-border">•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {application.job.location}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 sm:min-w-[200px] justify-between sm:justify-end">
                          <div className="text-right">
                            <StatusBadge status={application.status} />
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Applied {new Date(application.appliedAt ?? application.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Link href={`/candidate/applications/${application.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-full"
                              aria-label={`View application for ${application.job.title}`}
                            >
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="bg-surface-subtle/60 px-5 py-4 border-t border-border/60" aria-label="Application progress">
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            {stages.map((stage, index) => {
                              const isActive = index === currentStageIndex && !isTerminal;
                              const isPast = index < currentStageIndex && !isTerminal;
                              const isCurrentRejected = index === currentStageIndex && isRejected;

                              return (
                                <div key={stage} className="flex flex-col items-center relative z-10 w-1/4">
                                  <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors",
                                    isPast ? "bg-success border-success text-white" :
                                    isActive ? "bg-white border-primary text-primary" :
                                    isCurrentRejected ? "bg-destructive border-destructive text-white" :
                                    "bg-white border-border text-muted-foreground"
                                  )}>
                                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
                                  </div>
                                  <span className={cn(
                                    "text-[11px] font-medium mt-1.5 capitalize",
                                    isActive ? "text-primary" : isCurrentRejected ? "text-destructive" : "text-muted-foreground"
                                  )}>
                                    {stage}
                                  </span>
                                </div>
                              );
                            })}
                            <div className="absolute top-4 left-0 w-full h-0.5 bg-border/70 -z-10 px-8">
                              <motion.div
                                className={cn(
                                  "h-full",
                                  isRejected ? "bg-destructive" : isWithdrawn ? "bg-muted-foreground" : "bg-success",
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%` }}
                                transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </ViewfinderCard>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        )}
      </section>
    </div>
  );
}
