import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { MOCK_JOBS } from "@/lib/mock-data";
import { JobCard } from "@/components/shared/job-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Badge } from "@workspace/design-system/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/design-system/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/design-system/dropdown-menu";
import { Search, Plus, Filter, Briefcase } from "lucide-react";

export default function RecruiterJobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [locationTypeFilters, setLocationTypeFilters] = useState<string[]>([]);

  const locationTypes = useMemo(
    () => Array.from(new Set(MOCK_JOBS.map(j => j.locationType).filter(Boolean))) as string[],
    []
  );

  const publishedCount = MOCK_JOBS.filter(j => j.status === 'published').length;
  const draftCount = MOCK_JOBS.filter(j => j.status === 'draft').length;

  const filteredJobs = MOCK_JOBS.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || job.status === activeTab;
    const matchesLocationType =
      locationTypeFilters.length === 0 || (job.locationType && locationTypeFilters.includes(job.locationType));
    return matchesSearch && matchesTab && matchesLocationType;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setLocationTypeFilters([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Jobs"
        eyebrow={`${publishedCount} published · ${draftCount} draft${draftCount === 1 ? "" : "s"}`}
        description="Manage your active listings and drafts."
        actions={
          <Link href="/recruiter/jobs/new/basic">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </Link>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, location..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {locationTypeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">{locationTypeFilters.length}</Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by work location</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {locationTypes.map(type => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={locationTypeFilters.includes(type)}
                onCheckedChange={(checked) =>
                  setLocationTypeFilters(prev => checked ? [...prev, type] : prev.filter(t => t !== type))
                }
                className="capitalize"
              >
                {type.replace('_', ' ')}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Jobs ({MOCK_JOBS.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({publishedCount})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({draftCount})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({MOCK_JOBS.filter(j => j.status === 'closed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="outline-none mt-0">
          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map(job => (
                <JobCard key={job.id} job={job} variant="recruiter" />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description="Try adjusting your search or filters to find what you're looking for."
              action={
                <Button variant="outline" onClick={clearFilters}>Clear search</Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
