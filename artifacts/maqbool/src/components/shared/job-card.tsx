import React from "react";
import { Job } from "@workspace/api-client-react";
import { CardContent } from "@workspace/design-system/card";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { Badge } from "@workspace/design-system/badge";
import { Button } from "@workspace/design-system/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/design-system/dropdown-menu";
import { StatusBadge } from "./badges";
import { ViewfinderCard } from "./viewfinder-card";
import { MapPin, Clock, DollarSign, Bookmark, MoreHorizontal, Share2, Flag, Pencil, Users, LoaderCircle } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@workspace/design-system/utils";

interface JobCardProps {
  job: Omit<Job, "status"> & { status?: Job["status"] };
  variant?: "recruiter" | "candidate";
  className?: string;
  saved?: boolean;
  onToggleSave?: () => void;
  saving?: boolean;
  savePending?: boolean;
}

export function JobCard({
  job,
  variant = "candidate",
  className,
  saved,
  onToggleSave,
  saving = false,
  savePending = false,
}: JobCardProps) {
  const isRecruiter = variant === "recruiter";
  const postedMs = new Date(job.postedAt || job.createdAt).getTime();
  const isNew = !isRecruiter && Date.now() - postedMs < 7 * 86_400_000 && Date.now() >= postedMs;
  const primaryHref = isRecruiter ? `/recruiter/jobs/${job.id}/applicants` : `/candidate/jobs/${job.id}`;

  return (
    <ViewfinderCard className={cn("group/job overflow-hidden h-full flex flex-col", className)}>
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-3 mb-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <Avatar className="w-12 h-12 rounded-xl ring-2 ring-white shadow-[0_0_0_1px_hsl(var(--border)),0_6px_14px_-6px_hsl(var(--primary)/0.35)] shrink-0 transition-transform duration-300 group-hover/job:scale-105">
              <AvatarImage src={job.companyLogoUrl || ""} alt={job.company} />
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                {job.company.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link href={primaryHref}>
                <h3 className="text-[16px] font-semibold text-foreground tracking-[-0.01em] hover:text-primary transition-colors line-clamp-1 outline-none">
                  {job.title}
                  {isNew && (
                    <span className="ml-2 align-middle inline-flex items-center rounded-full bg-success/10 text-success px-2 py-0.5 text-[11px] font-semibold">
                      New
                    </span>
                  )}
                </h3>
              </Link>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground mt-1">
                <span className="font-medium text-foreground shrink-0">{job.company}</span>
                <span className="text-border shrink-0">•</span>
                <span className="flex items-center gap-1 shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location}
                </span>
                <Badge variant="subtle" className="h-5 text-[11px] font-semibold px-1.5 capitalize shrink-0">
                  {job.locationType?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isRecruiter ? (
              job.status && <StatusBadge status={job.status} />
            ) : (
              onToggleSave && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8", saved ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                  onClick={onToggleSave}
                  disabled={saving}
                  aria-busy={savePending}
                  aria-label={saved ? "Remove from saved" : "Save job"}
                >
                  {savePending
                    ? <LoaderCircle className="w-4 h-4 animate-spin" aria-hidden="true" />
                    : <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />}
                </Button>
              )
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={`More actions for ${job.title}`}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isRecruiter ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={`/recruiter/jobs/${job.id}/applicants`} className="flex items-center gap-2 cursor-pointer">
                        <Users className="w-4 h-4" /> View applicants
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/recruiter/jobs/new/basic" className="flex items-center gap-2 cursor-pointer">
                        <Pencil className="w-4 h-4" /> Edit job
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/candidate/jobs/${job.id}`)}
                    >
                      <Share2 className="w-4 h-4" /> Copy link
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                      <Flag className="w-4 h-4" /> Report job
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span className="capitalize">{job.type.replace('_', ' ')}</span>
          </div>
          {job.salaryMin && job.salaryMax && (
            <div className="flex items-center gap-1.5 rounded-full bg-success/[0.08] text-success px-2.5 py-1 font-semibold">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="tabular-nums">
                {(job.salaryMin / 1000)}k – {(job.salaryMax / 1000)}k
              </span>
            </div>
          )}
          {isRecruiter && (
            <div className="flex items-center gap-1.5 font-medium text-primary bg-primary/[0.08] px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {job.applicantCount} applicants
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {job.skills?.slice(0, 4).map(skill => (
            <Badge key={skill} variant="subtle" className="font-medium">
              {skill}
            </Badge>
          ))}
          {job.skills && job.skills.length > 4 && (
            <Badge variant="subtle" className="font-medium">
              +{job.skills.length - 4} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/70">
          <span className="text-[12.5px] text-muted-foreground">
            Posted {new Date(job.postedAt || job.createdAt).toLocaleDateString()}
          </span>
          <Link href={primaryHref}>
            <Button variant={isRecruiter ? "outline" : "default"} size="sm" className="h-8 text-xs font-medium">
              {isRecruiter ? "Manage Job" : "View Details"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </ViewfinderCard>
  );
}
