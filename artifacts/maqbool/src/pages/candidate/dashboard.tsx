import React from "react";
import { Link } from "wouter";
import { MOCK_APPLICATIONS, MOCK_INTERVIEWS, MOCK_CANDIDATES } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { CardContent } from "@workspace/design-system/card";
import { Button } from "@workspace/design-system/button";
import { Badge } from "@workspace/design-system/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { StatusBadge } from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";
import {
  MapPin,
  Calendar,
  ChevronRight,
  Clock,
  Video,
  CheckCircle2,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import { cn } from "@workspace/design-system/utils";

export default function CandidateDashboard() {
  const { user } = useAuth();
  const myCandidateId = MOCK_CANDIDATES.find(c => c.email === user?.email)?.id;

  // My Applications
  const myApplications = MOCK_APPLICATIONS.filter(a => a.candidateId === myCandidateId);
  
  // Pending Interviews
  const pendingInterviews = MOCK_INTERVIEWS.filter(
    i => myApplications.some(a => a.id === i.applicationId) && i.status === "invited"
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Dashboard"
        eyebrow={`${myApplications.length} application${myApplications.length === 1 ? "" : "s"} · ${pendingInterviews.length} pending interview${pendingInterviews.length === 1 ? "" : "s"}`}
        description="Track your applications and upcoming interviews."
      />

      {pendingInterviews.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-4 flex items-center gap-2">
            Action required
            <Badge variant="destructive" className="h-5 px-1.5 rounded-full">{pendingInterviews.length}</Badge>
          </h2>
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingInterviews.map(interview => {
              const app = myApplications.find(a => a.id === interview.applicationId);
              if (!app || !app.job) return null;

              return (
                <StaggerItem key={interview.id}>
                <ViewfinderCard className="relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-[3px] bg-destructive" />
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                          {interview.type.includes("video") ? <Video className="w-[18px] h-[18px]" /> : <Calendar className="w-[18px] h-[18px]" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-[13.5px]">Interview Invitation</h3>
                          <p className="text-[12.5px] text-muted-foreground">{app.job.title} at {app.job.company}</p>
                        </div>
                      </div>
                      <Badge variant="destructive">Pending</Badge>
                    </div>

                    <div className="bg-surface-subtle rounded-[10px] p-3 mb-4 text-[12.5px]">
                      <div className="flex items-center gap-2 text-foreground font-medium mb-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        Complete by: {new Date(interview.deadline!).toLocaleDateString()}
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{interview.invitationNote}</p>
                    </div>

                    <Link href={`/candidate/interviews/${interview.id}`}>
                      <Button className="w-full">
                        Start Video Interview
                      </Button>
                    </Link>
                  </CardContent>
                </ViewfinderCard>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </section>
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

        {myApplications.length === 0 ? (
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
          {myApplications.map((app) => {
            if (!app.job) return null;

            // Progress calculation
            const stages = ["applied", "screening", "interview", "offer"];
            const currentStageIndex = stages.indexOf(app.stage);
            const isRejected = app.status === "rejected";

            return (
              <StaggerItem key={app.id}>
              <ViewfinderCard className={cn("overflow-hidden", isRejected && "opacity-70")}>
                <CardContent className="p-0">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-11 h-11 rounded-[10px] border border-border/70">
                        <AvatarImage src={app.job.companyLogoUrl || ""} />
                        <AvatarFallback className="rounded-[10px] bg-primary/[0.08] text-primary font-semibold">
                          {app.job.company.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/candidate/jobs/${app.job.id}`}>
                          <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] hover:text-primary transition-colors line-clamp-1 outline-none">
                            {app.job.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-0.5">
                          <span className="font-medium text-foreground">{app.job.company}</span>
                          <span className="text-border">•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {app.job.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:min-w-[200px] justify-between sm:justify-end">
                      <div className="text-right">
                        <StatusBadge status={app.status} />
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/candidate/jobs/${app.jobId}`}>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-surface-subtle/60 px-5 py-4 border-t border-border/60">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        {stages.map((stage, idx) => {
                          const isActive = idx === currentStageIndex && !isRejected;
                          const isPast = idx < currentStageIndex && !isRejected;
                          const isCurrentRejected = idx === currentStageIndex && isRejected;

                          return (
                            <div key={stage} className="flex flex-col items-center relative z-10 w-1/4">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors",
                                isPast ? "bg-success border-success text-white" :
                                isActive ? "bg-white border-primary text-primary" :
                                isCurrentRejected ? "bg-destructive border-destructive text-white" :
                                "bg-white border-border text-muted-foreground"
                              )}>
                                {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                              </div>
                              <span className={cn(
                                "text-[10.5px] font-medium mt-1.5 capitalize",
                                isActive ? "text-primary" : isCurrentRejected ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {stage}
                              </span>
                            </div>
                          );
                        })}
                        {/* Connecting Lines */}
                        <div className="absolute top-4 left-0 w-full h-0.5 bg-border/70 -z-10 px-8">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              isRejected ? "bg-destructive" : "bg-success"
                            )}
                            style={{ width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%` }}
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
