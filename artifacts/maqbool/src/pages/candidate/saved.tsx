import React, { useState } from "react";
import { MOCK_JOBS } from "@/lib/mock-data";
import { JobCard } from "@/components/shared/job-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Card, CardContent } from "@workspace/design-system/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/design-system/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/design-system/select";
import { Link } from "wouter";
import { Bookmark, ArrowRight, Bell, Plus, Trash2 } from "lucide-react";

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

export default function CandidateSaved() {
  const savedJobs = MOCK_JOBS.filter((job) => job.status === "published").slice(0, 3);
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
        eyebrow={`${savedJobs.length} saved job${savedJobs.length === 1 ? "" : "s"} · ${activeAlertCount} active alert${activeAlertCount === 1 ? "" : "s"}`}
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
          {savedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedJobs.map((job) => (
                <JobCard key={job.id} job={job} variant="candidate" />
              ))}
            </div>
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
                  placeholder="Keywords (e.g. Product Designer)"
                  value={form.keywords}
                  onChange={(e) => setForm(f => ({ ...f, keywords: e.target.value }))}
                  className="sm:col-span-1"
                />
                <Input
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
                  <Button onClick={addAlert} size="icon" className="shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {alerts.map(alert => (
              <Card key={alert.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${alert.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{alert.keywords}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {alert.location || "Any location"} · {alert.frequency} alerts
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative shrink-0 ${alert.active ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${alert.active ? 'left-6' : 'left-1'}`} />
                  </button>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
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
