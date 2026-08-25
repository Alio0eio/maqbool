import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@workspace/design-system/button";
import { Input } from "@workspace/design-system/input";
import { Label } from "@workspace/design-system/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/design-system/tabs";
import { MOCK_USERS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { Building2, UserCircle } from "lucide-react";
import { cn } from "@workspace/design-system/utils";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { signIn } = useAuth();
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Left side - Branding/Hero */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-primary flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full border-[40px] border-white blur-md" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full border-[60px] border-white blur-xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-white text-primary flex items-center justify-center font-bold text-2xl shadow-lg">
            E
          </div>
          <span className="font-bold text-2xl tracking-tight">EMPO</span>
        </div>

        <div className="relative z-10 max-w-lg mt-auto mb-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl lg:text-5xl font-bold leading-tight mb-6"
          >
            The precision instrument for modern recruitment.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-blue-100 text-lg md:text-xl font-light leading-relaxed max-w-md"
          >
            Connect top talent with high-trust organizations using AI-powered matching and streamlined workflows.
          </motion.p>
        </div>

        <div className="relative z-10 text-sm text-blue-200/80">
          © {new Date().getFullYear()} EMPO Platform. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <div className="w-full max-w-[400px]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-xl border border-border p-8"
          >
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to EMPO</h2>
              <p className="text-muted-foreground text-sm">Sign in to your account to continue</p>
            </div>

            <div className="mb-8">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3 block">
                I am a
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("candidate")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                    role === "candidate" 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-border bg-white text-muted-foreground hover:bg-surface-subtle hover:border-muted-foreground/30"
                  )}
                  data-testid="role-candidate"
                >
                  <UserCircle className="w-6 h-6 mb-2" />
                  <span className="font-medium text-sm">Candidate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("recruiter")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                    role === "recruiter" 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-border bg-white text-muted-foreground hover:bg-surface-subtle hover:border-muted-foreground/30"
                  )}
                  data-testid="role-recruiter"
                >
                  <Building2 className="w-6 h-6 mb-2" />
                  <span className="font-medium text-sm">Recruiter</span>
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
                      <a href="#" className="text-xs text-primary font-medium hover:underline">Forgot password?</a>
                    </div>
                    <Input id="password" type="password" defaultValue="password123" required />
                  </div>
                  <Button type="submit" className="w-full mt-2 h-11 text-base font-medium shadow-sm hover-elevate" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
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
                  <Button type="submit" className="w-full mt-2 h-11 text-base font-medium shadow-sm hover-elevate" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
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
