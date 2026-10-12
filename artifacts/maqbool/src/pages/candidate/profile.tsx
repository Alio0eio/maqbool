import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ApiError } from '@workspace/api-client-react';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { Badge } from '@workspace/design-system/badge';
import { Button } from '@workspace/design-system/button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/design-system/card';
import { Input } from '@workspace/design-system/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/design-system/tabs';
import { Textarea } from '@workspace/design-system/textarea';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/lib/auth';
import {
  createCandidateProfile,
  getCandidateProfile,
  updateCandidateProfile,
  type CandidateProfile,
} from '@/lib/candidate-profile-api';
import { BriefcaseBusiness, CalendarDays, Check, Mail, MapPin, Pencil, X } from 'lucide-react';

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const data = error.data;
    if (data && typeof data === 'object') {
      const body = data as { error?: { message?: unknown }; message?: unknown };
      if (typeof body.error?.message === 'string') return body.error.message;
      if (typeof body.message === 'string') return body.message;
    }
  }

  return error instanceof Error ? error.message : 'The request failed. Please try again.';
}

function ProfileLink({ label, href }: { label: string; href?: string | null }) {
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl bg-surface-subtle p-4 text-sm text-foreground transition-colors hover:bg-surface-subtle/80"
    >
      <div className="font-semibold">{label}</div>
      <div className="mt-1 truncate text-muted-foreground">{href}</div>
    </a>
  ) : (
    <div className="block rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
      <div className="font-semibold text-foreground">{label}</div>
      <div className="mt-1">Not provided</div>
    </div>
  );
}

export default function CandidateProfilePage() {
  const { user, role, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [headlineDraft, setHeadlineDraft] = useState('');
  const [summaryDraft, setSummaryDraft] = useState('');

  const profileQuery = useQuery({
    queryKey: ['candidate-profile', user?.id],
    queryFn: ({ signal }) => getCandidateProfile(signal),
    enabled: Boolean(user && role === 'candidate'),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createCandidateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(['candidate-profile', user?.id], profile);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCandidateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(['candidate-profile', user?.id], profile);
      setIsEditing(false);
    },
  });

  const unauthorizedError = [
    profileQuery.error,
    createMutation.error,
    updateMutation.error,
  ].find(
    (error) =>
      error instanceof ApiError && (error.status === 401 || error.status === 403),
  );

  useEffect(() => {
    if (unauthorizedError) {
      void signOut();
      setLocation('/');
    }
  }, [setLocation, signOut, unauthorizedError]);

  if (!user || role !== 'candidate') return null;

  if (profileQuery.isPending || profileQuery.isFetching) {
    return (
      <main
        className="flex min-h-64 items-center justify-center text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        Loading your profile…
      </main>
    );
  }

  if (profileQuery.error instanceof ApiError && profileQuery.error.status === 404) {
    return (
      <section className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="My Profile"
          description="Your candidate account does not have a profile yet."
        />
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">
              Create your candidate profile to add your experience, skills, and professional links.
            </p>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating profile…' : 'Create profile'}
            </Button>
            {createMutation.error && (
              <p className="text-sm text-destructive" role="alert">
                {getApiErrorMessage(createMutation.error)}
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    );
  }

  if (profileQuery.error || !profileQuery.data) {
    return (
      <section className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="My Profile" description="We could not load your profile." />
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-destructive" role="alert">
              {getApiErrorMessage(profileQuery.error)}
            </p>
            <Button variant="outline" onClick={() => void profileQuery.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const profile: CandidateProfile = profileQuery.data;
  const experienceYears =
    profile.yearsOfExp == null ? null : `${profile.yearsOfExp} ${profile.yearsOfExp === 1 ? 'year' : 'years'}`;

  function startEditing() {
    setHeadlineDraft(profile.headline ?? '');
    setSummaryDraft(profile.summary ?? '');
    setIsEditing(true);
  }

  function saveEditing() {
    updateMutation.mutate({
      headline: headlineDraft.trim() || null,
      summary: summaryDraft.trim() || null,
    });
  }

  return (
    <div className="mx-auto max-w-5xl animate-in space-y-6 fade-in slide-in-from-bottom-4 pb-20 duration-500">
      <PageHeader
        title="My Profile"
        eyebrow={[experienceYears, profile.availability].filter(Boolean).join(' · ') || undefined}
        description="Keep your story, skills, and experience up to date."
        actions={
          <Link href="/candidate/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <div aria-hidden className="relative h-28 bg-gradient-to-br from-primary via-[hsl(222_90%_26%)] to-secondary sm:h-32">
          <div className="float-slow absolute -top-16 right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="float-slower absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-brand-steel-reversed/20 blur-3xl" />
        </div>
        <CardContent className="p-6 pt-0 sm:p-8 sm:pt-0">
          <div className="-mt-12 flex flex-col gap-6 sm:flex-row sm:items-end">
            <Avatar className="h-24 w-24 shrink-0 ring-4 ring-white shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)]">
              <AvatarImage src={user.avatarUrl || ''} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-2xl font-semibold text-primary-foreground">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 pt-2 sm:pt-0">
              <h2 className="text-[24px] font-semibold tracking-[-0.01em] text-foreground">{user.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              {isEditing ? (
                <Input
                  value={headlineDraft}
                  onChange={(event) => setHeadlineDraft(event.target.value)}
                  className="mt-3 max-w-sm"
                  placeholder="Headline"
                />
              ) : (
                <p className="mt-3 text-[14px] text-muted-foreground">
                  {profile.headline || 'No headline provided'}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                {profile.location && <span>{profile.location}</span>}
                {profile.location && experienceYears && <span>·</span>}
                {experienceYears && <span>{experienceYears} experience</span>}
                {(profile.location || experienceYears) && profile.availability && <span>·</span>}
                {profile.availability && <span>{profile.availability}</span>}
                {!profile.location && !experienceYears && !profile.availability && (
                  <span>Profile details not provided</span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={saveEditing}
                    disabled={updateMutation.isPending}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={updateMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={startEditing}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit profile
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setLocation('/candidate/messages')}>
                    <Mail className="mr-2 h-4 w-4" /> Message recruiter
                  </Button>
                </>
              )}
            </div>
          </div>
          {updateMutation.error && (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {getApiErrorMessage(updateMutation.error)}
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none">
          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
            <Card>
              <CardContent className="p-6 sm:p-7">
                <CardTitle className="text-[15px]">About {user.name}</CardTitle>
                {isEditing ? (
                  <Textarea
                    value={summaryDraft}
                    onChange={(event) => setSummaryDraft(event.target.value)}
                    className="mt-4 min-h-[100px]"
                    placeholder="Tell recruiters about yourself"
                  />
                ) : (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {profile.summary || 'No summary provided yet.'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 sm:p-7">
                <CardTitle className="text-[15px]">Profile details</CardTitle>
                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-[12px] font-medium text-muted-foreground">Location</p>
                      <p className="mt-1 font-medium text-foreground">{profile.location || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-[12px] font-medium text-muted-foreground">Experience</p>
                      <p className="mt-1 font-medium text-foreground">{experienceYears || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-[12px] font-medium text-muted-foreground">Availability</p>
                      <p className="mt-1 font-medium text-foreground">{profile.availability || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6 sm:p-7">
              <CardTitle className="text-[15px]">Experience</CardTitle>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {profile.experience || 'Not provided'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 sm:p-7">
              <CardTitle className="text-[15px]">Education</CardTitle>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {profile.education || 'Not provided'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="outline-none">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-[15px]">Key skills</CardTitle>
              {profile.skills?.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="subtle" className="font-medium">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No skills provided yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="p-6">
          <CardTitle className="text-[15px]">Profile links</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 pt-0 md:grid-cols-2">
          <ProfileLink label="Portfolio" href={profile.portfolioUrl} />
          <ProfileLink label="LinkedIn" href={profile.linkedinUrl} />
          <ProfileLink label="GitHub" href={profile.githubUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
