import React, { useState } from "react";
import { Link, useParams } from "wouter";
import { MOCK_JOBS } from "@/lib/mock-data";
import { Button } from "@workspace/design-system/button";
import { Badge } from "@workspace/design-system/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { Card, CardContent } from "@workspace/design-system/card";
import { toast } from "@workspace/design-system/hooks/use-toast";
import { cn } from "@workspace/design-system/utils";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";
import {
  MapPin,
  Clock,
  DollarSign,
  Bookmark,
  Share2,
  Building2,
  ArrowLeft,
  CheckCircle2,
  GraduationCap
} from "lucide-react";
import NotFound from "@/pages/not-found";

export default function JobDetail() {
  const { id } = useParams();
  const job = MOCK_JOBS.find(j => j.id === Number(id));
  const [saved, setSaved] = useState(false);

  if (!job) return <NotFound />;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied", description: "Job link copied to your clipboard." });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <Link href="/candidate/jobs">
        <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>
      </Link>

      {/* Header Card */}
      <Card className="overflow-hidden">
        <CardContent className="px-6 sm:px-10 py-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
            <div className="flex items-start gap-5 min-w-0">
              <Avatar className="w-16 h-16 rounded-[12px] border border-border/70 shrink-0">
                <AvatarImage src={job.companyLogoUrl || ""} alt={job.company} />
                <AvatarFallback className="rounded-[12px] bg-primary/[0.08] text-primary text-xl font-semibold">
                  {job.company.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-muted-foreground mb-1.5">
                  {job.department || "General"} · Posted {new Date(job.postedAt || job.createdAt).toLocaleDateString()}
                </p>
                <h1 className="text-[26px] font-semibold text-foreground tracking-[-0.02em] leading-[1.15] mb-2">
                  {job.title}
                </h1>
                <Link href={`/candidate/company/${job.company.toLowerCase().replace(/\s+/g, '-')}`} className="text-[15px] font-medium text-primary hover:underline">
                  {job.company}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Button
                variant="outline"
                size="icon"
                className={cn("h-10 w-10 shrink-0", saved && "text-primary")}
                onClick={() => setSaved((s) => !s)}
                aria-label={saved ? "Remove from saved jobs" : "Save job"}
              >
                <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={handleShare}
                aria-label="Copy job link"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Link href={`/candidate/apply/${job.id}/details`} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto px-8">
                  Apply Now
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-y-3 gap-x-8 text-[13.5px] font-medium text-muted-foreground border-t border-border/60 pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground">{job.location}</span>
              <Badge variant="subtle" className="capitalize ml-1">
                {job.locationType?.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground capitalize">{job.type.replace('_', ' ')}</span>
            </div>
            {job.salaryMin && job.salaryMax && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-foreground/60" />
                <span className="text-foreground">
                  ${(job.salaryMin / 1000)}k - ${(job.salaryMax / 1000)}k
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground">{job.department || "General"}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground">{job.experienceLevel || "Mid-Level"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">About the Role</h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed">{job.description}</p>
          </section>

          {job.responsibilities && (
            <section>
              <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">What You'll Do</h2>
              <ul className="space-y-3">
                {job.responsibilities.split('. ').filter(Boolean).map((resp, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>{resp}.</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.requirements && (
            <section>
              <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">What We're Looking For</h2>
              <p className="text-[14px] text-muted-foreground leading-relaxed">{job.requirements}</p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.skills?.map(skill => (
                  <Badge key={skill} variant="subtle" className="font-medium">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {job.benefits && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-4">Benefits & Perks</h3>
                <ul className="space-y-3">
                  {job.benefits.split(', ').filter(Boolean).map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13.5px] text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Link href={`/candidate/company/${job.company.toLowerCase().replace(/\s+/g, '-')}`}>
            <ViewfinderCard>
              <CardContent className="p-5 flex items-center gap-4">
                <Avatar className="w-11 h-11 rounded-[10px] border border-border/70 shrink-0">
                  <AvatarImage src={job.companyLogoUrl || ""} alt={job.company} />
                  <AvatarFallback className="rounded-[10px] bg-primary/[0.08] text-primary font-semibold">
                    {job.company.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-foreground">About {job.company}</div>
                  <div className="text-[12.5px] text-muted-foreground mt-0.5">View company profile & open roles</div>
                </div>
              </CardContent>
            </ViewfinderCard>
          </Link>

          <div className="text-[12px] text-center text-muted-foreground pt-4 border-t border-border/60">
            Job ID: EMP-{job.id} • Posted {new Date(job.postedAt || job.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
