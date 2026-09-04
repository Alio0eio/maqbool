import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { MOCK_CANDIDATES, MOCK_APPLICATIONS, type Candidate } from "@/lib/mock-data";
import { CandidateCard } from "@/components/shared/candidate-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Label } from "@workspace/design-system/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/design-system/tabs";
import { Badge } from "@workspace/design-system/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@workspace/design-system/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/design-system/dropdown-menu";
import { Search, Filter, Star, Send, UserPlus } from "lucide-react";

const INACTIVE_STATUSES = new Set(["rejected", "withdrawn", "hired"]);

interface AddCandidateForm {
  name: string;
  email: string;
  headline: string;
  location: string;
  skills: string;
}

export default function RecruiterCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilters, setSkillFilters] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddCandidateForm>();

  const allSkills = useMemo(
    () => Array.from(new Set(candidates.flatMap(c => c.skills ?? []))).sort(),
    [candidates]
  );

  const onAddCandidate = (data: AddCandidateForm) => {
    const newCandidate: Candidate = {
      id: Math.max(0, ...candidates.map(c => c.id)) + 1,
      name: data.name,
      email: data.email,
      headline: data.headline || undefined,
      location: data.location || undefined,
      skills: data.skills ? data.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
      createdAt: new Date().toISOString(),
    };
    setCandidates(prev => [newCandidate, ...prev]);
    reset();
    setAddOpen(false);
  };

  const matchesFilters = (candidate: Candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSkills =
      skillFilters.length === 0 || skillFilters.every(skill => candidate.skills?.includes(skill));
    return matchesSearch && matchesSkills;
  };

  const filteredCandidates = candidates.filter(matchesFilters);

  const totalActiveInPipeline = candidates.filter(candidate => {
    const app = MOCK_APPLICATIONS.find(a => a.candidateId === candidate.id);
    return app && !INACTIVE_STATUSES.has(app.status);
  }).length;

  const activeCandidates = filteredCandidates.filter(candidate => {
    const app = MOCK_APPLICATIONS.find(a => a.candidateId === candidate.id);
    return app && !INACTIVE_STATUSES.has(app.status);
  });

  const savedCandidates = filteredCandidates.filter(c => savedIds.includes(c.id));

  const toggleSave = (id: number) => {
    setSavedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const renderGrid = (list: Candidate[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map(candidate => {
        const app = MOCK_APPLICATIONS.find(a => a.candidateId === candidate.id);
        return (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            application={app}
            saved={savedIds.includes(candidate.id)}
            onToggleSave={() => toggleSave(candidate.id)}
          />
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Talent Pool"
        eyebrow={`${candidates.length} candidate${candidates.length === 1 ? "" : "s"} · ${totalActiveInPipeline} active in pipeline`}
        description="Discover and manage candidates across all jobs."
        actions={
          <div className="flex gap-2">
          <Link href="/recruiter/status-updates">
            <Button variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Send Status Update
            </Button>
          </Link>
          <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) reset(); }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add candidate</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onAddCandidate)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Full name</Label>
                  <Input id="add-name" {...register("name", { required: true })} placeholder="Jordan Smith" />
                  {errors.name && <p className="text-xs text-destructive">Name is required.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email</Label>
                  <Input id="add-email" type="email" {...register("email", { required: true })} placeholder="jordan@example.com" />
                  {errors.email && <p className="text-xs text-destructive">A valid email is required.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-headline">Headline</Label>
                  <Input id="add-headline" {...register("headline")} placeholder="Senior Backend Engineer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-location">Location</Label>
                  <Input id="add-location" {...register("location")} placeholder="Austin, TX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-skills">Skills</Label>
                  <Input id="add-skills" {...register("skills")} placeholder="Python, Django, PostgreSQL" />
                  <p className="text-xs text-muted-foreground">Comma-separated.</p>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Add candidate</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates by name, skills, or experience..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Skills
                {skillFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">{skillFilters.length}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-72 overflow-y-auto">
              <DropdownMenuLabel>Filter by skill</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allSkills.map(skill => (
                <DropdownMenuCheckboxItem
                  key={skill}
                  checked={skillFilters.includes(skill)}
                  onCheckedChange={(checked) =>
                    setSkillFilters(prev => checked ? [...prev, skill] : prev.filter(s => s !== skill))
                  }
                >
                  {skill}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {skillFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSkillFilters([])}>Clear filters</Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Candidates ({filteredCandidates.length})</TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            Active in Pipeline <Badge variant="default" className="h-5 px-1.5 ml-1">{activeCandidates.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-2">
            Saved <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 ml-1" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="outline-none mt-0">
          {filteredCandidates.length > 0 ? (
            renderGrid(filteredCandidates)
          ) : (
            <EmptyState
              title="No candidates found"
              description="Try adjusting your search or filters."
              action={
                <Button variant="outline" onClick={() => { setSearchTerm(""); setSkillFilters([]); }}>Clear search</Button>
              }
            />
          )}
        </TabsContent>
        <TabsContent value="active" className="outline-none mt-0">
          {activeCandidates.length > 0 ? (
            renderGrid(activeCandidates)
          ) : (
            <EmptyState
              title="No candidates in an active pipeline"
              description="Candidates show up here once they're screening, interviewing, or awaiting a decision."
            />
          )}
        </TabsContent>
        <TabsContent value="saved" className="outline-none mt-0">
          {savedCandidates.length > 0 ? (
            renderGrid(savedCandidates)
          ) : (
            <EmptyState
              icon={Star}
              title="No saved candidates yet"
              description="Star a candidate's card to shortlist them here for quick access later."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
