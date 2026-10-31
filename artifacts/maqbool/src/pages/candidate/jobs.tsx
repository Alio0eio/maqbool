import React, { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiError } from "@workspace/api-client-react";
import { useSearchParams } from "wouter";
import { JobCard } from "@/components/shared/job-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Search, MapPin, Briefcase, Sparkles, LoaderCircle } from "lucide-react";
import { cn } from "@workspace/design-system/utils";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";
import { useAuth } from "@/lib/auth";
import {
  candidateSavedJobsQueryKey,
  getCandidateJobs,
  getCandidateSavedJobs,
  type CandidateJobsQuery,
} from "@/lib/candidate-jobs-api";
import { useCandidateJobSave } from "@/lib/use-candidate-job-save";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  getCandidateJobsEmptyState,
  getCandidateJobsViewState,
  parseJobQuery,
  serializeJobQuery,
} from "@/lib/candidate-jobs-query";

const SUGGESTED_SEARCHES = ["Product Design", "Frontend", "React", "Remote"];
const WORK_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
] as const;
const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
] as const;
const EXPERIENCE_LEVELS = ["Entry", "Mid", "Senior", "Lead", "Director"];
const SEARCH_DEBOUNCE_MS = 350;

function parsePositiveIntegerInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseNonNegativeIntegerInput(value: string): string | undefined {
  if (!value.trim()) return "";
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? String(parsed) : undefined;
}

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

function JobCardSkeletons() {
  return (
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
  );
}

export default function CandidateJobs() {
  const { user, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const parsedQuery = useMemo(() => parseJobQuery(new URLSearchParams(searchString)), [searchString]);
  const { query, issues } = parsedQuery;
  const [searchDraft, setSearchDraft] = useState(query.search ?? "");
  const [locationDraft, setLocationDraft] = useState(query.location ?? "");
  const [skillsDraft, setSkillsDraft] = useState(query.skills ?? "");
  const [companyDraft, setCompanyDraft] = useState(query.companyId ?? "");
  const [minSalaryDraft, setMinSalaryDraft] = useState(query.minSalary ?? "");
  const [maxSalaryDraft, setMaxSalaryDraft] = useState(query.maxSalary ?? "");
  const [draftValidationMessage, setDraftValidationMessage] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const updateQuery = (patch: Partial<CandidateJobsQuery>, resetPage = false) => {
    const nextQuery = { ...query, ...patch, page: resetPage ? 1 : patch.page ?? query.page };
    const nextParams = serializeJobQuery(new URLSearchParams(searchString), nextQuery);
    if (nextParams.toString() !== searchString) setSearchParams(nextParams);
  };

  useEffect(() => {
    if (issues.length > 0) return;
    const normalizedParams = serializeJobQuery(new URLSearchParams(searchString), query);
    if (normalizedParams.toString() !== searchString) {
      setSearchParams(normalizedParams, { replace: true });
    }
  }, [issues.length, query, searchString, setSearchParams]);

  useEffect(() => {
    setSearchDraft(query.search ?? "");
  }, [query.search]);

  useEffect(() => {
    setLocationDraft(query.location ?? "");
  }, [query.location]);

  useEffect(() => {
    setSkillsDraft(query.skills ?? "");
  }, [query.skills]);

  useEffect(() => {
    setCompanyDraft(query.companyId ?? "");
  }, [query.companyId]);

  useEffect(() => {
    setMinSalaryDraft(query.minSalary ?? "");
  }, [query.minSalary]);

  useEffect(() => {
    setMaxSalaryDraft(query.maxSalary ?? "");
  }, [query.maxSalary]);

  const commitDrafts = () => {
    const companyIdValue = parsePositiveIntegerInput(companyDraft);
    const minSalaryValue = parseNonNegativeIntegerInput(minSalaryDraft);
    const maxSalaryValue = parseNonNegativeIntegerInput(maxSalaryDraft);
    if (
      (companyDraft.trim() !== "" && companyIdValue === undefined) ||
      minSalaryValue === undefined ||
      maxSalaryValue === undefined
    ) {
      setDraftValidationMessage("Enter a positive whole company ID and non-negative whole salary amounts.");
      return;
    }
    setDraftValidationMessage("");
    updateQuery({
      search: searchDraft,
      location: locationDraft,
      skills: skillsDraft,
      companyId: companyIdValue === undefined ? undefined : String(companyIdValue),
      minSalary: minSalaryValue,
      maxSalary: maxSalaryValue,
    }, true);
  };

  useEffect(() => {
    if (
      searchDraft === (query.search ?? "") &&
      locationDraft === (query.location ?? "") &&
      skillsDraft === (query.skills ?? "") &&
      companyDraft === (query.companyId ?? "") &&
      minSalaryDraft === (query.minSalary ?? "") &&
      maxSalaryDraft === (query.maxSalary ?? "")
    ) return;
    searchTimer.current = setTimeout(commitDrafts, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimer.current !== undefined) clearTimeout(searchTimer.current);
    };
  }, [
    query,
    searchDraft,
    locationDraft,
    skillsDraft,
    companyDraft,
    minSalaryDraft,
    maxSalaryDraft,
    searchString,
  ]);

  const commitSearch = () => {
    if (searchTimer.current !== undefined) clearTimeout(searchTimer.current);
    commitDrafts();
  };

  const jobsQuery = useQuery({
    queryKey: ["jobs", query],
    queryFn: ({ signal }) => getCandidateJobs(query, signal),
    enabled: issues.length === 0,
    retry: 1,
    retryDelay: 1000,
    placeholderData: keepPreviousData,
  });
  const savedJobsQuery = useQuery({
    queryKey: candidateSavedJobsQueryKey(user?.id ?? 0),
    queryFn: ({ signal }) => getCandidateSavedJobs(signal),
    enabled: Boolean(user?.id) && role === "candidate",
    retry: 1,
  });
  const saveMutation = useCandidateJobSave(user?.id ?? 0);
  const savedJobIds = new Set((savedJobsQuery.data ?? []).map(({ jobId }) => jobId));
  const viewState = getCandidateJobsViewState({
    hasInvalidQuery: issues.length > 0,
    isPending: jobsQuery.isPending,
    isError: jobsQuery.isError,
    hasData: jobsQuery.data !== undefined,
    isPlaceholderData: jobsQuery.isPlaceholderData,
    jobCount: jobsQuery.data?.jobs.length ?? 0,
  });
  const hasCurrentData = jobsQuery.data !== undefined && !jobsQuery.isPlaceholderData;

  const searchTerm = query.search ?? "";
  const locationTerm = query.location ?? "";
  const companyId = query.companyId ?? "";
  const jobType = query.jobType ?? "";
  const workType = query.locationType || null;
  const experienceLevel = query.experienceLevel;
  const minSalary = query.minSalary ?? "";
  const maxSalary = query.maxSalary ?? "";
  const skills = query.skills ?? "";

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
  const emptyState = getCandidateJobsEmptyState(hasFilters, jobsQuery.data?.pagination.total ?? 0);

  const clearFilters = () => {
    if (searchTimer.current !== undefined) clearTimeout(searchTimer.current);
    setSearchDraft("");
    setLocationDraft("");
    setSkillsDraft("");
    setCompanyDraft("");
    setMinSalaryDraft("");
    setMaxSalaryDraft("");
    setDraftValidationMessage("");
    updateQuery({
      search: "",
      location: "",
      companyId: undefined,
      jobType: "",
      locationType: "",
      experienceLevel: "",
      minSalary: "",
      maxSalary: "",
      skills: "",
      sortBy: "postedAt",
      sortOrder: "desc",
    }, true);
  };

  const clearInvalidParameters = () => {
    if (searchTimer.current !== undefined) clearTimeout(searchTimer.current);
    setSearchParams(serializeJobQuery(new URLSearchParams(searchString), query), { replace: true });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <PageHeader
        title="Find Jobs"
        eyebrow={
          hasCurrentData
            ? `${jobsQuery.data?.pagination.total} open role${jobsQuery.data?.pagination.total === 1 ? "" : "s"}`
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
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
              />
            </div>
            <div className="hidden md:block w-px bg-border my-2" aria-hidden />
            <div className="relative flex-1 hidden md:block">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                aria-label="Location"
                placeholder="Location or 'Remote'"
                className="w-full h-11 pl-11 border-transparent shadow-none rounded-full text-[14px] text-foreground focus-visible:ring-0 focus-visible:bg-muted/50"
                value={locationDraft}
                onChange={(event) => setLocationDraft(event.target.value)}
              />
            </div>
            <Button size="lg" className="h-11 px-8 rounded-full shrink-0" onClick={commitSearch}>
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
                  if (searchTimer.current !== undefined) clearTimeout(searchTimer.current);
                  setSearchDraft(tag);
                  updateQuery({ search: tag, location: locationDraft, skills: skillsDraft }, true);
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
            step="1"
            value={companyDraft}
            onChange={(event) => setCompanyDraft(event.target.value)}
            placeholder="Any company"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Job type
          <select
            aria-label="Job type"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={jobType}
            onChange={(event) => updateQuery({ jobType: event.target.value as CandidateJobsQuery["jobType"] }, true)}
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
            onChange={(event) => updateQuery({ experienceLevel: event.target.value }, true)}
          >
            <option value="">Any experience</option>
            {EXPERIENCE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            {experienceLevel && !EXPERIENCE_LEVELS.includes(experienceLevel) && (
              <option value={experienceLevel}>{experienceLevel}</option>
            )}
          </select>
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Skills (comma-separated)
          <Input
            aria-label="Skills (comma-separated)"
            value={skillsDraft}
            onChange={(event) => setSkillsDraft(event.target.value)}
            placeholder="React, TypeScript"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Minimum salary
          <Input
            aria-label="Minimum salary"
            type="number"
            min="0"
            step="1"
            value={minSalaryDraft}
            onChange={(event) => {
              const value = event.target.value;
              const clearMax = value !== "" && maxSalaryDraft !== "" && Number(value) > Number(maxSalaryDraft);
              setMinSalaryDraft(value);
              if (clearMax) setMaxSalaryDraft("");
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
            step="1"
            value={maxSalaryDraft}
            onChange={(event) => {
              const value = event.target.value;
              const clearMin = value !== "" && minSalaryDraft !== "" && Number(value) < Number(minSalaryDraft);
              setMaxSalaryDraft(value);
              if (clearMin) setMinSalaryDraft("");
            }}
            placeholder="No maximum"
          />
        </label>
        <label className="space-y-1 text-xs font-medium text-muted-foreground">
          Sort by
          <select
            aria-label="Sort by"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={query.sortBy}
            onChange={(event) => updateQuery({ sortBy: event.target.value as CandidateJobsQuery["sortBy"] }, true)}
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
            value={query.sortOrder}
            onChange={(event) => updateQuery({ sortOrder: event.target.value as CandidateJobsQuery["sortOrder"] }, true)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </section>
      {draftValidationMessage && (
        <p className="text-sm text-destructive" role="alert">{draftValidationMessage}</p>
      )}

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
              {hasCurrentData
                ? `${jobsQuery.data?.pagination.total} match${jobsQuery.data?.pagination.total === 1 ? "" : "es"}${hasFilters ? "" : " based on your profile and experience"}`
                : viewState === "updating"
                ? "Updating job matches…"
                : viewState === "loading"
                ? "Loading job matches…"
                : viewState === "invalid-query"
                ? "Review the job search parameters"
                : "Job matches unavailable"}
            </span>
            {jobsQuery.isFetching && hasCurrentData && (
              <span className="ml-1 inline-flex items-center gap-1" role="status">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Refreshing job listings…
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Work type">
          {WORK_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={workType === t.value}
              onClick={() => updateQuery({ locationType: workType === t.value ? "" : t.value }, true)}
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

      {viewState === "invalid-query" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6">
          <h3 className="font-semibold text-foreground">Some job search parameters are invalid</h3>
          <ul className="mt-2 space-y-1 text-sm text-destructive" role="alert">
            {issues.map((issue, index) => (
              <li key={`${issue.parameter}-${index}`}>
                <span className="font-medium">{issue.parameter}:</span> {issue.message}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            Correct the URL values or reset only the invalid parameters. Valid filters will be kept.
          </p>
          <Button variant="outline" className="mt-4" onClick={clearInvalidParameters}>
            Reset invalid parameters
          </Button>
        </div>
      )}

      {savedJobsQuery.isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-4">
          <p className="text-sm text-destructive" role="alert">
            Saved-job status couldn’t be loaded. {getApiErrorMessage(savedJobsQuery.error)}
          </p>
          <Button
            variant="link"
            className="mt-1 h-auto p-0"
            onClick={() => void savedJobsQuery.refetch()}
            disabled={savedJobsQuery.isFetching}
          >
            {savedJobsQuery.isFetching ? "Retrying…" : "Retry"}
          </Button>
        </div>
      )}

      {viewState === "error" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6 text-center">
          <p className="text-sm text-destructive" role="alert">
            We couldn’t load job listings for this search. {getApiErrorMessage(jobsQuery.error)}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void jobsQuery.refetch()}
            disabled={jobsQuery.isFetching}
          >
            {jobsQuery.isFetching && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {jobsQuery.isFetching ? "Retrying…" : "Try again"}
          </Button>
        </div>
      )}

      {viewState === "loading" && <JobCardSkeletons />}

      {viewState === "updating" && (
        <div aria-busy="true">
          <p className="mb-3 text-sm text-muted-foreground" role="status">
            Updating results for the new search. Previous results remain visible until they are ready.
          </p>
          {jobsQuery.data?.jobs.length ? (
            <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobsQuery.data.jobs.map((job) => (
                <StaggerItem key={job.id}>
                  <JobCard
                    job={job}
                    variant="candidate"
                    saved={savedJobIds.has(job.id)}
                    saving={
                      savedJobsQuery.isPending ||
                      savedJobsQuery.isError ||
                      savedJobsQuery.isFetching ||
                      saveMutation.isPending
                    }
                    savePending={saveMutation.isPending && saveMutation.variables?.jobId === job.id}
                    onToggleSave={
                      user && role === "candidate"
                        ? () => saveMutation.mutate({ jobId: job.id, isSaved: savedJobIds.has(job.id) })
                        : undefined
                    }
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : <JobCardSkeletons />}
        </div>
      )}

      {(viewState === "empty" || viewState === "results") && (
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
                {jobsQuery.isFetching ? "Retrying…" : "Retry"}
              </Button>
            </p>
          )}
          {viewState === "empty" && emptyState === "no-matches" ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs match your search"
              description="Try broadening your search criteria or clear your filters."
              action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
            />
          ) : viewState === "empty" && emptyState === "no-jobs" ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs are currently available"
              description="There are no published opportunities available right now. Please check back soon."
            />
          ) : viewState === "empty" ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs on this page"
              description="The listings may have changed since you opened this page. Return to the first page to see the current results."
              action={
                <Button variant="outline" onClick={() => updateQuery({ page: 1 })}>
                  Go to first page
                </Button>
              }
            />
          ) : (
            <StaggerGroup key={searchString} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobsQuery.data?.jobs.map(job => (
                <StaggerItem key={job.id}>
                  <JobCard
                    job={job}
                    variant="candidate"
                    saved={savedJobIds.has(job.id)}
                    saving={
                      savedJobsQuery.isPending ||
                      savedJobsQuery.isError ||
                      savedJobsQuery.isFetching ||
                      saveMutation.isPending
                    }
                    savePending={saveMutation.isPending && saveMutation.variables?.jobId === job.id}
                    onToggleSave={
                      user && role === "candidate"
                        ? () => saveMutation.mutate({ jobId: job.id, isSaved: savedJobIds.has(job.id) })
                        : undefined
                    }
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
          {hasCurrentData && jobsQuery.data && jobsQuery.data.pagination.total > 0 && (
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
                    value={query.limit}
                    onChange={(event) => {
                      updateQuery({ limit: Number(event.target.value) }, true);
                    }}
                  >
                    {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                    {!PAGE_SIZES.includes(query.limit as (typeof PAGE_SIZES)[number]) && (
                      <option value={query.limit}>{query.limit}</option>
                    )}
                  </select>
                </label>
                <Button
                  variant="outline"
                  disabled={query.page <= 1 || jobsQuery.isFetching}
                  onClick={() => updateQuery({ page: Math.max(1, query.page - 1) })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={query.page >= jobsQuery.data.pagination.totalPages || jobsQuery.isFetching}
                  onClick={() => updateQuery({ page: query.page + 1 })}
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
