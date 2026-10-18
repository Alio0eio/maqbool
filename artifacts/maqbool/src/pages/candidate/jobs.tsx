import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@workspace/api-client-react";
import { JobCard } from "@/components/shared/job-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Search, MapPin, Briefcase, Sparkles } from "lucide-react";
import { cn } from "@workspace/design-system/utils";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";
import { getCandidateJobs } from "@/lib/candidate-jobs-api";

const SUGGESTED_SEARCHES = ["Product Design", "Frontend", "React", "Remote"];
const WORK_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data;
    if (data && typeof data === "object") {
      const body = data as { error?: { message?: unknown }; message?: unknown };
      if (typeof body.error?.message === "string") return body.error.message;
      if (typeof body.message === "string") return body.message;
    }
  }

  return error instanceof Error ? error.message : "The request failed. Please try again.";
}

export default function CandidateJobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [workType, setWorkType] = useState<string | null>(null);
  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: ({ signal }) => getCandidateJobs(signal),
  });

  const jobs = jobsQuery.data?.jobs ?? [];

  const filteredJobs = jobs.filter(job => {
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
        eyebrow={
          jobsQuery.data
            ? `${jobsQuery.data.pagination.total} open role${jobsQuery.data.pagination.total === 1 ? "" : "s"}`
            : "Discover open roles"
        }
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
                {jobsQuery.data
                  ? `${filteredJobs.length} match${filteredJobs.length === 1 ? "" : "es"}${hasFilters ? "" : " based on your profile and experience"}`
                  : jobsQuery.isPending
                  ? "Loading job matches…"
                  : "Job matches unavailable"}
              </span>
            {jobsQuery.isFetching && jobsQuery.data && (
              <span className="ml-1" role="status">Refreshing job listings…</span>
            )}
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

      {jobsQuery.isError && !jobsQuery.data ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6 text-center">
          <p className="text-sm text-destructive" role="alert">
            We couldn’t load job listings. {getApiErrorMessage(jobsQuery.error)}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void jobsQuery.refetch()}
            disabled={jobsQuery.isFetching}
          >
            Try again
          </Button>
        </div>
      ) : jobsQuery.isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="status" aria-label="Loading job listings">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-64 rounded-2xl border border-border bg-white/70 p-5">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
              <div className="mt-5 h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-muted" />
              <div className="mt-8 h-3 w-full animate-pulse rounded bg-muted" />
              <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {jobsQuery.isError && (
            <p className="text-sm text-destructive" role="alert">
              We couldn’t refresh job listings. Showing the last loaded results. {getApiErrorMessage(jobsQuery.error)}
              <Button
                variant="link"
                className="ml-1 h-auto p-0"
                onClick={() => void jobsQuery.refetch()}
                disabled={jobsQuery.isFetching}
              >
                Retry
              </Button>
            </p>
          )}
          {jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No open roles yet"
              description="There are no published opportunities available right now. Please check back soon."
            />
          ) : filteredJobs.length > 0 ? (
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
        </>
      )}
    </div>
  );
}
