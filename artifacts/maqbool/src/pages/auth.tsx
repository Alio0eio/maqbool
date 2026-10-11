import React, { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Check, Eye, EyeOff, ShieldCheck, Sparkles, UserCircle, Video } from "lucide-react";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Label } from "@workspace/design-system/label";
import { cn } from "@workspace/design-system/utils";
import { useAuth } from "@/lib/auth";
import { MaqboolWordmark } from "@/components/shared/logo";
import { Spinner } from "@/components/shared/spinner";
import { CountUp } from "@/components/shared/count-up";

type Role = "candidate" | "recruiter";
type Mode = "signin" | "signup";

const FEATURES = [
  { icon: Video, title: "Async video interviews", body: "Candidates answer on their own time. No scheduling back-and-forth." },
  { icon: Sparkles, title: "AI-assisted matching", body: "Ranked shortlists with the reasoning shown, not hidden." },
  { icon: ShieldCheck, title: "Fair, focused review", body: "Every response gets the same structured read." },
];

const STATS = [
  { value: 68, suffix: "%", label: "faster screening" },
  { value: 94, suffix: "%", label: "completion rate" },
  { value: 12, suffix: "k", label: "interviews run" },
];

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) score++;
  return score; // 0-4
}
const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_RULE_MESSAGE = "Use at least 8 characters with uppercase and lowercase letters, a number, and a special character.";
const STRENGTH_LABEL = ["Too short", "Weak", "Okay", "Good", "Strong"];

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login, register } = useAuth();
  const [role, setRole] = useState<Role>("candidate");
  const [mode, setMode] = useState<Mode>("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupPassword, setSignupPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const submitting = useRef(false);
  const heroWave = useMemo(
    () => Array.from({ length: 56 }, (_, i) => 0.15 + 0.75 * Math.abs(Math.sin(i * 0.4) * Math.cos(i * 0.17))),
    [],
  );
  const strength = passwordStrength(signupPassword);

  const errorMessage = (cause: unknown, fallback: string) =>
    cause instanceof TypeError
      ? "Unable to connect to the server. Check your connection and try again."
      : cause instanceof Error
        ? cause.message
        : fallback;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting.current) return;
    setError(null);
    setNotice(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (mode === "signup") {
      if (role !== "candidate") {
        setError("Recruiter accounts cannot be created through this registration form. Choose Candidate to sign up.");
        return;
      }
      if (!PASSWORD_RULE.test(password)) {
        setError(PASSWORD_RULE_MESSAGE);
        return;
      }
    }

    submitting.current = true;
    setIsLoading(true);
    try {
      if (mode === "signup") {
        const name = String(formData.get("name") ?? "").trim();
        await register(email, password, name);
        setRegisteredEmail(email);
        setSignupPassword("");
        setNotice("Your candidate account was created. Sign in with your email and password to continue.");
        setMode("signin");
      } else {
        const user = await login(email, password);
        setLocation(
          user.role === "recruiter" ? "/recruiter/dashboard" : user.role === "candidate" ? "/candidate/dashboard" : "/",
        );
      }
    } catch (cause) {
      setError(errorMessage(cause, mode === "signup" ? "Sign up failed. Please try again." : "Sign in failed. Please try again."));
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  };

  const roleOptions: { value: Role; label: string; hint: string; icon: React.ElementType }[] = [
    { value: "candidate", label: "Candidate", hint: "Find and apply to roles", icon: UserCircle },
    { value: "recruiter", label: "Recruiter", hint: "Hire with your team", icon: Building2 },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-surface-bg">
      {/* Brand / story panel */}
      <aside className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-[hsl(222_92%_22%)] to-[hsl(215_95%_30%)] p-12 xl:p-16 text-white">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-32 w-[36rem] h-[36rem] rounded-full bg-secondary/40 blur-[110px] float-slower" />
          <div className="absolute -bottom-48 -left-24 w-[32rem] h-[32rem] rounded-full bg-brand-steel-reversed/20 blur-[110px] float-slow" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
          />
        </div>

        <div className="relative z-10">
          <MaqboolWordmark size={30} tone="reversed" />
        </div>

        <div className="relative z-10 max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-[44px] xl:text-[54px] font-semibold leading-[1.05] tracking-[-0.035em]"
          >
            Hiring, heard clearly.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-[17px] leading-relaxed text-white/70 max-w-md"
          >
            Async video interviews and AI-assisted matching, built so every conversation gets a fair, focused read.
          </motion.p>

          <ul className="mt-10 space-y-3">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f.title}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-md px-4 py-3.5 transition-colors hover:bg-white/[0.1]"
              >
                <span className="mt-0.5 w-9 h-9 shrink-0 rounded-xl bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <f.icon className="w-[18px] h-[18px]" />
                </span>
                <div>
                  <p className="text-[14.5px] font-semibold">{f.title}</p>
                  <p className="text-[13px] text-white/65 mt-0.5">{f.body}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-6 max-w-md mb-8">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-[30px] font-semibold tracking-[-0.03em] leading-none">
                  <CountUp value={s.value} duration={1.4} />
                  {s.suffix}
                </p>
                <p className="text-[12.5px] text-white/60 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="h-10" aria-hidden>
            <div className="flex items-end gap-[3px] h-full">
              {heroWave.map((v, i) => (
                <span
                  key={i}
                  className="wave-bar flex-1 rounded-full bg-white/25"
                  style={{ height: `${v * 100}%`, animationDelay: `${i * 55}ms` }}
                />
              ))}
            </div>
          </div>
          <p className="text-[12.5px] text-white/45 mt-4">© {new Date().getFullYear()} Maqbool. All rights reserved.</p>
        </div>
      </aside>

      {/* Form */}
      <main className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 right-0 w-[28rem] h-[28rem] rounded-full bg-secondary/10 blur-[100px]" />
        </div>

        <div className="lg:hidden mb-8 relative">
          <MaqboolWordmark size={28} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[420px]"
        >
          <div className="rounded-3xl border border-white/80 bg-white/90 backdrop-blur-xl shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35),0_2px_6px_rgba(16,24,40,0.05)] p-8">
            <div className="mb-6">
              <h2 className="text-[24px] font-semibold text-foreground tracking-[-0.02em]">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-muted-foreground text-[14px] mt-1">
                {mode === "signin" ? "Sign in to pick up where you left off." : "It takes less than a minute."}
              </p>
            </div>

            {/* Role */}
            <div role="radiogroup" aria-label="I am a" className="grid grid-cols-2 gap-2.5 mb-6">
              {roleOptions.map((o) => {
                const active = role === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-testid={`role-${o.value}`}
                    onClick={() => setRole(o.value)}
                    className={cn(
                      "relative flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      active ? "border-transparent text-primary" : "border-border/70 text-muted-foreground hover:bg-foreground/[0.03]",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="role-ring"
                        aria-hidden
                        className="absolute inset-0 rounded-2xl border-2 border-primary/50 bg-primary/[0.05] shadow-[0_10px_24px_-14px_hsl(var(--primary)/0.6)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative flex items-center justify-between w-full">
                      <o.icon className="w-5 h-5" strokeWidth={1.75} />
                      {active && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center"
                        >
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </motion.span>
                      )}
                    </span>
                    <span className="relative text-[14px] font-semibold text-foreground">{o.label}</span>
                    <span className="relative text-[12px] text-muted-foreground leading-snug">{o.hint}</span>
                  </button>
                );
              })}
            </div>

            {/* Mode */}
            <div role="tablist" aria-label="Sign in or sign up" className="grid grid-cols-2 rounded-full bg-muted/80 p-1 mb-6">
              {(["signin", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    setNotice(null);
                  }}
                  className={cn(
                    "relative rounded-full py-2 text-[13.5px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="auth-mode"
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-background shadow-[0_1px_3px_hsl(var(--foreground)/0.12),0_4px_10px_-4px_hsl(var(--foreground)/0.12)]"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative">{m === "signin" ? "Sign in" : "Sign up"}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-4"
                >
                  {mode === "signup" && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full name</Label>
                      <Input id="signup-name" name="name" type="text" autoComplete="name" placeholder="Alex Rivera" maxLength={200} required />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={role === "recruiter" ? "sarah.jenkins@stratos.com" : "alex.rivera@example.com"}
                      defaultValue={mode === "signin" ? registeredEmail : ""}
                      key={`${mode}-${role}`}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === "signin" && (
                        <a href="#" className="text-[12.5px] text-primary font-medium hover:underline">
                          Forgot password?
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        onChange={mode === "signup" ? (e) => setSignupPassword(e.target.value) : undefined}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {mode === "signup" && (
                      <div aria-live="polite">
                        <div className="flex gap-1.5 mt-2">
                          {[0, 1, 2, 3].map((i) => (
                            <span
                              key={i}
                              className={cn(
                                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                                i < strength ? (strength <= 1 ? "bg-destructive" : strength === 2 ? "bg-warning" : "bg-success") : "bg-muted",
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-1.5">
                          {signupPassword ? STRENGTH_LABEL[strength] : "Use 8+ characters with letters and numbers."}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {notice && (
                <p role="status" className="rounded-xl bg-primary/[0.07] text-primary text-[13px] px-3.5 py-2.5">
                  {notice}
                </p>
              )}

              {error && (
                <p role="alert" className="rounded-xl bg-destructive/[0.07] text-destructive text-[13px] px-3.5 py-2.5">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full mt-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className="w-4 h-4" /> {mode === "signin" ? "Signing in…" : "Creating account…"}
                  </>
                ) : mode === "signin" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

          </div>
        </motion.div>
      </main>
    </div>
  );
}
