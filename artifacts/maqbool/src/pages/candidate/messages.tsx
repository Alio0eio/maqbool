import React, { useState } from "react";
import { Button } from "@workspace/design-system/button";
import { CardContent } from "@workspace/design-system/card";
import { Badge } from "@workspace/design-system/badge";
import { Textarea } from "@workspace/design-system/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/design-system/dialog";
import { MessageSquare, Clock, User, ArrowRight, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getConversationsFor, otherParticipant, type MockConversation } from "@/lib/mock-data";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ViewfinderCard } from "@/components/shared/viewfinder-card";

export default function CandidateMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState(() => getConversationsFor(user?.id));
  const [open, setOpen] = useState<MockConversation | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function sendReply() {
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
    setConversations(prev =>
      prev.map(c => c.id === open.id ? { ...c, messages: [...c.messages, message], lastMessage: message } : c)
    );
    setOpen(prev => prev ? { ...prev, messages: [...prev.messages, message] } : prev);
    setDraft("");
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <PageHeader
        title="Messages"
        eyebrow={`${conversations.length} conversation${conversations.length === 1 ? "" : "s"} · ${conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)} unread`}
        description="Check your conversations with recruiters and hiring teams."
        actions={
          <Button onClick={() => setComposeOpen(true)}>
            <MessageSquare className="w-4 h-4 mr-2" /> New message
          </Button>
        }
      />

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Messages from recruiters about your applications will show up here."
        />
      ) : (
        <div className="grid gap-4">
          {conversations.map((conversation) => {
            const other = otherParticipant(conversation, user?.id);
            return (
              <ViewfinderCard
                key={conversation.id}
                className="cursor-pointer"
                onClick={() => setOpen(conversation)}
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/[0.08] text-primary shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">{other.name}</h2>
                        {!!conversation.unreadCount && <Badge variant="destructive">New</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{conversation.lastMessage?.content}</p>
                      {conversation.relatedJobTitle && (
                        <p className="text-xs text-muted-foreground mt-1">Re: {conversation.relatedJobTitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {new Date(conversation.lastMessage?.createdAt ?? conversation.createdAt).toLocaleString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => { e.stopPropagation(); setOpen(conversation); }}
                    >
                      View <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </ViewfinderCard>
            );
          })}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{otherParticipant(open, user?.id).name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-80 overflow-y-auto py-2">
                {open.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter className="flex-row gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a reply…"
                  className="min-h-[40px] flex-1"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                />
                <Button onClick={sendReply} disabled={!draft.trim()} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Recruiter conversations are opened from a job application. Reply to an existing thread above, or reach out from a job's detail page.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
