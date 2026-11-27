import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Building2, BriefcaseBusiness, ShieldCheck, Sparkles, Video } from "lucide-react";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Label } from "@workspace/design-system/label";
import { Textarea } from "@workspace/design-system/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/design-system/select";
import { MaqboolWordmark } from "@/components/shared/logo";
import { useAuth } from "@/lib/auth";
import { authenticatedApiRequest } from "@/lib/authenticated-api";

const INDUSTRIES = ["Financial Services", "Technology", "Healthcare", "Education", "Retail", "Manufacturing"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const FEATURES = [
  { icon: Video, title: "Async video interviews", body: "Candidates answer on their own time, without scheduling back-and-forth." },
  { icon: Sparkles, title: "AI-assisted matching", body: "Build focused shortlists with clear, explainable signals." },
  { icon: ShieldCheck, title: "Fair, structured review", body: "Give every applicant a consistent, thoughtful evaluation." },
];
const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

type SignUpForm = {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  industry: string;
  website: string;
  logoUrl: string;
  size: string;
  location: string;
  description: string;
  culture: string;
  benefits: string;
};

const INITIAL_FORM: SignUpForm = {
  email: "",
  password: "",
  confirmPassword: "",
  companyName: "",
  industry: "",
  website: "",
  logoUrl: "",
  size: "",
  location: "",
  description: "",
  culture: "",
  benefits: "",
};

export default function RecruiterSignUpPage() {
  const { user, login, registerRecruiter, isInitializing } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  function updateField<K extends keyof SignUpForm>(key: K, value: SignUpForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.companyName.trim()) {
      setError("Enter your company name.");
      return;
    }
    if (user && user.role !== "recruiter") {
      setError("This account is not a recruiter account. Sign out and create a company account to continue.");
      return;
    }
    if (!user && !PASSWORD_RULE.test(form.password)) {
      setError("Use at least 8 characters with uppercase and lowercase letters, a number, and a special character.");
      return;
    }
    if (!user && form.password !== form.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    const email = (user?.email ?? form.email).trim().toLowerCase();
    if (user && user.email.toLowerCase() !== email) {
      setError(`You are signed in as ${user.email}. Sign out before creating an account for a different email.`);
      return;
    }

    setIsSubmitting(true);
    let accountWasCreated = accountCreated;
    let failedStep = "account creation";
    try {
      if (!user) {
        if (!accountWasCreated) {
          await registerRecruiter(email, form.password, form.companyName.trim());
          accountWasCreated = true;
          setAccountCreated(true);
        }
        failedStep = "sign-in";
        await login(email, form.password);
      }

      failedStep = "company workspace setup";
      const benefits = form.benefits
        .split(",")
        .map((benefit) => benefit.trim())
        .filter(Boolean);
      await authenticatedApiRequest<{
        registration: { id: number };
      }>("/recruiter/company-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.companyName.trim(),
          ...(form.industry ? { industry: form.industry } : {}),
          ...(form.website.trim() ? { website: form.website.trim() } : {}),
          ...(form.logoUrl.trim() ? { logoUrl: form.logoUrl.trim() } : {}),
          ...(form.size ? { size: form.size } : {}),
          ...(form.location.trim() ? { location: form.location.trim() } : {}),
          ...(form.description.trim() ? { description: form.description.trim() } : {}),
          ...(form.culture.trim() ? { culture: form.culture.trim() } : {}),
          ...(benefits.length > 0 ? { benefits } : {}),
        }),
      });

      setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
      setLocation("/recruiter/dashboard");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Please try again.";
      setError(
        failedStep === "company workspace setup"
          ? `Company workspace setup failed. ${message} You can retry without creating another account.`
          : accountWasCreated
            ? `Your account was created, but ${failedStep} failed. ${message} You can retry without creating another account.`
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-surface-bg">
      <aside className="relative hidden lg:flex lg:w-[42%] xl:w-[45%] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-[hsl(222_92%_22%)] to-[hsl(215_95%_30%)] p-12 xl:p-16 text-white">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-32 w-[36rem] h-[36rem] rounded-full bg-secondary/40 blur-[110px]" />
          <div className="absolute -bottom-48 -left-24 w-[32rem] h-[32rem] rounded-full bg-white/10 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
          />
        </div>

        <div className="relative z-10">
          <MaqboolWordmark size={30} tone="reversed" />
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/65">For hiring teams</p>
          <h1 className="mt-4 text-[42px] xl:text-[52px] font-semibold leading-[1.05] tracking-[-0.035em]">
            Build a better way to hire.
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-white/70 max-w-md">
            Create your company profile and bring your hiring team together in one focused workspace.
          </p>

          <ul className="mt-10 space-y-3">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 backdrop-blur-md"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <feature.icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-[14.5px] font-semibold">{feature.title}</p>
                  <p className="mt-0.5 text-[13px] text-white/65">{feature.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[12.5px] text-white/45">
          © {new Date().getFullYear()} Maqbool. All rights reserved.
        </p>
      </aside>

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 md:p-10">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 right-0 h-[28rem] w-[28rem] rounded-full bg-secondary/10 blur-[100px]" />
        </div>

        <div className="relative w-full max-w-[620px]">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          <div className="rounded-3xl border border-white/80 bg-white/90 p-7 shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.28),0_2px_6px_rgba(16,24,40,0.05)] backdrop-blur-xl md:p-9">
            <div className="mb-7 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">Create your company account</h2>
                <p className="mt-1 text-[14px] text-muted-foreground">Set up your company workspace and hiring profile.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              <section aria-labelledby="recruiter-details-heading" className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/70 pb-2">
                  <BriefcaseBusiness className="h-4 w-4 text-primary" />
                  <h3 id="recruiter-details-heading" className="text-sm font-semibold text-foreground">Company and account details</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="company-name">Company name</Label>
                    <Input
                      id="company-name"
                      maxLength={200}
                      placeholder="Acme Inc."
                      value={form.companyName}
                      onChange={(event) => updateField("companyName", event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="recruiter-email">Company email</Label>
                    <Input
                      id="recruiter-email"
                      type="email"
                      autoComplete="email"
                      maxLength={320}
                      placeholder="alex@company.com"
                      value={user?.email ?? form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      required
                      disabled={!!user || accountCreated}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="recruiter-password">Password</Label>
                    <Input
                      id="recruiter-password"
                      type="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      required={!user}
                      disabled={!!user || accountCreated}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="recruiter-confirm-password">Confirm password</Label>
                    <Input
                      id="recruiter-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(event) => updateField("confirmPassword", event.target.value)}
                      required={!user}
                      disabled={!!user || accountCreated}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use at least 8 characters with uppercase and lowercase letters, a number, and a special character.
                </p>
              </section>

              <section aria-labelledby="company-details-heading" className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/70 pb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 id="company-details-heading" className="text-sm font-semibold text-foreground">Company profile</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="company-industry">Industry</Label>
                    <Select value={form.industry} onValueChange={(value) => updateField("industry", value)}>
                      <SelectTrigger id="company-industry" className="w-full">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company-size">Company size</Label>
                    <Select value={form.size} onValueChange={(value) => updateField("size", value)}>
                      <SelectTrigger id="company-size" className="w-full">
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map((size) => (
                          <SelectItem key={size} value={size}>{size} employees</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company-website">Website</Label>
                    <Input
                      id="company-website"
                      type="url"
                      autoComplete="url"
                      placeholder="https://company.com"
                      value={form.website}
                      onChange={(event) => updateField("website", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company-logo-url">Logo URL</Label>
                    <Input
                      id="company-logo-url"
                      type="url"
                      placeholder="https://company.com/logo.png"
                      value={form.logoUrl}
                      onChange={(event) => updateField("logoUrl", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="company-location">Headquarters</Label>
                    <Input
                      id="company-location"
                      maxLength={255}
                      placeholder="City, Country"
                      value={form.location}
                      onChange={(event) => updateField("location", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="company-description">Company description</Label>
                    <Textarea
                      id="company-description"
                      rows={3}
                      placeholder="Tell candidates what your company does."
                      value={form.description}
                      onChange={(event) => updateField("description", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="company-culture">Culture and values</Label>
                    <Textarea
                      id="company-culture"
                      rows={2}
                      placeholder="What is it like to work at your company?"
                      value={form.culture}
                      onChange={(event) => updateField("culture", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="company-benefits">Benefits and perks</Label>
                    <Input
                      id="company-benefits"
                      placeholder="Health insurance, Flexible hours, Remote work"
                      value={form.benefits}
                      onChange={(event) => updateField("benefits", event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Separate benefits with commas.</p>
                  </div>
                </div>
              </section>

              {error && (
                <p role="alert" className="rounded-xl bg-destructive/[0.07] px-3.5 py-2.5 text-[13px] text-destructive">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isInitializing || isSubmitting}
              >
                {isInitializing
                  ? "Loading account..."
                  : isSubmitting
                    ? "Submitting..."
                    : user || accountCreated
                      ? "Create company workspace"
                      : "Create company account"}
              </Button>
              <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
                Your company workspace is ready to use as soon as you sign up.
              </p>
            </form>

            <p className="mt-5 text-center text-[13px] text-muted-foreground">
              Already have an account?{" "}
              <Link href="/" className="font-semibold text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
