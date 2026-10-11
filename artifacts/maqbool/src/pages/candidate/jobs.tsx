import React, { useState } from "react";
import { MOCK_JOBS } from "@/lib/mock-data";
import { JobCard } from "@/components/shared/job-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Search, MapPin, Briefcase, Sparkles } from "lucide-react";
import { cn } from "@workspace/design-system/utils";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";

const SUGGESTED_SEARCHES = ["Product Design", "Frontend", "React", "Remote"];
const WORK_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on_site", label: "On-site" },
];

export default function CandidateJobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [workType, setWorkType] = useState<string | null>(null);

  // Exclude drafts/closed for candidates
  const publishedJobs = MOCK_JOBS.filter(job => job.status === "published");

  const filteredJobs = publishedJobs.filter(job => {
    const matchesQuery =
      searchTerm.trim() === "" ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation =
      locationTerm.trim() === "" ||
      job.location.toLowerCase().includes(locationTerm.toLowerCase()) ||
      (locationTerm.toLowerCase() === "remote" && job.locationType === "remote");
    const matchesWorkType = !workType || job.locationType === workType;
    return matchesQuery && matchesLocation && matchesWorkType;
  });

  const hasFilters = searchTerm.trim() !== "" || locationTerm.trim() !== "" || workType !== null;

  const clearFilters = () => {
    setSearchTerm("");
    setLocationTerm("");
    setWorkType(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <PageHeader
        title="Find Jobs"
        eyebrow={`${publishedJobs.length} open role${publishedJobs.length === 1 ? "" : "s"}`}
        description="Discover opportunities matched to your skills and experience."
      />

      {/* Hero search */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[hsl(222_90%_26%)] to-[hsl(215_95%_32%)] text-white p-8 md:p-12 shadow-[0_24px_60px_-24px_hsl(var(--primary)/0.6)]">
        <div aria-hidden className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-secondary/40 blur-[90px] float-slower" />
        <div aria-hidden className="absolute -bottom-28 -left-10 w-72 h-72 rounded-full bg-brand-steel-reversed/20 blur-[90px] float-slow" />
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="text-[28px] md:text-[36px] font-semibold mb-3 tracking-[-0.03em] leading-[1.1]">
            Find your next defining role.
          </p>
          <p className="text-white/70 mb-8 text-[15px]">Discover opportunities matched to your unique skills and potential.</p>

          <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl sm:rounded-full p-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                aria-label="Job title, skills, or company"
                placeholder="Job title, skills, or company"
                className="w-full h-11 pl-11 border-transparent shadow-none rounded-full text-[14px] text-foreground focus-visible:ring-0 focus-visible:bg-muted/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="hidden md:block w-px bg-border my-2" aria-hidden />
            <div className="relative flex-1 hidden md:block">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                aria-label="Location"
                placeholder="Location or 'Remote'"
                className="w-full h-11 pl-11 border-transparent shadow-none rounded-full text-[14px] text-foreground focus-visible:ring-0 focus-visible:bg-muted/50"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-11 px-8 rounded-full shrink-0">
              Search
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[13px]">
            <span className="text-white/60">Try</span>
            {SUGGESTED_SEARCHES.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchTerm(tag)}
                className={cn(
                  "rounded-full border px-3 py-1 transition-colors",
                  searchTerm === tag
                    ? "bg-white text-primary border-white font-medium"
                    : "border-white/25 text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[17px] font-semibold text-foreground tracking-[-0.01em]">
            {searchTerm
              ? `Results for "${searchTerm}"`
              : locationTerm
              ? `Jobs in "${locationTerm}"`
              : "Recommended for you"}
          </h2>
          <p className="text-muted-foreground text-[13px] flex items-center gap-1.5 mt-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span aria-live="polite">
              {filteredJobs.length} match{filteredJobs.length === 1 ? "" : "es"}{hasFilters ? "" : " based on your profile and experience"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Work type">
          {WORK_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={workType === t.value}
              onClick={() => setWorkType(workType === t.value ? null : t.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all active:scale-95",
                workType === t.value
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_6px_14px_-6px_hsl(var(--primary)/0.6)]"
                  : "bg-white/80 text-muted-foreground border-border hover:text-foreground hover:border-foreground/20",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filteredJobs.length > 0 ? (
        <StaggerGroup key={`${searchTerm}-${locationTerm}-${workType}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map(job => (
            <StaggerItem key={job.id}>
              <JobCard job={job} variant="candidate" />
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No opportunities found"
          description="Try broadening your search criteria or explore other categories."
          action={
            <Button variant="outline" onClick={clearFilters}>Clear search</Button>
          }
        />
      )}
    </div>
  );
}
