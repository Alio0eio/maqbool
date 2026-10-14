import React from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@workspace/design-system/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { Button } from "@workspace/design-system/button";
import { ScrollArea } from "@workspace/design-system/scroll-area";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@workspace/design-system/sheet";
import { useIsMobile } from "@workspace/design-system/hooks/use-mobile";
import { Bell, LogOut, ChevronDown, UserCircle, Menu, Pin, PinOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { CommandPalette } from "@/components/shared/command-palette";
import { MaqboolRollingLogo, MaqboolWordmark } from "@/components/shared/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/design-system/dropdown-menu";

export interface AppNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Custom active-match, for items whose route has sub-pages. Defaults to exact match. */
  match?: (location: string) => boolean;
}

export interface AppNavGroup {
  /** Optional small caption above the group, e.g. "Workspace". Omit for the primary group. */
  label?: string;
  items: AppNavItem[];
}

interface AppShellProps {
  children: React.ReactNode;
  navGroups: AppNavGroup[];
  /** Shown under the user's name in the sidebar footer, e.g. "Candidate" or a company name. */
  roleLabel: string;
  profileHref: string;
  notificationsHref: string;
  unreadNotifications?: number;
  /** Rendered in the header's left region — typically a search field. */
  headerLeft?: React.ReactNode;
  /** Rendered under the brand mark, above the nav — e.g. a primary CTA. */
  sidebarExtra?: React.ReactNode;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

// Routes whose last path segment is an in-page wizard "step" rather than a
// distinct destination — ApplyFlow and CreateJobFlow hold local form state
// (typed answers, uploaded resume, draft copy) across their `:step` param,
// so the outer page transition must not remount them between steps. Their
// own step content animates separately (see StepTransition).
const WIZARD_STEP_ROUTES = [/^\/candidate\/apply\/\d+\//, /^\/recruiter\/jobs\/new\//];

function transitionKey(location: string) {
  const isWizardStep = WIZARD_STEP_ROUTES.some((re) => re.test(location));
  return isWizardStep ? location.replace(/\/[^/]+$/, "") : location;
}

// Rail widths. <main>'s marginLeft is derived from these (+ RAIL_GUTTER), so
// the content is pushed aside, never covered, as the rail expands.
const RAIL_COLLAPSED_W = 68;
const RAIL_EXPANDED_W = 256;
// Rail sits 12px from the window edge, with a 12px gap before the content.
const RAIL_GUTTER = 24;
const PIN_STORAGE_KEY = "maqbool_sidebar_pinned";

/** Label/caption that reveals via width+opacity as the rail expands, without ever moving the icon beside it. */
function RevealLabel({ expanded, className, children }: { expanded: boolean; className?: string; children: React.ReactNode }) {
  return (
    <motion.span
      className={cn("overflow-hidden whitespace-nowrap block", className)}
      animate={{ width: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
      transition={expanded ? { duration: 0.15, ease: "easeOut" } : { duration: 0.1 }}
    >
      {children}
    </motion.span>
  );
}

function NavItemRow({
  item,
  isActive,
  expanded,
  onNavigate,
}: {
  item: AppNavItem;
  isActive: boolean;
  expanded: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link href={item.href} aria-current={isActive ? "page" : undefined} className="outline-none block rounded-[9px] focus-visible:ring-2 focus-visible:ring-ring/50" onClick={onNavigate}>
          <motion.span
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            className={cn(
              "group/nav relative flex items-center h-10 rounded-[11px] text-[13px] font-medium transition-[background-color,color,width,margin] duration-150",
              expanded ? "w-full gap-3 px-3" : "w-10 mx-auto justify-center",
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`nav-active-${expanded ? "open" : "rail"}`}
                aria-hidden
                className="absolute inset-0 rounded-[11px] bg-gradient-to-br from-primary to-[hsl(222_80%_32%)] shadow-[0_6px_16px_-4px_hsl(var(--primary)/0.55)]"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
            <item.icon
              className="relative w-[17px] h-[17px] shrink-0 transition-transform duration-200 group-hover/nav:scale-110"
              strokeWidth={2}
            />
            <RevealLabel expanded={expanded} className="relative">{item.label}</RevealLabel>
          </motion.span>
        </Link>
  );
}

function NavGroups({
  navGroups,
  location,
  expanded,
  onNavigate,
}: {
  navGroups: AppNavGroup[];
  location: string;
  expanded: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Primary" className="space-y-5 py-1">
      {navGroups.map((group, gi) => (
        <div key={gi} className="space-y-0.5">
          {expanded && group.label && (
            <p className="px-3 pb-1 text-[11px] font-medium text-muted-foreground/80">{group.label}</p>
          )}
          {group.items.map((item) => {
            const isActive = item.match ? item.match(location) : location === item.href;
            return (
              <NavItemRow key={item.href} item={item} isActive={isActive} expanded={expanded} onNavigate={onNavigate} />
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand({
  brandHref,
  expanded,
  showPin,
  isPinned,
  onTogglePin,
  onNavigate,
  size = 26,
}: {
  brandHref: string;
  /** Whether to render the compact mark or the full wordmark. Defaults to
   *  `showPin` (always-expanded contexts, e.g. the mobile drawer, never pass
   *  this and stay on the wordmark). */
  expanded?: boolean;
  showPin: boolean;
  isPinned: boolean;
  onTogglePin?: () => void;
  onNavigate?: () => void;
  size?: number;
}) {
  const isExpanded = expanded ?? true;
  return (
    <div className="h-16 flex items-center justify-between px-5 shrink-0">
      <Link
        href={brandHref}
        aria-label="Maqbool home"
        className="flex items-center outline-none transition-transform duration-200 ease-out hover:scale-[1.02] shrink-0"
        onClick={onNavigate}
      >
        <span className="sr-only">Maqbool</span>
        <MaqboolRollingLogo size={size} expanded={isExpanded} />
      </Link>
      {showPin && onTogglePin && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
          aria-pressed={isPinned}
          aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar expanded"}
          onClick={onTogglePin}
        >
          {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </Button>
      )}
    </div>
  );
}

function SidebarFooter({
  expanded,
  userName,
  avatarUrl,
  roleLabel,
  profileHref,
  onLogout,
  onNavigate,
}: {
  expanded: boolean;
  userName: string;
  avatarUrl?: string | null;
  roleLabel: string;
  profileHref: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="p-3 shrink-0">
      <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-[10px] p-2 hover:bg-foreground/[0.045] transition-colors duration-150 outline-none text-left">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials(userName)}
                  </AvatarFallback>
                </Avatar>
                <RevealLabel expanded={expanded} className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate leading-tight">{userName}</p>
                  <p className="text-[11px] text-muted-foreground truncate leading-tight mt-px">{roleLabel}</p>
                </RevealLabel>
                {expanded && <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
              </button>
            </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56">
          <DropdownMenuItem asChild>
            <Link href={profileHref} className="flex items-center gap-2 cursor-pointer" onClick={onNavigate}>
              <UserCircle className="w-4 h-4" /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onLogout}
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function AppShell({
  children,
  navGroups,
  roleLabel,
  profileHref,
  notificationsHref,
  unreadNotifications = 0,
  headerLeft,
  sidebarExtra,
}: AppShellProps) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  const [isPinned, setIsPinned] = React.useState(() => {
    try {
      return localStorage.getItem(PIN_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [isHovering, setIsHovering] = React.useState(false);
  const [isFocusWithin, setIsFocusWithin] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Tracks whether the most recent input was a Tab key press, as opposed to a
  // pointer interaction. Used to keep the rail open for keyboard navigation
  // without it getting stuck open by mouse-driven focus — e.g. Radix's
  // DropdownMenu restores focus to its trigger (inside the rail) once the
  // profile menu closes, which would otherwise pin the rail expanded even
  // after the mouse has moved away, since nothing else blurs that button.
  // Native `:focus-visible` doesn't reliably distinguish this case because
  // Radix's restore happens on a deferred tick, outside the click handler.
  const usingKeyboardRef = React.useRef(false);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") usingKeyboardRef.current = true;
    };
    const onPointerDown = () => {
      usingKeyboardRef.current = false;
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  const isExpanded = isPinned || isHovering || isFocusWithin;

  // Because expanding pushes the page content, hover is debounced: a pointer
  // that merely crosses the rail on its way elsewhere must not shove the
  // layout around.
  const hoverTimerRef = React.useRef<number | undefined>(undefined);
  const scheduleHover = (next: boolean) => {
    window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => setIsHovering(next), next ? 140 : 180);
  };
  React.useEffect(() => () => window.clearTimeout(hoverTimerRef.current), []);

  // SPA route changes don't reset focus or the document title the way a full
  // page load does — without this, keyboard and screen-reader users stay
  // parked on the link they just activated and the tab title never changes.
  const mainRef = React.useRef<HTMLElement>(null);
  const firstRenderRef = React.useRef(true);
  const routeKey = transitionKey(location);
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const heading = mainRef.current?.querySelector("h1")?.textContent?.trim();
      document.title = heading ? `${heading} · Maqbool` : "Maqbool";
      if (firstRenderRef.current) {
        firstRenderRef.current = false;
        return;
      }
      mainRef.current?.focus({ preventScroll: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [routeKey]);

  if (!user) return null;

  const handleLogout = () => {
    signOut();
    setLocation("/");
  };

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PIN_STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const brandHref = navGroups[0]?.items[0]?.href ?? "/";
  const widthTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, bounce: 0, duration: 0.32 };

  return (
    <div className="relative flex h-screen w-full bg-surface-bg overflow-hidden font-sans text-foreground">
      <div aria-hidden className="app-aurora" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <CommandPalette />

      {/* Desktop: hover-expand icon rail, overlays content rather than pushing it */}
      {!isMobile && (
        <motion.aside
          onMouseEnter={() => scheduleHover(true)}
          onMouseLeave={() => scheduleHover(false)}
          onFocus={() => {
            if (usingKeyboardRef.current) setIsFocusWithin(true);
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFocusWithin(false);
          }}
          animate={{ width: isExpanded ? RAIL_EXPANDED_W : RAIL_COLLAPSED_W }}
          transition={widthTransition}
          className={cn(
            "fixed left-3 top-3 bottom-3 flex flex-col rounded-[22px] border border-white/70 bg-white/80 backdrop-blur-2xl z-30 overflow-hidden",
            "shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_10px_30px_-12px_hsl(var(--primary)/0.25),0_2px_6px_-2px_hsl(var(--primary)/0.08)]",
            isExpanded && "shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_24px_60px_-16px_hsl(var(--primary)/0.35)]",
          )}
        >
          <SidebarBrand
            brandHref={brandHref}
            expanded={isExpanded}
            showPin={isExpanded}
            isPinned={isPinned}
            onTogglePin={togglePin}
          />

          {isExpanded && sidebarExtra && <div className="px-4 pb-3 shrink-0">{sidebarExtra}</div>}

          <ScrollArea className="flex-1 px-3">
            <NavGroups navGroups={navGroups} location={location} expanded={isExpanded} />
          </ScrollArea>

          <SidebarFooter
            expanded={isExpanded}
            userName={user.name}
            avatarUrl={user.avatarUrl}
            roleLabel={roleLabel}
            profileHref={profileHref}
            onLogout={handleLogout}
          />
        </motion.aside>
      )}

      {/* Mobile: hamburger-triggered slide-over drawer */}
      {isMobile && (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-72 p-0 flex flex-col gap-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">App navigation menu</SheetDescription>
            <SidebarBrand
              brandHref={brandHref}
              showPin={false}
              isPinned={false}
              onNavigate={() => setMobileNavOpen(false)}
            />
            {sidebarExtra && <div className="px-4 pb-3 shrink-0">{sidebarExtra}</div>}
            <ScrollArea className="flex-1 px-3">
              <NavGroups
                navGroups={navGroups}
                location={location}
                expanded
                onNavigate={() => setMobileNavOpen(false)}
              />
            </ScrollArea>
            <SidebarFooter
              expanded
              userName={user.name}
              avatarUrl={user.avatarUrl}
              roleLabel={roleLabel}
              profileHref={profileHref}
              onLogout={handleLogout}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Main */}
      <motion.main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col min-w-0 min-h-0 outline-none"
        initial={false}
        animate={{ marginLeft: isMobile ? 0 : (isExpanded ? RAIL_EXPANDED_W : RAIL_COLLAPSED_W) + RAIL_GUTTER }}
        transition={widthTransition}
      >
        <header className="app-translucent-header h-16 flex items-center justify-between gap-4 px-6 md:px-8 shrink-0 sticky top-0 z-10 bg-surface-bg/70 backdrop-blur-xl [-webkit-backdrop-filter:blur(20px)]">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            {isMobile && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Open navigation"
                  onClick={() => setMobileNavOpen(true)}
                >
                  <Menu className="w-[18px] h-[18px]" />
                </Button>
                <Link href={brandHref} aria-label="Maqbool home" className="shrink-0 flex items-center outline-none">
                  <MaqboolWordmark size={22} />
                </Link>
              </>
            )}
            {headerLeft}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative rounded-full text-muted-foreground hover:text-foreground"
            >
              <Link
                href={notificationsHref}
                aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : "Notifications"}
              >
                <Bell className="w-[18px] h-[18px]" aria-hidden />
                {unreadNotifications > 0 && (
                  <span aria-hidden className="absolute top-2 right-2 w-[7px] h-[7px] bg-destructive rounded-full ring-2 ring-white" />
                )}
              </Link>
            </Button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={transitionKey(location)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", bounce: 0, duration: 0.32 }}
              className="page-stagger relative z-[1] px-6 md:px-8 py-8 max-w-[1280px] mx-auto min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
}
