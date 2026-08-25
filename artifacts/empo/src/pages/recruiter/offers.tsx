import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { Controller, useForm } from "react-hook-form";
import { MOCK_APPLICATIONS, MOCK_CANDIDATES, type Application } from "@/lib/mock-data";
import { CardContent, CardHeader, CardTitle } from "@workspace/design-system/card";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Label } from "@workspace/design-system/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/design-system/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@workspace/design-system/dialog";
import { toast } from "@workspace/design-system/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";
import { StatusBadge } from "@/components/shared/badges";
import { Award, Users, ArrowRight, XCircle } from "lucide-react";

interface OfferDetail {
  amount: number;
  expiresAt: string;
}

interface CreateOfferForm {
  applicationId: string;
  amount: number;
  expiresAt: string;
}

function defaultExpiry() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function RecruiterOffers() {
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [offerDetails, setOfferDetails] = useState<Record<number, OfferDetail>>({
    304: { amount: 150000, expiresAt: defaultExpiry() },
  });
  const [createOpen, setCreateOpen] = useState(false);
  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateOfferForm>({
    defaultValues: { applicationId: "", amount: undefined, expiresAt: defaultExpiry() },
  });

  const offers = applications.filter((application) => application.status === "offered");

  const eligibleApplications = useMemo(
    () => applications.filter((a) => a.status !== "offered" && a.status !== "rejected" && a.status !== "withdrawn"),
    [applications]
  );

  const watchedApplicationId = watch("applicationId");
  const watchedApplication = eligibleApplications.find((a) => a.id.toString() === watchedApplicationId);

  const onCreateOffer = (data: CreateOfferForm) => {
    const applicationId = Number(data.applicationId);
    const now = new Date().toISOString();
    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId ? { ...a, status: "offered", stage: "offer", updatedAt: now } : a
      )
    );
    setOfferDetails((prev) => ({
      ...prev,
      [applicationId]: { amount: Number(data.amount), expiresAt: data.expiresAt },
    }));
    const candidateName = MOCK_CANDIDATES.find((c) => c.id === watchedApplication?.candidateId)?.name;
    toast({
      title: "Offer created",
      description: candidateName ? `Offer sent to ${candidateName}.` : "Offer sent.",
    });
    reset({ applicationId: "", amount: undefined, expiresAt: defaultExpiry() });
    setCreateOpen(false);
  };

  const withdrawOffer = (application: Application) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === application.id ? { ...a, status: "withdrawn", updatedAt: new Date().toISOString() } : a))
    );
    setOfferDetails((prev) => {
      const next = { ...prev };
      delete next[application.id];
      return next;
    });
    const candidateName = MOCK_CANDIDATES.find((c) => c.id === application.candidateId)?.name;
    toast({
      title: "Offer withdrawn",
      description: candidateName ? `Offer to ${candidateName} was withdrawn.` : "Offer withdrawn.",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Offers"
        eyebrow={`${offers.length} ACTIVE OFFER${offers.length === 1 ? "" : "S"}`}
        description="Manage all outstanding offers and candidate responses."
        actions={
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) reset({ applicationId: "", amount: undefined, expiresAt: defaultExpiry() });
            }}
          >
            <DialogTrigger asChild>
              <Button className="shadow-sm" disabled={eligibleApplications.length === 0}>
                <Award className="w-4 h-4 mr-2" /> Create Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create offer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreateOffer)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="offer-candidate">Candidate</Label>
                  <Controller
                    control={control}
                    name="applicationId"
                    rules={{ required: "Select a candidate." }}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="offer-candidate" className="w-full">
                          <SelectValue placeholder="Select a candidate" />
                        </SelectTrigger>
                        <SelectContent>
                          {eligibleApplications.map((application) => {
                            const candidate = MOCK_CANDIDATES.find((c) => c.id === application.candidateId);
                            return (
                              <SelectItem key={application.id} value={application.id.toString()}>
                                {candidate?.name ?? "Unknown candidate"} — {application.job?.title ?? "Open role"}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.applicationId && <p className="text-xs text-destructive">{errors.applicationId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer-amount">Annual salary offer (USD)</Label>
                  <Input
                    id="offer-amount"
                    type="number"
                    className="font-mono"
                    placeholder={watchedApplication?.job?.salaryMax?.toString() ?? "150000"}
                    {...register("amount", { required: true, valueAsNumber: true, min: 1 })}
                  />
                  {errors.amount && <p className="text-xs text-destructive">Enter a valid amount.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer-expires">Offer expires</Label>
                  <Input id="offer-expires" type="date" className="font-mono" {...register("expiresAt", { required: true })} />
                  {errors.expiresAt && <p className="text-xs text-destructive">Pick an expiration date.</p>}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit">Send offer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {offers.length > 0 ? (
        <div className="grid gap-4">
          {offers.map((application) => {
            const candidate = MOCK_CANDIDATES.find((c) => c.id === application.candidateId);
            const detail = offerDetails[application.id] ?? {
              amount: application.job?.salaryMax ?? 0,
              expiresAt: defaultExpiry(),
            };
            return (
              <ViewfinderCard key={application.id} className="border-border shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
                  <div>
                    <CardTitle className="text-lg font-display">{application.job?.title ?? "Open Role"}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{candidate?.name ?? "Candidate unknown"}</p>
                  </div>
                  <StatusBadge status={application.status} />
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 pt-0">
                  <div className="bg-surface-subtle rounded-xl p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Candidate</div>
                    <div className="mt-3 text-sm text-foreground">{candidate?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{candidate?.headline ?? "No headline"}</div>
                  </div>

                  <div className="bg-surface-subtle rounded-xl p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Offer Details</div>
                    <div className="mt-3 text-sm font-mono font-semibold text-foreground">
                      ${detail.amount.toLocaleString()}/yr
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      Expires {new Date(detail.expiresAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="bg-surface-subtle rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Stage</div>
                      <div className="mt-3 text-sm text-foreground capitalize">{application.stage}</div>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => withdrawOffer(application)}
                        aria-label="Withdraw offer"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                      <Link href={`/recruiter/jobs/${application.jobId}/applicants`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </ViewfinderCard>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No current offers"
          description="Once a candidate receives an offer, it will appear here."
        />
      )}
    </div>
  );
}
