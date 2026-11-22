import { useState } from 'react';
import { Mail, Plus, Trash2, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmAction } from '@/components/shared/confirm-action';
import { ViewfinderCard } from '@/components/shared/viewfinder-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/design-system/card';
import { Button } from '@workspace/design-system/button';
import { Input } from '@workspace/design-system/input';
import { Badge } from '@workspace/design-system/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/design-system/select';
import { toast } from '@workspace/design-system/hooks/use-toast';
import {
  inviteRecruiterTeamMember,
  removeRecruiterTeamMember,
  updateRecruiterTeamMember,
  useRecruiterTeam,
} from '@/lib/recruiter-api';

export default function EnterpriseSettings() {
  const teamQuery = useRecruiterTeam();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'recruiter' | 'hiring_manager' | 'billing_admin'>('recruiter');
  const [pending, setPending] = useState(false);

  async function invite() {
    if (!inviteEmail.trim()) return;
    setPending(true);
    try {
      await inviteRecruiterTeamMember(inviteEmail.trim(), inviteRole);
      toast({ title: 'Invitation created', description: 'The company invitation is ready to accept.' });
      setInviteEmail('');
    } catch (error) {
      toast({ title: 'Could not create invitation', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setPending(false);
    }
  }

  async function refreshTeam() {
    await queryClient.invalidateQueries({ queryKey: ['recruiter-team'] });
  }

  async function changeRole(memberId: number, role: 'owner' | 'admin' | 'recruiter' | 'hiring_manager' | 'billing_admin') {
    try {
      await updateRecruiterTeamMember(memberId, role);
      await refreshTeam();
      toast({ title: 'Team member updated' });
    } catch (error) {
      toast({ title: 'Could not update member', description: error instanceof Error ? error.message : 'Please try again.' });
    }
  }

  async function removeMember(memberId: number) {
    try {
      await removeRecruiterTeamMember(memberId);
      await refreshTeam();
      toast({ title: 'Team member removed' });
    } catch (error) {
      toast({ title: 'Could not remove member', description: error instanceof Error ? error.message : 'Please try again.' });
    }
  }

  const team = teamQuery.data ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <PageHeader
        title="Enterprise Settings"
        eyebrow={`${team.length} team member${team.length === 1 ? '' : 's'}`}
        description="Manage this company’s team and invitations."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">Invite Team Member</CardTitle>
          <CardDescription>Create a one-time invitation for an existing recruiter account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && invite()}
                placeholder="colleague@company.com"
                className="pl-9"
              />
            </div>
            <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as typeof inviteRole)}>
              <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                <SelectItem value="billing_admin">Billing Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={invite} disabled={!inviteEmail.trim() || pending} className="gap-2">
              <Plus size={15} /> Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {teamQuery.isLoading && <p className="text-sm text-muted-foreground">Loading team…</p>}
      {teamQuery.isError && <p className="text-sm text-destructive">Unable to load team members.</p>}

      {teamQuery.isSuccess && (
        <ViewfinderCard className="overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
            <Users size={16} />
            <h2 className="text-[15px] font-semibold">Team Members ({team.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11.5px] text-muted-foreground border-b border-border/60">
                <th className="text-left px-5 py-3 font-medium">Member</th>
                <th className="text-left px-5 py-3 font-medium">Role</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {team.map((member) => (
                <tr key={member.id}>
                  <td className="px-5 py-3">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    {member.role === 'owner' ? (
                      <Badge variant="outline">Owner</Badge>
                    ) : (
                      <Select
                        value={member.role}
                        onValueChange={(role) => changeRole(member.id, role as 'admin' | 'recruiter' | 'hiring_manager' | 'billing_admin')}
                      >
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                          <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                          <SelectItem value="billing_admin">Billing Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="px-5 py-3"><Badge variant={member.status === 'active' ? 'success' : 'warning'}>{member.status}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    {member.role !== 'owner' && (
                      <ConfirmAction
                        title={`Remove ${member.name}?`}
                        description="They will lose access to this workspace immediately."
                        confirmLabel="Remove member"
                        onConfirm={() => removeMember(member.id)}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label={`Remove ${member.name}`}>
                          <Trash2 size={14} />
                        </Button>
                      </ConfirmAction>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ViewfinderCard>
      )}
    </div>
  );
}
