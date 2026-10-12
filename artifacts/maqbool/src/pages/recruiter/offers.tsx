import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { Controller, useForm } from "react-hook-form";
import { MOCK_APPLICATIONS, MOCK_CANDIDATES, type Application } from "@/lib/mock-data";
import { CardContent } from "@workspace/design-system/card";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { motion } from "framer-motion";
import { SummaryStrip } from "@/components/shared/summary-strip";
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
import { ConfirmAction } from "@/components/shared/confirm-action";
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Offers"
        eyebrow={`${offers.length} active offer${offers.length === 1 ? "" : "s"}`}
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
              <Button disabled={eligibleApplications.length === 0}>
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
                    placeholder={watchedApplication?.job?.salaryMax?.toString() ?? "150000"}
                    {...register("amount", { required: true, valueAsNumber: true, min: 1 })}
                  />
                  {errors.amount && <p className="text-xs text-destructive">Enter a valid amount.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer-expires">Offer expires</Label>
                  <Input id="offer-expires" type="date" {...register("expiresAt", { required: true })} />
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

      {offers.length > 0 && (
        <SummaryStrip
          items={[
            { label: "Active offers", value: offers.length },
            {
              label: "Total offered",
              value: offers.reduce((n, a) => n + (offerDetails[a.id]?.amount ?? a.job?.salaryMax ?? 0), 0),
              format: (n) => `$${(n / 1000).toLocaleString()}k`,
            },
            {
              label: "Expiring in 3 days",
              value: offers.filter((a) => {
                const d = offerDetails[a.id]?.expiresAt ?? defaultExpiry();
                return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000) <= 3;
              }).length,
            },
          ]}
        />
      )}

      {offers.length > 0 ? (
        <div className="grid gap-3">
          {offers.map((application) => {
            const candidate = MOCK_CANDIDATES.find((c) => c.id === application.candidateId);
            const detail = offerDetails[application.id] ?? {
              amount: application.job?.salaryMax ?? 0,
              expiresAt: defaultExpiry(),
            };
            const daysLeft = Math.ceil((new Date(detail.expiresAt).getTime() - Date.now()) / 86_400_000);
            const urgent = daysLeft <= 3;
            return (
              <ViewfinderCard key={application.id}>
                <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center gap-5">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <Avatar className="w-12 h-12 ring-2 ring-white shadow-[0_0_0_1px_hsl(var(--border))]">
                      <AvatarImage src={candidate?.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                        {(candidate?.name ?? "?").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-semibold tracking-[-0.01em] truncate">{candidate?.name ?? "Candidate unknown"}</h3>
                      <p className="text-[13px] text-muted-foreground truncate">{application.job?.title ?? "Open role"}</p>
                    </div>
                  </div>

                  <div className="lg:w-44">
                    <p className="text-[11.5px] font-medium text-muted-foreground">Offered</p>
                    <p className="text-[22px] font-semibold tracking-[-0.02em] tabular-nums leading-tight">
                      ${detail.amount.toLocaleString()}
                      <span className="text-[12.5px] font-medium text-muted-foreground">/yr</span>
                    </p>
                  </div>

                  <div className="lg:w-48">
                    <div className="flex items-center justify-between text-[12.5px]">
                      <span className="text-muted-foreground">Expires {new Date(detail.expiresAt).toLocaleDateString()}</span>
                      <span className={urgent ? "font-semibold text-warning" : "font-medium text-foreground"}>
                        {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={urgent ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-gradient-to-r from-primary to-secondary"}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(6, Math.min(100, (daysLeft / 14) * 100))}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0">
                    <StatusBadge status={application.status} />
                    <ConfirmAction
                      title="Withdraw this offer?"
                      description="The candidate will be notified and the offer details will be discarded. This can't be undone."
                      confirmLabel="Withdraw offer"
                      onConfirm={() => withdrawOffer(application)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        aria-label="Withdraw offer"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </ConfirmAction>
                    <Link href={`/recruiter/jobs/${application.jobId}/applicants`}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        Applicants <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
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
