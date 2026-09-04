import React, { useState } from "react";
import { MOCK_JOBS } from "@/lib/mock-data";
import { JobCard } from "@/components/shared/job-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Search, MapPin, Briefcase, Filter, Sparkles } from "lucide-react";

const SUGGESTED_SEARCHES = ["Product Design", "Frontend", "React", "Remote"];

export default function CandidateJobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");

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
    return matchesQuery && matchesLocation;
  });

  const hasFilters = searchTerm.trim() !== "" || locationTerm.trim() !== "";

  const clearFilters = () => {
    setSearchTerm("");
    setLocationTerm("");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <PageHeader
        title="Find Jobs"
        eyebrow={`${publishedJobs.length} open role${publishedJobs.length === 1 ? "" : "s"}`}
        description="Discover opportunities matched to your skills and experience."
      />

      {/* Hero Search */}
      <div className="bg-primary text-white rounded-2xl p-8 md:p-12 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-[26px] md:text-[32px] font-semibold mb-3 tracking-[-0.02em] leading-[1.15]">
            Find your next defining role.
          </p>
          <p className="text-white/70 mb-8 text-[15px]">Discover opportunities matched to your unique skills and potential.</p>

          <div className="flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-xl border border-white/15">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Job title, skills, or company"
                className="w-full h-11 pl-10 bg-white/10 border-transparent text-white placeholder:text-white/50 focus-visible:bg-white focus-visible:text-foreground focus-visible:placeholder:text-muted-foreground/70 transition-colors rounded-lg text-[14px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative flex-1 hidden md:block">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Location or 'Remote'"
                className="w-full h-11 pl-10 bg-white/10 border-transparent text-white placeholder:text-white/50 focus-visible:bg-white focus-visible:text-foreground focus-visible:placeholder:text-muted-foreground/70 transition-colors rounded-lg text-[14px]"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-11 px-8 bg-white text-primary hover:bg-white/90 shrink-0">
              Search
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[13px] text-white/70">
            <span className="opacity-70">Suggested:</span>
            {SUGGESTED_SEARCHES.map(tag => (
              <button
                key={tag}
                onClick={() => setSearchTerm(tag)}
                className="hover:text-white hover:underline transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">
            {searchTerm
              ? `Results for "${searchTerm}"`
              : locationTerm
              ? `Jobs in "${locationTerm}"`
              : "Recommended for you"}
          </h2>
          <p className="text-muted-foreground text-[13px] flex items-center gap-1.5 mt-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {filteredJobs.length} match{filteredJobs.length === 1 ? "" : "es"}{hasFilters ? "" : " based on your profile and experience"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map(job => (
            <JobCard key={job.id} job={job} variant="candidate" />
          ))}
        </div>
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
