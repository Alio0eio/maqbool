import React, { useEffect, useMemo, useRef, useState } from "react";
import { MOCK_APPLICATIONS, MOCK_CANDIDATES, MOCK_JOBS } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { CardContent } from "@workspace/design-system/card";
import { MatchScoreBadge } from "@/components/shared/badges";
import { PageHeader } from "@/components/shared/page-header";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/design-system/select";
import { ScrollArea, ScrollBar } from "@workspace/design-system/scroll-area";
import { cn } from "@workspace/design-system/utils";
import { Inbox, MoreHorizontal } from "lucide-react";
import { Link, useSearchParams } from "wouter";

const STAGES = ["applied", "screening", "interview", "decision", "offer", "hired", "rejected"];

export default function PipelineKanban() {
  const [selectedJobId, setSelectedJobId] = useState<number | "all">("all");
  const [searchParams] = useSearchParams();
  const columnRefs = useRef<Partial<Record<string, HTMLDivElement>>>({});

  // Jobs that actually have applications in the pipeline — derived from real
  // mock data instead of a hardcoded list that can drift out of sync.
  const jobOptions = useMemo(() => {
    const ids = Array.from(new Set(MOCK_APPLICATIONS.map((a) => a.jobId)));
    return ids
      .map((id) => MOCK_JOBS.find((j) => j.id === id))
      .filter((j): j is NonNullable<typeof j> => Boolean(j));
  }, []);

  const applications = selectedJobId === "all"
    ? MOCK_APPLICATIONS
    : MOCK_APPLICATIONS.filter(a => a.jobId === selectedJobId);

  // `/recruiter/pipeline?stage=Applied` (linked from the dashboard's Pipeline
  // Health tiles) should land on and highlight that column, not just navigate here.
  const rawStageParam = searchParams.get("stage");
  const highlightedStage = rawStageParam
    ? STAGES.find((s) => s === rawStageParam.toLowerCase()) ?? null
    : null;

  useEffect(() => {
    if (highlightedStage) {
      columnRefs.current[highlightedStage]?.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    }
  }, [highlightedStage]);

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Interview Pipeline"
        eyebrow={`${applications.length} CANDIDATES · ${STAGES.length} STAGES`}
        description="Track candidates across all stages."
        className="mb-6"
        actions={
          <Select value={selectedJobId.toString()} onValueChange={(val) => setSelectedJobId(val === "all" ? "all" : Number(val))}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobOptions.map((job) => (
                <SelectItem key={job.id} value={job.id.toString()}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <ScrollArea className="flex-1 w-full whitespace-nowrap pb-4">
        <div className="flex gap-4 h-full min-h-[500px] items-start pb-4">
          {STAGES.map(stage => {
            const stageApps = applications.filter(a => a.stage === stage || (stage === "rejected" && a.status === "rejected"));
            const isHighlighted = stage === highlightedStage;

            return (
              <div
                key={stage}
                ref={(el) => { columnRefs.current[stage] = el ?? undefined; }}
                className={cn(
                  "w-[320px] flex-shrink-0 flex flex-col h-full bg-surface-subtle rounded-xl border transition-colors",
                  isHighlighted ? "border-accent-record ring-2 ring-accent-record" : "border-border"
                )}
              >
                <div className="p-4 border-b border-border flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="font-display uppercase tracking-wider text-xs">{stage}</span>
                    <span className="bg-background text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-mono">
                      {stageApps.length}
                    </span>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-3">
                  {stageApps.length === 0 ? (
                    <EmptyState
                      icon={Inbox}
                      title="No candidates"
                      description={`Nobody is in ${stage} right now.`}
                    />
                  ) : (
                    <div className="space-y-3">
                      {stageApps.map(app => {
                        const candidate = MOCK_CANDIDATES.find(c => c.id === app.candidateId);
                        if (!candidate) return null;

                        return (
                          <ViewfinderCard key={app.id} className="cursor-grab active:cursor-grabbing border-border shadow-sm group">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-8 h-8 border border-border">
                                    <AvatarImage src={candidate.avatarUrl!} />
                                    <AvatarFallback>{candidate.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <Link href={`/recruiter/candidates/${candidate.id}`}>
                                      <h4 className="font-display font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1">{candidate.name}</h4>
                                    </Link>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {app.job?.title || "Role"}
                                    </div>
                                  </div>
                                </div>
                                <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>

                              {app.aiScore && (
                                <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
                                  <MatchScoreBadge score={app.aiScore} size="sm" />
                                </div>
                              )}
                            </CardContent>
                          </ViewfinderCard>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
