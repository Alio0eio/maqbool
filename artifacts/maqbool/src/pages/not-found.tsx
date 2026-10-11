import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@workspace/design-system/button";
import { Compass } from "lucide-react";
import { MaqboolWordmark } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-surface-bg px-6 overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-24 w-[30rem] h-[30rem] rounded-full bg-secondary/15 blur-[100px] float-slower" />
        <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-[100px] float-slow" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md text-center"
      >
        <div className="flex justify-center mb-10"><MaqboolWordmark size={26} /></div>
        <p className="text-[96px] leading-none font-semibold tracking-[-0.06em] bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
          404
        </p>
        <div className="w-12 h-12 rounded-2xl bg-white border border-border/70 shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.35)] flex items-center justify-center text-primary mx-auto my-6 float-slow">
          <Compass className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <h1 className="text-[22px] font-semibold text-foreground tracking-[-0.02em] mb-2">Page not found</h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-8">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>Go back</Button>
          <Link href="/">
            <Button>Back to home</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
