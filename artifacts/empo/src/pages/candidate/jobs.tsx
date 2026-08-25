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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <PageHeader
        title="Find Jobs"
        eyebrow={`${publishedJobs.length} OPEN ROLE${publishedJobs.length === 1 ? "" : "S"}`}
        description="Discover opportunities matched to your skills and experience."
      />

      {/* Hero Search */}
      <div className="bg-primary text-white rounded-2xl p-8 md:p-12 text-center relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary opacity-20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="font-display text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            Find your next defining role.
          </p>
          <p className="text-blue-100 mb-8 text-lg">Discover opportunities matched to your unique skills and potential.</p>

          <div className="flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <Input
                placeholder="Job title, skills, or company"
                className="w-full h-12 pl-10 bg-white/10 border-transparent text-white placeholder:text-white/60 focus:bg-white focus:text-foreground focus:placeholder:text-muted-foreground transition-all rounded-lg text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative flex-1 hidden md:block">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <Input
                placeholder="Location or 'Remote'"
                className="w-full h-12 pl-10 bg-white/10 border-transparent text-white placeholder:text-white/60 focus:bg-white focus:text-foreground focus:placeholder:text-muted-foreground transition-all rounded-lg text-base"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-12 px-8 bg-white text-primary hover:bg-blue-50 font-semibold shadow-sm shrink-0">
              Search
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-blue-100">
            <span className="opacity-70">Suggested:</span>
            {SUGGESTED_SEARCHES.map(tag => (
              <button
                key={tag}
                onClick={() => setSearchTerm(tag)}
                className="hover:text-white hover:underline transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground tracking-tight">
            {searchTerm
              ? `Results for "${searchTerm}"`
              : locationTerm
              ? `Jobs in "${locationTerm}"`
              : "Recommended for you"}
          </h2>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono">{filteredJobs.length}</span>
            {" "}match{filteredJobs.length === 1 ? "" : "es"}{hasFilters ? "" : " based on your profile and experience"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="shadow-sm gap-2">
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
