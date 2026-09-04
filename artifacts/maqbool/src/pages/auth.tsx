import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Label } from "@workspace/design-system/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/design-system/tabs";
import { MOCK_USERS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Building2, Check, UserCircle } from "lucide-react";
import { cn } from "@workspace/design-system/utils";
import { Waveform } from "@/components/shared/waveform";
import { MaqboolWordmark } from "@/components/shared/logo";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { signIn } = useAuth();
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [isLoading, setIsLoading] = useState(false);
  const heroWave = useMemo(
    () => Array.from({ length: 64 }, (_, i) => 0.15 + 0.75 * Math.abs(Math.sin(i * 0.4) * Math.cos(i * 0.17)),),
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const email = (e.currentTarget as HTMLFormElement).email?.value
      || (role === "recruiter" ? MOCK_USERS.recruiter.email : MOCK_USERS.candidate.email);
    // Simulate network request
    setTimeout(() => {
      signIn(email, role);
      if (role === "recruiter") {
        setLocation("/recruiter/dashboard");
      } else {
        setLocation("/candidate/dashboard");
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-surface-bg">
      {/* Left side - Branding/Hero */}
      <div className="hidden md:flex md:w-1/2 lg:w-[54%] bg-primary flex-col justify-between p-12 lg:p-16 text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center">
          <MaqboolWordmark size={30} tone="reversed" />
        </div>

        <div className="relative z-10 max-w-lg mt-auto mb-auto">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-[40px] lg:text-[48px] font-semibold leading-[1.08] tracking-[-0.03em] mb-6"
          >
            Hiring, heard clearly.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="text-white/70 text-[17px] leading-relaxed max-w-md"
          >
            Async video interviews and AI-assisted matching, built so every conversation gets a fair, focused read.
          </motion.p>
        </div>

        {/* The product's own waveform motif, quiet and structural rather than decorative filler. */}
        <div className="relative z-10 h-12">
          <Waveform variant="sparkline" values={heroWave} barClassName="bg-white/25" />
        </div>
        <div className="relative z-10 text-[13px] text-white/50 mt-4">
          © {new Date().getFullYear()} Maqbool. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-[400px]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <div className="mb-7 text-center">
              <h2 className="text-[22px] font-semibold text-foreground mb-1.5 tracking-[-0.01em]">Welcome to Maqbool</h2>
              <p className="text-muted-foreground text-[13.5px]">Sign in to your account to continue</p>
            </div>

            <div className="mb-7">
              <Label className="text-[12.5px] font-medium text-muted-foreground mb-2.5 block">
                I am a
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole("candidate")}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-colors duration-150",
                    role === "candidate"
                      ? "border-primary/30 bg-primary/[0.06] text-primary"
                      : "border-border text-muted-foreground hover:bg-foreground/[0.03]"
                  )}
                  data-testid="role-candidate"
                >
                  {role === "candidate" && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                  <UserCircle className="w-5 h-5" strokeWidth={1.75} />
                  <span className="font-medium text-[13.5px]">Candidate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("recruiter")}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-colors duration-150",
                    role === "recruiter"
                      ? "border-primary/30 bg-primary/[0.06] text-primary"
                      : "border-border text-muted-foreground hover:bg-foreground/[0.03]"
                  )}
                  data-testid="role-recruiter"
                >
                  {role === "recruiter" && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                  <Building2 className="w-5 h-5" strokeWidth={1.75} />
                  <span className="font-medium text-[13.5px]">Recruiter</span>
                </button>
              </div>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 outline-none">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={role === "recruiter" ? "sarah.jenkins@stratos.com" : "alex.rivera@example.com"}
                      defaultValue={role === "recruiter" ? MOCK_USERS.recruiter.email : MOCK_USERS.candidate.email}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a href="#" className="text-[12.5px] text-primary font-medium hover:underline">Forgot password?</a>
                    </div>
                    <Input id="password" type="password" defaultValue="password123" required />
                  </div>
                  <Button type="submit" size="lg" className="w-full mt-2" disabled={isLoading}>
                    {isLoading ? "Signing in…" : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 outline-none">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" type="text" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="john@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" required />
                  </div>
                  <Button type="submit" size="lg" className="w-full mt-2" disabled={isLoading}>
                    {isLoading ? "Creating account…" : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
