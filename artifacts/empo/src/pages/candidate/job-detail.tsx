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
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/10 to-secondary/10 w-full" />
        <CardContent className="px-6 sm:px-10 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-10 mb-6">
            <div className="flex items-end gap-5">
              <Avatar className="w-20 h-20 border-4 border-white shadow-md bg-white">
                <AvatarImage src={job.companyLogoUrl || ""} alt={job.company} />
                <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                  {job.company.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="mb-1">
                <p className="font-mono text-[11px] uppercase tracking-wider text-accent-record-ink mb-1">
                  {job.department || "General"} · Posted {new Date(job.postedAt || job.createdAt).toLocaleDateString()}
                </p>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight leading-none mb-2">
                  {job.title}
                </h1>
                <Link href={`/candidate/company/${job.company.toLowerCase().replace(/\s+/g, '-')}`} className="text-lg font-medium text-primary hover:underline">
                  {job.company}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="icon"
                className={cn("h-11 w-11 shrink-0", saved && "text-primary border-primary")}
                onClick={() => setSaved((s) => !s)}
                aria-label={saved ? "Remove from saved jobs" : "Save job"}
              >
                <Bookmark className={cn("w-5 h-5", saved && "fill-current")} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={handleShare}
                aria-label="Copy job link"
              >
                <Share2 className="w-5 h-5" />
              </Button>
              <Link href={`/candidate/apply/${job.id}/details`} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-11 px-8 shadow-sm text-base font-semibold">
                  Apply Now
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-y-4 gap-x-8 text-sm font-medium text-muted-foreground border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-foreground/70" />
              <span className="text-foreground">{job.location}</span>
              <Badge variant="subtle" className="h-5 text-[10px] uppercase font-bold tracking-wider px-1.5 ml-1">
                {job.locationType?.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-foreground/70" />
              <span className="text-foreground capitalize">{job.type.replace('_', ' ')}</span>
            </div>
            {job.salaryMin && job.salaryMax && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-foreground/70" />
                <span className="text-foreground font-mono">
                  ${(job.salaryMin / 1000)}k - ${(job.salaryMax / 1000)}k
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-foreground/70" />
              <span className="text-foreground">{job.department || "General"}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-foreground/70" />
              <span className="text-foreground">{job.experienceLevel || "Mid-Level"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-display font-bold text-foreground mb-4">About the Role</h2>
            <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground prose-headings:text-foreground prose-a:text-primary">
              <p>{job.description}</p>
            </div>
          </section>

          {job.responsibilities && (
            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-4">What You'll Do</h2>
              <ul className="space-y-3">
                {job.responsibilities.split('. ').filter(Boolean).map((resp, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <span>{resp}.</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.requirements && (
            <section>
              <h2 className="text-xl font-display font-bold text-foreground mb-4">What We're Looking For</h2>
              <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground">
                <p>{job.requirements}</p>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills?.map(skill => (
                  <Badge key={skill} variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-surface-bg">
            <CardContent className="p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-4">Benefits & Perks</h3>
              <ul className="space-y-3">
                {job.benefits?.split(', ').filter(Boolean).map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Link href={`/candidate/company/${job.company.toLowerCase().replace(/\s+/g, '-')}`}>
            <ViewfinderCard className="border-border shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <Avatar className="w-11 h-11 border border-border">
                  <AvatarImage src={job.companyLogoUrl || ""} alt={job.company} />
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {job.company.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold text-foreground">About {job.company}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">View company profile & open roles</div>
                </div>
              </CardContent>
            </ViewfinderCard>
          </Link>

          <div className="text-xs text-center text-muted-foreground pt-4 border-t border-border font-mono">
            Job ID: EMP-{job.id} • Posted {new Date(job.postedAt || job.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
