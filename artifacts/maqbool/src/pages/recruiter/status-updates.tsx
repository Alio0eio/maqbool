import { useState } from 'react';
import { Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { Card, CardContent } from '@workspace/design-system/card';
import { Button } from '@workspace/design-system/button';
import { Checkbox } from '@workspace/design-system/checkbox';
import { Textarea } from '@workspace/design-system/textarea';
import { toast } from '@workspace/design-system/hooks/use-toast';
import { cn } from '@workspace/design-system/utils';
import { ConfirmAction } from '@/components/shared/confirm-action';
import { PageHeader } from '@/components/shared/page-header';
import { MOCK_CANDIDATES } from '@/lib/mock-data';

const STATUS_TEMPLATES = [
  { label: 'Application Received', body: "Thank you for applying to {role} at Stratos Financial. We've received your application and will be reviewing it shortly." },
  { label: 'Under Review', body: "We're currently reviewing your application for {role}. We'll be in touch within the next 5-7 business days." },
  { label: 'Move to Interview', body: "Congratulations! We'd like to invite you to the next stage of our interview process for {role}. Please check your Maqbool dashboard." },
  { label: 'Rejection (Kind)', body: "Thank you for your interest in {role}. After careful consideration, we've decided to move forward with other candidates. We appreciate your time and encourage you to apply for future roles." },
];

export default function StatusUpdates() {
  const [selected, setSelected] = useState<number[]>([]);
  const [template, setTemplate] = useState(STATUS_TEMPLATES[0]);
  const [message, setMessage] = useState(STATUS_TEMPLATES[0].body);
  const [sent, setSent] = useState(false);

  function handleTemplateChange(t: typeof STATUS_TEMPLATES[0]) {
    setTemplate(t);
    setMessage(t.body);
  }

  function toggle(id: number) {
    setSelected((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));
  }

  function handleSend() {
    setSent(true);
    toast({
      title: 'Status updates sent',
      description: `${selected.length} candidate${selected.length === 1 ? '' : 's'} notified.`,
    });
    setTimeout(() => {
      setSent(false);
      setSelected([]);
    }, 2000);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Status Updates"
        eyebrow={`${MOCK_CANDIDATES.length} candidates · ${selected.length} selected`}
        description="Send a status update to one or more candidates."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-14rem)]">
        {/* Left: Candidate list */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="px-4 py-4 border-b border-border/60 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em]">Select Recipients</h2>
              <button
                onClick={() => setSelected(selected.length === MOCK_CANDIDATES.length ? [] : MOCK_CANDIDATES.map((c) => c.id))}
                className="text-[12.5px] text-primary hover:underline"
              >
                {selected.length === MOCK_CANDIDATES.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <span className="text-[12px] text-muted-foreground">{selected.length} selected</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {MOCK_CANDIDATES.map((c) => (
              <label key={c.id} className={cn("flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors", selected.includes(c.id) ? "bg-primary/[0.05]" : "hover:bg-foreground/[0.03]")}>
                <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={c.avatarUrl || ''} alt={c.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs font-semibold">
                    {c.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-foreground truncate">{c.name}</div>
                  <div className="text-[12px] text-muted-foreground truncate">{c.email}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Right: Compose */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">Status Template</h2>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    aria-pressed={template.label === t.label}
                    onClick={() => handleTemplateChange(t)}
                    data-testid={`template-${t.label}`}
                    className={cn(
                      'p-3.5 rounded-2xl border-2 text-left text-[13px] font-medium transition-all active:scale-[0.98]',
                      template.label === t.label ? 'border-primary bg-primary/[0.05] text-primary shadow-[0_8px_20px_-12px_hsl(var(--primary)/0.5)]' : 'border-border/70 hover:border-primary/40 text-muted-foreground'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col">
              <h2 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">Message</h2>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="flex-1 resize-none"
              />
              <div className="flex items-center justify-between mt-2 text-[12px] text-muted-foreground">
                <p>{'Use {role}, {candidate_name} for personalization.'}</p>
                <span className="tabular-nums">{message.length} characters</span>
              </div>
            </CardContent>
          </Card>

          {(() => {
            const sendButton = (
              <Button
                data-testid="btn-send"
                onClick={template.label.startsWith('Rejection') ? undefined : handleSend}
                disabled={selected.length === 0 || sent}
                size="lg"
                className={cn('gap-2 w-full', sent && 'bg-success text-success-foreground hover:bg-success')}
              >
                <Send size={16} />
                {sent ? 'Updates Sent!' : `Send to ${selected.length} Candidate${selected.length === 1 ? '' : 's'}`}
              </Button>
            );
            return template.label.startsWith('Rejection') && selected.length > 0 && !sent ? (
              <ConfirmAction
                title={`Send rejection to ${selected.length} candidate${selected.length === 1 ? '' : 's'}?`}
                description="They'll be notified immediately and this can't be recalled."
                confirmLabel="Send rejection"
                onConfirm={handleSend}
              >
                {sendButton}
              </ConfirmAction>
            ) : sendButton;
          })()}
        </div>
      </div>
    </div>
  );
}
