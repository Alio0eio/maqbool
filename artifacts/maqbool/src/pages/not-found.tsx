import { Link } from "wouter";
import { Button } from "@workspace/design-system/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-bg px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-primary/[0.08] flex items-center justify-center text-primary mx-auto mb-6">
          <Compass className="w-6 h-6" strokeWidth={1.75} />
        </div>
        <h1 className="text-[22px] font-semibold text-foreground tracking-[-0.01em] mb-2">Page not found</h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-7">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
