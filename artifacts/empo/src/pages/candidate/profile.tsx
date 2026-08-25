import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { MOCK_CANDIDATES, MOCK_APPLICATIONS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { Button } from "@workspace/design-system/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/design-system/card";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/design-system/tabs";
import { Badge } from "@workspace/design-system/badge";
import { Input } from "@workspace/design-system/input";
import { Textarea } from "@workspace/design-system/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { Mail, Pencil, Check, X, BriefcaseBusiness, CalendarDays, MapPin } from "lucide-react";

export default function CandidateProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const candidate = MOCK_CANDIDATES.find((candidate) => candidate.email === user?.email);
  const application = candidate ? MOCK_APPLICATIONS.find((app) => app.candidateId === candidate.id) : undefined;

  // Local-only edit state for headline/summary — there's no profile-edit
  // route or write API yet, so "Edit profile" edits in place rather than
  // linking to a page that doesn't exist.
  const [isEditing, setIsEditing] = useState(false);
  const [headlineDraft, setHeadlineDraft] = useState(candidate?.headline ?? "");
  const [summaryDraft, setSummaryDraft] = useState(candidate?.summary ?? "");
  const [headline, setHeadline] = useState(candidate?.headline ?? "");
  const [summary, setSummary] = useState(candidate?.summary ?? "");

  if (!candidate) {
    return null;
  }

  const eyebrow = application
    ? `${application.stage.toUpperCase()} · ${application.status.toUpperCase()}`
    : `${candidate.yearsOfExp} YRS EXP · ${(candidate.availability ?? "").toUpperCase()}`;

  function startEditing() {
    setHeadlineDraft(headline);
    setSummaryDraft(summary);
    setIsEditing(true);
  }

  function saveEditing() {
    setHeadline(headlineDraft.trim() || headline);
    setSummary(summaryDraft.trim() || summary);
    setIsEditing(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">
      <PageHeader
        title="My Profile"
        eyebrow={eyebrow}
        description="Keep your story, skills, and experience up to date."
        actions={
          <Link href="/candidate/dashboard">
            <Button variant="outline" className="shadow-sm">
              Back to dashboard
            </Button>
          </Link>
        }
      />

      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Avatar className="w-24 h-24 border border-border">
              <AvatarImage src={candidate.avatarUrl || ""} alt={candidate.name} />
              <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                {candidate.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-display font-semibold text-foreground">{candidate.name}</h2>
              {isEditing ? (
                <Input
                  value={headlineDraft}
                  onChange={(e) => setHeadlineDraft(e.target.value)}
                  className="mt-2 max-w-sm"
                  placeholder="Headline"
                />
              ) : (
                <p className="text-muted-foreground mt-2">{headline}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{candidate.location}</span>
                <span className="font-mono">{candidate.yearsOfExp} years experience</span>
                <span>{candidate.availability}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={saveEditing}>
                    <Check className="w-4 h-4 mr-2" /> Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={startEditing}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit profile
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setLocation("/candidate/messages")}>
                    <Mail className="w-4 h-4 mr-2" /> Message recruiter
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-2 rounded-xl border border-border bg-surface-subtle p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="outline-none">
          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg font-display">About Alex</CardTitle>
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Profile overview</span>
                </div>
              {isEditing ? (
                <Textarea
                  value={summaryDraft}
                  onChange={(e) => setSummaryDraft(e.target.value)}
                  className="mt-4 min-h-[100px]"
                  placeholder="Tell recruiters about yourself"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-4">{summary || "No summary provided yet."}</p>
              )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-6 sm:p-7">
                <CardTitle className="text-lg font-display">Profile details</CardTitle>
                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Location</p><p className="mt-1 font-medium text-foreground">{candidate.location || "Not provided"}</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BriefcaseBusiness className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Experience</p><p className="mt-1 font-medium text-foreground">{candidate.yearsOfExp ?? 0} years</p></div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Availability</p><p className="mt-1 font-medium text-foreground">{candidate.availability || "Not provided"}</p></div>
                  </div>
                </div>
              </CardContent>
              </Card>
            </div>

          <Card className="border-border shadow-sm">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-lg font-display">Experience</CardTitle>
                <span className="text-xs text-muted-foreground">{candidate.experience?.length ?? 0} roles</span>
              </div>
              <div className="mt-6 space-y-0">
                {candidate.experience?.map((role, index) => (
                  <div key={role.id} className="relative flex gap-4 pb-7 last:pb-0">
                    <div className="flex w-5 shrink-0 flex-col items-center">
                      <div className="z-10 flex h-5 w-5 items-center justify-center rounded-full border-4 border-background bg-primary ring-1 ring-primary/20" />
                      {index < (candidate.experience?.length ?? 0) - 1 && <div className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface-subtle p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-display font-semibold text-foreground">{role.title}</h3>
                          <p className="mt-1 text-sm font-medium text-primary">{role.company}</p>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(role.startDate).getFullYear()} - {role.current ? "Present" : new Date(role.endDate!).getFullYear()}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {application && (
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg font-display">Current application</CardTitle>
                  <BriefcaseBusiness className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-foreground">{application.job?.title ?? "Role"} at {application.job?.company ?? "Stratos Financial"}</p>
                  <p className="font-mono text-xs uppercase text-muted-foreground">{application.stage} · {application.status}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="skills" className="outline-none">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <CardTitle className="text-lg font-display">Key skills</CardTitle>
              <div className="mt-4 flex flex-wrap gap-2">
                {candidate.skills?.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <Card className="border-border shadow-sm">
        <CardHeader className="p-6">
          <CardTitle className="text-lg font-display">Profile links</CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid gap-4 md:grid-cols-2">
          {/* External URLs — plain <a> tags, not wouter's Link (which only
              handles in-app routes and would try to SPA-navigate to them). */}
          {candidate.portfolioUrl ? (
            <a href={candidate.portfolioUrl} target="_blank" rel="noreferrer" className="block rounded-2xl border border-border bg-surface-subtle p-4 text-sm text-foreground hover:bg-surface-subtle/80">
              <div className="font-semibold">Portfolio</div>
              <div className="text-muted-foreground mt-1 truncate">{candidate.portfolioUrl}</div>
            </a>
          ) : (
            <div className="block rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              <div className="font-semibold text-foreground">Portfolio</div>
              <div className="mt-1">Not provided</div>
            </div>
          )}
          {candidate.linkedinUrl ? (
            <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="block rounded-2xl border border-border bg-surface-subtle p-4 text-sm text-foreground hover:bg-surface-subtle/80">
              <div className="font-semibold">LinkedIn</div>
              <div className="text-muted-foreground mt-1 truncate">{candidate.linkedinUrl}</div>
            </a>
          ) : (
            <div className="block rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              <div className="font-semibold text-foreground">LinkedIn</div>
              <div className="mt-1">Not provided</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
