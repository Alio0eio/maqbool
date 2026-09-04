import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
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
import type { Application, Candidate } from "@workspace/api-client-react";

const STAGES = ["applied", "screening", "interview", "decision", "offer", "hired", "rejected"];

// A card starts tracking the pointer immediately on press, but only commits
// to a drag (spawning the portal ghost) past a small movement threshold —
// this is what keeps a plain tap on the name link or the kebab menu working.
const DRAG_THRESHOLD_PX = 8;

interface DragState {
  app: Application;
  candidate: Candidate;
  originStage: string;
  pointerId: number;
  /** Where inside the card the pointer grabbed it, so the ghost keeps that
   *  exact point under the cursor instead of snapping to its center. */
  grabDx: number;
  grabDy: number;
  width: number;
  startX: number;
  startY: number;
  active: boolean; // past the movement threshold
}

export default function PipelineKanban() {
  const [selectedJobId, setSelectedJobId] = useState<number | "all">("all");
  const [searchParams] = useSearchParams();
  const columnRefs = useRef<Partial<Record<string, HTMLDivElement>>>({});

  // Stage moves are local-only (this is a mock/demo dataset with no write
  // API) — dropping a card into a new column records an override here rather
  // than mutating the shared MOCK_APPLICATIONS array.
  const [stageOverrides, setStageOverrides] = useState<Record<number, string>>({});
  const drag = useRef<DragState | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [hoverStage, setHoverStage] = useState<string | null>(null);

  function effectiveStage(a: Application) {
    return stageOverrides[a.id] ?? (a.status === "rejected" ? "rejected" : a.stage);
  }

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

  function stageAtPoint(x: number, y: number): string | null {
    for (const stage of STAGES) {
      const el = columnRefs.current[stage];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return stage;
    }
    return null;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>, app: Application, candidate: Candidate) {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Some input sequences (e.g. a stale/synthetic pointer id) can't be
      // captured — dragging still works via the regular bubbling handlers.
    }
    drag.current = {
      app,
      candidate,
      originStage: effectiveStage(app),
      pointerId: e.pointerId,
      grabDx: e.clientX - rect.left,
      grabDy: e.clientY - rect.top,
      width: rect.width,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;

    if (!d.active) {
      const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      if (dist < DRAG_THRESHOLD_PX) return;
      d.active = true;
      setDragState({ ...d });
    }

    setGhostPos({ x: e.clientX - d.grabDx, y: e.clientY - d.grabDy });
    setHoverStage(stageAtPoint(e.clientX, e.clientY));
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (d.active) {
      const dropStage = stageAtPoint(e.clientX, e.clientY);
      if (dropStage && dropStage !== d.originStage) {
        setStageOverrides((prev) => ({ ...prev, [d.app.id]: dropStage }));
      }
    }
    drag.current = null;
    setDragState(null);
    setHoverStage(null);
  }

  const isDragging = dragState !== null;

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Interview Pipeline"
        eyebrow={`${applications.length} candidates · ${STAGES.length} stages`}
        description="Track candidates across all stages — drag a card to move it."
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

      <div className="relative flex-1 min-h-0">
        <ScrollArea className="flex-1 w-full h-full whitespace-nowrap pb-4">
          <ScrollBar orientation="horizontal" />
          <div className="flex gap-4 h-full min-h-[500px] items-start pb-4">
            {STAGES.map(stage => {
              const stageApps = applications.filter(a => effectiveStage(a) === stage);
              const isHighlighted = stage === highlightedStage;
              const isDropTarget = isDragging && hoverStage === stage;

              return (
                <div
                  key={stage}
                  ref={(el) => { columnRefs.current[stage] = el ?? undefined; }}
                  className={cn(
                    "w-[320px] flex-shrink-0 flex flex-col h-full bg-surface-subtle rounded-xl border transition-colors duration-150",
                    isDropTarget
                      ? "border-primary ring-2 ring-primary/40 bg-primary/[0.04]"
                      : isHighlighted
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border/60"
                  )}
                >
                  <div className="p-4 border-b border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="uppercase tracking-wider text-[11px] font-semibold text-muted-foreground">{stage}</span>
                      <span className="bg-background text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-semibold">
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
                          const isBeingDragged = dragState?.app.id === app.id;

                          return (
                            <ViewfinderCard
                              key={app.id}
                              initial={{ opacity: 0, scale: 0.94 }}
                              animate={{ opacity: isBeingDragged ? 0 : 1, scale: 1 }}
                              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                              className="cursor-grab active:cursor-grabbing group touch-none"
                              onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => handlePointerDown(e, app, candidate)}
                              onPointerMove={handlePointerMove}
                              onPointerUp={endDrag}
                              onPointerCancel={endDrag}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start gap-2 mb-3">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Avatar className="w-8 h-8 border border-border/70 shrink-0">
                                      <AvatarImage src={candidate.avatarUrl!} />
                                      <AvatarFallback>{candidate.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <Link href={`/recruiter/candidates/${candidate.id}`}>
                                        <h4 className="font-semibold text-[13.5px] text-foreground hover:text-primary transition-colors line-clamp-1">{candidate.name}</h4>
                                      </Link>
                                      <div className="text-[12px] text-muted-foreground line-clamp-1">
                                        {app.job?.title || "Role"}
                                      </div>
                                    </div>
                                  </div>
                                  <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </div>

                                {app.aiScore && (
                                  <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-3">
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

        {/* Scroll-edge hint: fades the right edge when the board has more
           columns than fit on screen, instead of a hard clip. */}
        <div className="pointer-events-none absolute top-0 right-0 bottom-4 w-16 bg-gradient-to-l from-surface-bg to-transparent" />
      </div>

      {dragState && createPortal(
        <motion.div
          className="fixed z-50 pointer-events-none"
          style={{ left: ghostPos.x, top: ghostPos.y, width: dragState.width }}
          initial={{ scale: 1, rotate: 0 }}
          animate={{ scale: 1.04, rotate: -1.5 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.25 }}
        >
          <ViewfinderCard className="shadow-2xl ring-1 ring-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="w-8 h-8 border border-border/70 shrink-0">
                  <AvatarImage src={dragState.candidate.avatarUrl!} />
                  <AvatarFallback>{dragState.candidate.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h4 className="font-semibold text-[13.5px] text-foreground line-clamp-1">{dragState.candidate.name}</h4>
                  <div className="text-[12px] text-muted-foreground line-clamp-1">
                    {dragState.app.job?.title || "Role"}
                  </div>
                </div>
              </div>
              {dragState.app.aiScore && (
                <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-3">
                  <MatchScoreBadge score={dragState.app.aiScore} size="sm" />
                </div>
              )}
            </CardContent>
          </ViewfinderCard>
        </motion.div>,
        document.body
      )}
    </div>
  );
}
