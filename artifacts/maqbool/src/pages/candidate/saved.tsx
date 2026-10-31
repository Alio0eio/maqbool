import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@workspace/api-client-react";
import { JobCard } from "@/components/shared/job-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Card, CardContent } from "@workspace/design-system/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/design-system/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/design-system/select";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";
import { useAuth } from "@/lib/auth";
import {
  candidateSavedJobsQueryKey,
  getCandidateSavedJobs,
} from "@/lib/candidate-jobs-api";
import { useCandidateJobSave } from "@/lib/use-candidate-job-save";
import { Bookmark, ArrowRight, Bell, Plus, Trash2, LoaderCircle } from "lucide-react";

interface JobAlert {
  id: number;
  keywords: string;
  location: string;
  frequency: "daily" | "weekly" | "instant";
  active: boolean;
}

const INITIAL_ALERTS: JobAlert[] = [
  { id: 1, keywords: "Product Designer, UX Researcher", location: "Remote", frequency: "daily", active: true },
  { id: 2, keywords: "Frontend Engineer", location: "New York, NY", frequency: "weekly", active: true },
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

export default function CandidateSaved() {
  const { user, role } = useAuth();
  const savedJobsQuery = useQuery({
    queryKey: candidateSavedJobsQueryKey(user?.id ?? 0),
    queryFn: ({ signal }) => getCandidateSavedJobs(signal),
    enabled: Boolean(user?.id) && role === "candidate",
    retry: 1,
  });
  const saveMutation = useCandidateJobSave(user?.id ?? 0);
  const savedJobs = savedJobsQuery.data ?? [];
  const [alerts, setAlerts] = useState<JobAlert[]>(INITIAL_ALERTS);
  const [form, setForm] = useState({ keywords: "", location: "", frequency: "daily" as JobAlert["frequency"] });

  function addAlert() {
    if (!form.keywords.trim()) return;
    setAlerts(prev => [...prev, { id: Date.now(), ...form, active: true }]);
    setForm({ keywords: "", location: "", frequency: "daily" });
  }

  function toggleAlert(id: number) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }

  function removeAlert(id: number) {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  const activeAlertCount = alerts.filter(a => a.active).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <PageHeader
        title="Saved Jobs"
        eyebrow={`${savedJobsQuery.isPending ? "Loading saved jobs" : savedJobsQuery.isError ? "Saved jobs unavailable" : `${savedJobs.length} saved job${savedJobs.length === 1 ? "" : "s"}`} · ${activeAlertCount} active alert${activeAlertCount === 1 ? "" : "s"}`}
        description="Your bookmarked roles and job alert preferences."
        actions={
          <Link href="/candidate/jobs">
            <Button variant="outline" className="gap-2">
              <ArrowRight className="w-4 h-4" /> Browse jobs
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="saved" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="saved" className="gap-2">
            <Bookmark className="w-3.5 h-3.5" /> Saved Jobs
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="w-3.5 h-3.5" /> Job Alerts
            {activeAlertCount > 0 && (
              <span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-1.5">{activeAlertCount}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="outline-none mt-0">
          {savedJobsQuery.isPending ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground" role="status">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading saved jobs…
            </div>
          ) : savedJobsQuery.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.04] p-6 text-center">
              <p className="text-sm text-destructive" role="alert">
                We couldn’t load your saved jobs. {getApiErrorMessage(savedJobsQuery.error)}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => void savedJobsQuery.refetch()}
                disabled={savedJobsQuery.isFetching}
              >
                {savedJobsQuery.isFetching && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {savedJobsQuery.isFetching ? "Retrying…" : "Try again"}
              </Button>
            </div>
          ) : savedJobs.length > 0 ? (
            <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedJobs.map((savedJob) => (
                <StaggerItem key={savedJob.id}>
                  <JobCard
                    job={savedJob.job}
                    variant="candidate"
                    saved
                    saving={savedJobsQuery.isFetching || saveMutation.isPending}
                    savePending={saveMutation.isPending && saveMutation.variables?.jobId === savedJob.jobId}
                    onToggleSave={() => saveMutation.mutate({ jobId: savedJob.jobId, isSaved: true })}
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : (
            <EmptyState
              icon={Bookmark}
              title="No saved jobs yet"
              description="Bookmark jobs while you explore the best opportunities."
              action={
                <Link href="/candidate/jobs">
                  <Button>Find jobs</Button>
                </Link>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="alerts" className="outline-none mt-0 space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-4">Create a new alert</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  aria-label="Alert keywords"
                  placeholder="Keywords (e.g. Product Designer)"
                  value={form.keywords}
                  onChange={(e) => setForm(f => ({ ...f, keywords: e.target.value }))}
                  className="sm:col-span-1"
                />
                <Input
                  aria-label="Alert location"
                  placeholder="Location (e.g. Remote)"
                  value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Select
                    value={form.frequency}
                    onValueChange={(value) => setForm(f => ({ ...f, frequency: value as JobAlert["frequency"] }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addAlert} size="icon" className="shrink-0" aria-label="Add job alert">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
            {alerts.map(alert => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              >
              <Card className={alert.active ? "" : "opacity-70"}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${alert.active ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{alert.keywords}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{alert.location || "Any location"}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 font-medium capitalize">{alert.frequency}</span>
                      {!alert.active && <span className="font-medium">Paused</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={alert.active}
                    aria-label={`${alert.active ? "Pause" : "Resume"} alert for ${alert.keywords}`}
                    onClick={() => toggleAlert(alert.id)}
                    className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative shrink-0 ${alert.active ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${alert.active ? 'left-6' : 'left-1'}`} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete alert for ${alert.keywords}`}
                    onClick={() => removeAlert(alert.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
              </motion.div>
            ))}
            </AnimatePresence>
            {alerts.length === 0 && (
              <EmptyState
                icon={Bell}
                title="No job alerts yet"
                description="Create one above to get notified about new matching roles."
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
