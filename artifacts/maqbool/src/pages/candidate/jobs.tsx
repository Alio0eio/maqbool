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
import { getCandidateJobs, type CandidateJobsQuery } from "@/lib/candidate-jobs-api";

const SUGGESTED_SEARCHES = ["Product Design", "Frontend", "React", "Remote"];
const WORK_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];
const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
] as const;
const EXPERIENCE_LEVELS = ["Entry", "Mid", "Senior", "Lead", "Director"];

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
  const [companyId, setCompanyId] = useState("");
  const [jobType, setJobType] = useState<CandidateJobsQuery["jobType"]>("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [skills, setSkills] = useState("");
  const [sortBy, setSortBy] = useState<CandidateJobsQuery["sortBy"]>("postedAt");
  const [sortOrder, setSortOrder] = useState<CandidateJobsQuery["sortOrder"]>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const query: CandidateJobsQuery = {
    page,
    limit,
    companyId,
    search: searchTerm,
    location: locationTerm,
    jobType,
    locationType: (workType ?? "") as CandidateJobsQuery["locationType"],
    experienceLevel,
    minSalary,
    maxSalary,
    skills,
    sortBy,
    sortOrder,
  };
  const jobsQuery = useQuery({
    queryKey: ["jobs", query, searchTerm, locationTerm],
    queryFn: ({ signal }) => getCandidateJobs(query, signal),
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

  const hasFilters = Boolean(
    searchTerm.trim() ||
    locationTerm.trim() ||
    workType ||
    companyId ||
    jobType ||
    experienceLevel ||
    minSalary ||
    maxSalary ||
    skills.trim(),
  );

  const clearFilters = () => {
    setSearchTerm("");
    setLocationTerm("");
    setWorkType(null);
    setCompanyId("");
    setJobType("");
    setExperienceLevel("");
    setMinSalary("");
    setMaxSalary("");
    setSkills("");
    setSortBy("postedAt");
    setSortOrder("desc");
    setPage(1);
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
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
                onChange={(e) => {
                  setLocationTerm(e.target.value);
                  setPage(1);
                }}
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
                onClick={() => {
                  setSearchTerm(tag);
                  setPage(1);
                }}
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

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-border bg-white/70 p-4" aria-label="Job filters">
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Company ID
          <Input
            aria-label="Company ID"
            type="number"
            min="1"
            value={companyId}
            onChange={(event) => {
              setCompanyId(event.target.value);
              setPage(1);
            }}
            placeholder="Any company"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Job type
          <select
            aria-label="Job type"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={jobType}
            onChange={(event) => {
              setJobType(event.target.value as CandidateJobsQuery["jobType"]);
              setPage(1);
            }}
          >
            <option value="">All job types</option>
            {JOB_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Experience level
          <select
            aria-label="Experience level"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={experienceLevel}
            onChange={(event) => {
              setExperienceLevel(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Any experience</option>
            {EXPERIENCE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Skills (comma-separated)
          <Input
            aria-label="Skills (comma-separated)"
            value={skills}
            onChange={(event) => {
              setSkills(event.target.value);
              setPage(1);
            }}
            placeholder="React, TypeScript"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Minimum salary
          <Input
            aria-label="Minimum salary"
            type="number"
            min="0"
            value={minSalary}
            onChange={(event) => {
              setMinSalary(event.target.value);
              setPage(1);
            }}
            placeholder="No minimum"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Maximum salary
          <Input
            aria-label="Maximum salary"
            type="number"
            min="0"
            value={maxSalary}
            onChange={(event) => {
              setMaxSalary(event.target.value);
              setPage(1);
            }}
            placeholder="No maximum"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Sort by
          <select
            aria-label="Sort by"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as CandidateJobsQuery["sortBy"]);
              setPage(1);
            }}
          >
            <option value="postedAt">Posted date</option>
            <option value="salary">Salary</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Sort order
          <select
            aria-label="Sort order"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as CandidateJobsQuery["sortOrder"]);
              setPage(1);
            }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </section>

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
              onClick={() => {
                setWorkType(workType === t.value ? null : t.value);
                setPage(1);
              }}
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
          {jobsQuery.data?.pagination.total === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={hasFilters ? "No opportunities found" : "No open roles yet"}
              description={hasFilters ? "Try broadening your search criteria or clear your filters." : "There are no published opportunities available right now. Please check back soon."}
              action={hasFilters ? <Button variant="outline" onClick={clearFilters}>Clear filters</Button> : undefined}
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
          {jobsQuery.data && jobsQuery.data.pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Page {jobsQuery.data.pagination.page} of {jobsQuery.data.pagination.totalPages} · {jobsQuery.data.pagination.total} jobs
              </p>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Results per page
                  <select
                    aria-label="Results per page"
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                    value={limit}
                    onChange={(event) => {
                      setLimit(Number(event.target.value));
                      setPage(1);
                    }}
                  >
                    {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
                <Button
                  variant="outline"
                  disabled={page <= 1 || jobsQuery.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page >= jobsQuery.data.pagination.totalPages || jobsQuery.isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
