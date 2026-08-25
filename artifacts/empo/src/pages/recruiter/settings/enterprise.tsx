import { useState } from 'react';
import { Shield, Users, Bell, Mail, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { Card, CardContent } from '@workspace/design-system/card';
import { Button } from '@workspace/design-system/button';
import { Input } from '@workspace/design-system/input';
import { Switch } from '@workspace/design-system/switch';
import { Badge } from '@workspace/design-system/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/design-system/select';
import { toast } from '@workspace/design-system/hooks/use-toast';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited';
}

const TEAM: TeamMember[] = [
  { id: 1, name: 'Sarah Jenkins', email: 'sarah@stratos.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Marcus Chen', email: 'marcus@stratos.com', role: 'Recruiter', status: 'active' },
  { id: 3, name: 'Priya Patel', email: 'priya@stratos.com', role: 'Hiring Manager', status: 'active' },
  { id: 4, name: 'Tom Nguyen', email: 'tom@stratos.com', role: 'Recruiter', status: 'invited' },
];

const SECURITY_SETTINGS = [
  { key: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Require 2FA for all team members', defaultEnabled: true },
  { key: 'sso', label: 'SSO Integration', desc: 'Enable single sign-on with your identity provider', defaultEnabled: false },
  { key: 'sessionTimeout', label: 'Session Timeout', desc: 'Auto-logout after 8 hours of inactivity', defaultEnabled: true },
  { key: 'auditLogs', label: 'Audit Logs', desc: 'Track all user actions and data access', defaultEnabled: true },
] as const;

const TABS = [
  { key: 'team', icon: Users, label: 'Team Members' },
  { key: 'security', icon: Shield, label: 'Security' },
  { key: 'notifications', icon: Bell, label: 'Notifications' },
] as const;

type Tab = (typeof TABS)[number]['key'];

export default function EnterpriseSettings() {
  const [tab, setTab] = useState<Tab>('team');
  const [team, setTeam] = useState<TeamMember[]>(TEAM);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Recruiter');
  const [security, setSecurity] = useState<Record<string, boolean>>(
    Object.fromEntries(SECURITY_SETTINGS.map((s) => [s.key, s.defaultEnabled]))
  );
  const [notif, setNotif] = useState({
    newApplication: true,
    interviewComplete: true,
    offerResponse: true,
    weeklyDigest: true,
    teamActivity: false,
  });

  const invite = () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setTeam((t) => [
      ...t,
      { id: Math.max(0, ...t.map((m) => m.id)) + 1, name: email.split('@')[0], email, role: inviteRole, status: 'invited' },
    ]);
    toast({ title: 'Invitation sent', description: `${email} was invited as ${inviteRole}.` });
    setInviteEmail('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Enterprise Settings"
        eyebrow={`${team.length} TEAM MEMBER${team.length === 1 ? '' : 'S'} · ${team.filter((m) => m.status === 'invited').length} PENDING INVITE${team.filter((m) => m.status === 'invited').length === 1 ? '' : 'S'}`}
        description="Manage team, security, and notification preferences."
      />

      <div className="flex gap-1">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            data-testid={`tab-${key}`}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'team' && (
        <div className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardContent className="p-5">
              <h2 className="font-display font-semibold text-foreground mb-4">Invite Team Member</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    data-testid="input-invite-email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && invite()}
                    placeholder="colleague@company.com"
                    className="pl-9"
                  />
                </div>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Recruiter">Recruiter</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Hiring Manager">Hiring Manager</SelectItem>
                  </SelectContent>
                </Select>
                <Button data-testid="btn-invite" onClick={invite} disabled={!inviteEmail.trim()} className="gap-2">
                  <Plus size={15} /> Invite
                </Button>
              </div>
            </CardContent>
          </Card>

          <ViewfinderCard className="border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">Team Members ({team.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground uppercase border-b border-border">
                  <th className="text-left px-5 py-3 font-semibold">Member</th>
                  <th className="text-left px-5 py-3 font-semibold">Role</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {team.map((m) => (
                  <tr key={m.id} className="hover-elevate">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {m.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{m.name}</div>
                          <div className="text-xs text-muted-foreground">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{m.role}</td>
                    <td className="px-5 py-3">
                      <Badge variant={m.status === 'active' ? 'success' : 'warning'}>
                        {m.status === 'active' ? 'Active' : 'Invited'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {m.id !== 1 && (
                        <button
                          data-testid={`btn-remove-${m.id}`}
                          onClick={() => setTeam((t) => t.filter((x) => x.id !== m.id))}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          aria-label={`Remove ${m.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ViewfinderCard>
        </div>
      )}

      {tab === 'security' && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <h2 className="font-display font-semibold text-foreground mb-4">Security Settings</h2>
            <div className="space-y-1">
              {SECURITY_SETTINGS.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="font-medium text-sm text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                  <Switch
                    data-testid={`toggle-${key}`}
                    checked={security[key]}
                    onCheckedChange={(checked) => setSecurity((s) => ({ ...s, [key]: checked }))}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <h2 className="font-display font-semibold text-foreground mb-4">Email Notifications</h2>
            <div className="space-y-1">
              {[
                { key: 'newApplication', label: 'New application received', desc: 'Get notified when a candidate applies' },
                { key: 'interviewComplete', label: 'Interview completed', desc: "When a candidate finishes their async interview" },
                { key: 'offerResponse', label: 'Offer response', desc: 'When a candidate accepts or declines an offer' },
                { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Summary of pipeline activity every Monday' },
                { key: 'teamActivity', label: 'Team activity', desc: 'When team members take actions in the pipeline' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="font-medium text-sm text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                  <Switch
                    data-testid={`toggle-${key}`}
                    checked={notif[key as keyof typeof notif]}
                    onCheckedChange={(checked) => setNotif((n) => ({ ...n, [key]: checked }))}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
