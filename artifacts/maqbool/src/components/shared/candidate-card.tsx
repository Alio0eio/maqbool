import React from "react";
import { Candidate, RankedApplication } from "@workspace/api-client-react";
import { CardContent } from "@workspace/design-system/card";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { Badge } from "@workspace/design-system/badge";
import { Button } from "@workspace/design-system/button";
import { MatchScoreBadge, StatusBadge, AITag } from "./badges";
import { ViewfinderCard } from "./viewfinder-card";
import { MapPin, Briefcase, ChevronRight, FileText, Star } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@workspace/design-system/utils";

interface CandidateCardProps {
  candidate: Candidate;
  application?: RankedApplication | any;
  className?: string;
  saved?: boolean;
  onToggleSave?: () => void;
}

export function CandidateCard({ candidate, application, className, saved, onToggleSave }: CandidateCardProps) {
  const currentExp = candidate.experience?.find(e => e.current) || candidate.experience?.[0];
  const expTitle = currentExp ? `${currentExp.title} at ${currentExp.company}` : candidate.headline;

  return (
    <ViewfinderCard className={cn("overflow-hidden group", className)}>
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-11 h-11 border border-border/70">
                <AvatarImage src={candidate.avatarUrl || ""} alt={candidate.name} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {candidate.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/recruiter/candidates/${candidate.id}`}>
                  <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] hover:text-primary transition-colors line-clamp-1 outline-none">
                    {candidate.name}
                  </h3>
                </Link>
                <div className="text-[13px] text-muted-foreground mt-0.5 line-clamp-1">
                  {expTitle}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {application?.aiScore !== undefined && (
                <MatchScoreBadge score={application.aiScore} />
              )}
              {onToggleSave && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 -mr-1"
                  onClick={(e) => { e.preventDefault(); onToggleSave(); }}
                  aria-label={saved ? "Remove from saved" : "Save candidate"}
                >
                  <Star className={cn("w-4 h-4", saved ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
            {candidate.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {candidate.location}
              </div>
            )}
            {candidate.yearsOfExp && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                {candidate.yearsOfExp} YOE
              </div>
            )}
            {application?.status && (
              <StatusBadge status={application.status} className="h-5 text-[10px]" />
            )}
          </div>

          {application?.aiSummary && (
            <div className="bg-info/[0.05] rounded-[10px] p-3 mb-4 text-[13.5px] text-foreground/90 leading-relaxed">
              <div className="mb-1.5"><AITag /></div>
              <p className="line-clamp-2">{application.aiSummary}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-5">
            {candidate.skills?.slice(0, 5).map(skill => (
              <Badge key={skill} variant="subtle" className="text-[10.5px] h-5 py-0 px-2 font-medium">
                {skill}
              </Badge>
            ))}
            {candidate.skills && candidate.skills.length > 5 && (
              <span className="text-[10.5px] text-muted-foreground font-medium self-center ml-1">
                +{candidate.skills.length - 5}
              </span>
            )}
          </div>
        </div>

        <div className="bg-surface-subtle/60 px-5 py-3 border-t border-border/60 flex items-center justify-between group-hover:bg-primary/[0.05] transition-colors">
          <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            Applied {new Date(application?.createdAt || candidate.createdAt || Date.now()).toLocaleDateString()}
          </div>
          <Link href={`/recruiter/candidates/${candidate.id}`}>
            <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold gap-1 text-primary hover:bg-primary/10 -mr-2">
              View Profile
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </ViewfinderCard>
  );
}
