import { useEffect, useRef, useState } from 'react';
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
  getCandidateResumeHref,
  getCandidateProfile,
  parseCandidateCv,
  updateCandidateProfile,
  type CandidateCvProfileInput,
  type CandidateProfile,
  type CandidateProfileInput,
} from '@/lib/candidate-profile-api';
import { BriefcaseBusiness, CalendarDays, Check, FileText, Mail, MapPin, Pencil, UploadCloud, X } from 'lucide-react';

type TextCandidateProfileField = Exclude<keyof CandidateCvProfileInput, 'skills' | 'yearsOfExperience'>;

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

function formatProfileValue(value: string | number | string[] | null | undefined): string {
  return Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value);
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
  const [resumeSuggestions, setResumeSuggestions] = useState<CandidateCvProfileInput | null>(null);
  const [resumeFileError, setResumeFileError] = useState<string | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const profileQueryKey = ['candidate-profile', user?.id];

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
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

  const resumeImportMutation = useMutation({
    mutationFn: parseCandidateCv,
    onSuccess: ({ resumeUrl, extractedFields }) => {
      queryClient.setQueryData<CandidateProfile>(profileQueryKey, (current) =>
        current ? { ...current, resumeUrl } : current,
      );
      setResumeSuggestions(extractedFields);
    },
  });

  const unauthorizedError = [
    profileQuery.error,
    createMutation.error,
    updateMutation.error,
    resumeImportMutation.error,
  ].find(
    (error) =>
      error instanceof ApiError && error.status === 401,
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

  function chooseResume(file: File | undefined) {
    if (!file) return;
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setResumeFileError('Choose a PDF or DOCX resume.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeFileError('Resume files must be 5MB or smaller.');
      return;
    }
    setResumeFileError(null);
    setResumeSuggestions(null);
    resumeImportMutation.mutate(file);
  }

  function applyResumeSuggestions() {
    if (!resumeSuggestions) return;
    updateMutation.mutate(resumeSuggestions, {
      onSuccess: () => setResumeSuggestions(null),
    });
  }

  function renderTextSuggestion(
    field: TextCandidateProfileField,
    label: string,
    currentValue: string | null | undefined,
    multiline = false,
  ) {
    const suggestedValue = resumeSuggestions?.[field];
    if (suggestedValue === undefined) return null;

    const currentText = formatProfileValue(currentValue);
    const suggestionText = formatProfileValue(suggestedValue);
    return (
      <label key={field} className="block min-w-0 text-sm">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {multiline ? (
          <Textarea
            value={suggestionText}
            onChange={(event) => {
              const value = event.target.value;
              setResumeSuggestions((current) =>
                current
                  ? {
                      ...current,
                      [field]:
                        value === '' && (field === 'headline' || field.endsWith('Url'))
                          ? null
                          : value,
                    }
                  : current,
              );
            }}
            className="mt-1 min-h-24"
          />
        ) : (
          <Input
            value={suggestionText}
            onChange={(event) => {
              const value = event.target.value;
              setResumeSuggestions((current) =>
                current
                  ? {
                      ...current,
                      [field]:
                        value === '' && (field === 'headline' || field.endsWith('Url'))
                          ? null
                          : value,
                    }
                  : current,
              );
            }}
            className="mt-1"
          />
        )}
        {currentText && currentText !== suggestionText && (
          <span className="mt-1 block text-xs text-muted-foreground">
            Current profile value: {currentText}
          </span>
        )}
      </label>
    );
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

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">Resume</h3>
              {getCandidateResumeHref(profile.resumeUrl) ? (
                <a
                  href={getCandidateResumeHref(profile.resumeUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate text-sm text-primary underline underline-offset-4"
                >
                  View current resume
                </a>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No resume uploaded yet.</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Upload a PDF or DOCX (up to 5MB). We’ll read it and suggest profile details.
              </p>
            </div>
          </div>
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(event) => {
              chooseResume(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <Button
            variant="outline"
            onClick={() => resumeInputRef.current?.click()}
            disabled={resumeImportMutation.isPending}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {resumeImportMutation.isPending ? 'Reading resume…' : profile.resumeUrl ? 'Update resume' : 'Upload resume'}
          </Button>
        </CardContent>
        {resumeImportMutation.error && (
          <p className="px-6 pb-4 text-sm text-destructive" role="alert">
            {getApiErrorMessage(resumeImportMutation.error)}
          </p>
        )}
        {resumeFileError && (
          <p className="px-6 pb-4 text-sm text-destructive" role="alert">
            {resumeFileError}
          </p>
        )}
        {resumeSuggestions && (
          <CardContent className="border-t border-border/60 p-6">
            {Object.keys(resumeSuggestions).length ? (
              <>
                <h4 className="font-semibold text-foreground">Resume details found</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review and edit these suggestions. Existing profile values are shown when a suggestion differs; nothing is saved until you confirm.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {renderTextSuggestion('headline', 'Headline', profile.headline)}
                  {renderTextSuggestion('location', 'Location', profile.location)}
                  {resumeSuggestions.yearsOfExperience !== undefined && (
                    <label className="block min-w-0 text-sm">
                      <span className="text-xs font-medium text-muted-foreground">Years of experience</span>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={resumeSuggestions.yearsOfExperience ?? ''}
                        onChange={(event) =>
                          setResumeSuggestions((current) =>
                            current
                              ? {
                                  ...current,
                                  yearsOfExperience:
                                    event.target.value === '' ? null : Number(event.target.value),
                                }
                              : current,
                          )
                        }
                        className="mt-1"
                      />
                      {profile.yearsOfExp != null &&
                        profile.yearsOfExp !== resumeSuggestions.yearsOfExperience && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Current profile value: {profile.yearsOfExp}
                          </span>
                        )}
                    </label>
                  )}
                  {renderTextSuggestion('availability', 'Availability', profile.availability)}
                  {renderTextSuggestion('summary', 'Summary', profile.summary, true)}
                  {renderTextSuggestion('experience', 'Experience', profile.experience, true)}
                  {renderTextSuggestion('education', 'Education', profile.education, true)}
                  {resumeSuggestions.skills !== undefined && (
                    <label className="block min-w-0 text-sm">
                      <span className="text-xs font-medium text-muted-foreground">Skills</span>
                      <Input
                        value={resumeSuggestions.skills.join(', ')}
                        onChange={(event) =>
                          setResumeSuggestions((current) =>
                            current
                              ? {
                                  ...current,
                                  skills: event.target.value
                                    .split(',')
                                    .map((skill) => skill.trim())
                                    .filter(Boolean),
                                }
                              : current,
                          )
                        }
                        className="mt-1"
                      />
                      {resumeSuggestions.skills.length === 0 && (
                        <span className="mt-1 block text-xs text-destructive" role="alert">
                          Enter at least one skill to apply these suggestions.
                        </span>
                      )}
                      {profile.skills?.length &&
                        formatProfileValue(profile.skills) !== formatProfileValue(resumeSuggestions.skills) && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Current profile value: {profile.skills.join(', ')}
                          </span>
                        )}
                    </label>
                  )}
                  {renderTextSuggestion('portfolioUrl', 'Portfolio URL', profile.portfolioUrl)}
                  {renderTextSuggestion('linkedinUrl', 'LinkedIn URL', profile.linkedinUrl)}
                  {renderTextSuggestion('githubUrl', 'GitHub URL', profile.githubUrl)}
                </div>
                <Button
                  className="mt-5"
                  onClick={applyResumeSuggestions}
                  disabled={updateMutation.isPending || resumeSuggestions.skills?.length === 0}
                >
                  {updateMutation.isPending ? 'Updating profile…' : 'Apply reviewed details'}
                </Button>
                <Button
                  className="ml-2 mt-5"
                  variant="outline"
                  onClick={() => setResumeSuggestions(null)}
                  disabled={updateMutation.isPending}
                >
                  Discard suggestions
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground" role="status">
                The resume was uploaded, but no profile fields could be identified. You can still edit your profile manually.
              </p>
            )}
          </CardContent>
        )}
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
