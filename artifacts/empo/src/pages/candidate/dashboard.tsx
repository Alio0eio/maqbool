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
        eyebrow={`${myApplications.length} APPLICATION${myApplications.length === 1 ? "" : "S"} · ${pendingInterviews.length} PENDING INTERVIEW${pendingInterviews.length === 1 ? "" : "S"}`}
        description="Track your applications and upcoming interviews."
      />

      {pendingInterviews.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            Action Required
            <Badge variant="destructive" className="h-5 px-1.5 rounded-full">{pendingInterviews.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingInterviews.map(interview => {
              const app = myApplications.find(a => a.id === interview.applicationId);
              if (!app || !app.job) return null;

              return (
                <ViewfinderCard key={interview.id} className="border-l-4 border-l-destructive shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-red-50 text-destructive flex items-center justify-center">
                          {interview.type.includes("video") ? <Video className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">Interview Invitation</h3>
                          <p className="text-xs text-muted-foreground">{app.job.title} at {app.job.company}</p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="uppercase text-[10px] tracking-wide font-bold">
                        Pending
                      </Badge>
                    </div>
                    
                    <div className="bg-surface-subtle rounded-md p-3 mb-4 text-xs">
                      <div className="flex items-center gap-2 text-foreground font-medium mb-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        Complete by: {new Date(interview.deadline!).toLocaleDateString()}
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{interview.invitationNote}</p>
                    </div>
                    
                    <Link href={`/candidate/interviews/${interview.id}`}>
                      <Button className="w-full text-sm font-medium h-9">
                        Start Video Interview
                      </Button>
                    </Link>
                  </CardContent>
                </ViewfinderCard>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-foreground">My Applications</h2>
          <Link href="/candidate/jobs">
            <Button variant="ghost" size="sm" className="text-sm text-primary hover:text-primary/80 gap-1">
              Find more jobs <ArrowRight className="w-4 h-4" />
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
        <div className="space-y-4">
          {myApplications.map((app) => {
            if (!app.job) return null;
            
            // Progress calculation
            const stages = ["applied", "screening", "interview", "offer"];
            const currentStageIndex = stages.indexOf(app.stage);
            const isRejected = app.status === "rejected";
            
            return (
              <ViewfinderCard key={app.id} className={cn("overflow-hidden border-border", isRejected && "opacity-75")}>
                <CardContent className="p-0">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-12 h-12 border border-border shadow-sm">
                        <AvatarImage src={app.job.companyLogoUrl || ""} />
                        <AvatarFallback className="bg-primary/5 text-primary font-bold">
                          {app.job.company.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link href={`/candidate/jobs/${app.job.id}`}>
                          <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 outline-none">
                            {app.job.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                          <span className="font-medium text-foreground">{app.job.company}</span>
                          <span>•</span>
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
                        <p className="text-[10px] text-muted-foreground mt-1">
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
                  <div className="bg-surface-subtle px-5 py-3 border-t border-border">
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
                                "text-[10px] uppercase tracking-wider font-semibold mt-1.5",
                                isActive ? "text-primary" : isCurrentRejected ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {stage}
                              </span>
                            </div>
                          );
                        })}
                        {/* Connecting Lines */}
                        <div className="absolute top-4 left-0 w-full h-0.5 bg-border -z-10 px-8">
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
            );
          })}
        </div>
        )}
      </section>
    </div>
  );
}
