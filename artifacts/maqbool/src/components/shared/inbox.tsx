import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, MessageSquare, Search, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/design-system/avatar";
import { Button } from "@workspace/design-system/button";
import { Textarea } from "@workspace/design-system/textarea";
import { cn } from "@workspace/design-system/utils";
import { useAuth } from "@/lib/auth";
import { getConversationsFor, otherParticipant, type MockConversation } from "@/lib/mock-data";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

function shortTime(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface InboxProps {
  description: string;
  emptyDescription: string;
}

/** Two-pane inbox shared by recruiters and candidates: conversation list on
 *  the left, the open thread on the right (a full-screen thread on mobile). */
export function Inbox({ description, emptyDescription }: InboxProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<MockConversation[]>(() => getConversationsFor(user?.id));
  const [openId, setOpenId] = useState<number | null>(() => conversations[0]?.id ?? null);
  const [mobileThread, setMobileThread] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const open = conversations.find((c) => c.id === openId) ?? null;
  const unread = conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        otherParticipant(c, user?.id).name.toLowerCase().includes(q) ||
        c.lastMessage?.content.toLowerCase().includes(q),
    );
  }, [conversations, query, user?.id]);

  // On desktop the default thread is already on screen, so it counts as read.
  useEffect(() => {
    if (openId === null || !window.matchMedia("(min-width: 1024px)").matches) return;
    setConversations((prev) => prev.map((c) => (c.id === openId && c.unreadCount ? { ...c, unreadCount: 0 } : c)));
  }, [openId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [openId, open?.messages.length]);

  function select(id: number) {
    setOpenId(id);
    setMobileThread(true);
    // Opening a thread reads it.
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
  }

  function send() {
    if (!open || !draft.trim() || !user) return;
    const message = {
      id: Date.now(),
      conversationId: open.id,
      senderId: user.id,
      sender: user,
      content: draft.trim(),
      read: true,
      createdAt: new Date().toISOString(),
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === open.id ? { ...c, messages: [...c.messages, message], lastMessage: message } : c)),
    );
    setDraft("");
  }

  const other = open ? otherParticipant(open, user?.id) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        eyebrow={`${conversations.length} conversation${conversations.length === 1 ? "" : "s"} · ${unread} unread`}
        description={description}
      />

      {conversations.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No conversations yet" description={emptyDescription} />
      ) : (
        <div className="grid lg:grid-cols-[340px_1fr] rounded-3xl border border-border/70 bg-white/80 backdrop-blur-sm shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.2)] overflow-hidden h-[calc(100vh-18rem)] min-h-[460px]">
          {/* List */}
          <div className={cn("flex flex-col min-h-0 border-r border-border/60", mobileThread && "hidden lg:flex")}>
            <div className="p-3 border-b border-border/60">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  aria-label="Search conversations"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search conversations"
                  className="w-full h-10 pl-9 pr-3 rounded-full bg-muted/70 text-[13.5px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:bg-white transition"
                />
              </div>
            </div>
            <ul className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {visible.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">No matches</li>}
              {visible.map((c) => {
                const o = otherParticipant(c, user?.id);
                const active = c.id === openId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => select(c.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "w-full flex items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                        active ? "bg-primary/[0.07]" : "hover:bg-foreground/[0.035]",
                      )}
                    >
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={(o as { avatarUrl?: string | null }).avatarUrl ?? undefined} alt="" />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-[13px] font-semibold">
                          {initials(o.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate text-[14px]", c.unreadCount ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                            {o.name}
                          </span>
                          <span className="shrink-0 text-[11.5px] text-muted-foreground tabular-nums">
                            {shortTime(c.lastMessage?.createdAt ?? c.createdAt)}
                          </span>
                        </div>
                        <p className={cn("truncate text-[13px] mt-0.5", c.unreadCount ? "text-foreground/80" : "text-muted-foreground")}>
                          {c.lastMessage?.content}
                        </p>
                        {c.relatedJobTitle && (
                          <p className="truncate text-[11.5px] text-muted-foreground/80 mt-0.5">Re: {c.relatedJobTitle}</p>
                        )}
                      </div>
                      {!!c.unreadCount && (
                        <span className="mt-1 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Thread */}
          <div className={cn("flex flex-col min-h-0", !mobileThread && "hidden lg:flex")}>
            {open && other ? (
              <>
                <div className="flex items-center gap-3 px-5 h-16 border-b border-border/60 shrink-0">
                  <Button variant="ghost" size="icon" className="lg:hidden -ml-2" aria-label="Back to conversations" onClick={() => setMobileThread(false)}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-[12px] font-semibold">
                      {initials(other.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-semibold tracking-[-0.01em] truncate">{other.name}</p>
                    {open.relatedJobTitle && <p className="text-[12px] text-muted-foreground truncate">Re: {open.relatedJobTitle}</p>}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-2.5 bg-gradient-to-b from-surface-subtle/40 to-transparent">
                  <AnimatePresence initial={false}>
                    {open.messages.map((m) => {
                      const mine = m.senderId === user?.id;
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                          className={cn("flex", mine ? "justify-end" : "justify-start")}
                        >
                          <div className={cn("max-w-[78%]", mine && "text-right")}>
                            <div
                              className={cn(
                                "inline-block px-4 py-2.5 text-[14px] leading-relaxed text-left",
                                mine
                                  ? "bg-gradient-to-br from-primary to-[hsl(222_80%_32%)] text-primary-foreground rounded-[20px] rounded-br-md shadow-[0_6px_16px_-8px_hsl(var(--primary)/0.6)]"
                                  : "bg-white border border-border/70 text-foreground rounded-[20px] rounded-bl-md shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
                              )}
                            >
                              {m.content}
                            </div>
                            <p className="mt-1 px-1 text-[11px] text-muted-foreground tabular-nums">{shortTime(m.createdAt)}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={endRef} />
                </div>

                <div className="p-3 border-t border-border/60 shrink-0">
                  <div className="flex items-end gap-2 rounded-3xl border border-border/70 bg-white pl-4 pr-2 py-1.5 focus-within:border-secondary/40 focus-within:ring-4 focus-within:ring-secondary/10 transition">
                    <Textarea
                      aria-label="Write a reply"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Write a reply…"
                      rows={1}
                      className="min-h-[36px] max-h-32 flex-1 resize-none border-0 shadow-none focus-visible:ring-0 px-0 py-2 bg-transparent"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                    />
                    <Button onClick={send} disabled={!draft.trim()} size="icon" className="rounded-full shrink-0" aria-label="Send reply">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="mt-1.5 px-3 text-[11.5px] text-muted-foreground">Enter to send · Shift+Enter for a new line</p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[13.5px] text-muted-foreground">Select a conversation</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
