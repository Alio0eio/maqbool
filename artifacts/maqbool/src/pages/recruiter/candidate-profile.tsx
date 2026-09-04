import { useLocation, useParams } from 'wouter';
import { ArrowLeft, MapPin, Linkedin, Github, Mail, Calendar } from 'lucide-react';
import { MatchScoreBadge, AITag } from '@/components/shared/badges';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@workspace/design-system/button';
import { Badge } from '@workspace/design-system/badge';
import { Card } from '@workspace/design-system/card';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
import { cn } from '@workspace/design-system/utils';
import { MOCK_CANDIDATES, MOCK_APPLICATIONS } from '@/lib/mock-data';

export default function CandidateProfile() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const candidate = MOCK_CANDIDATES.find(c => c.id === Number(params.id)) ?? MOCK_CANDIDATES[0];
  const application = MOCK_APPLICATIONS.find(a => a.candidateId === candidate.id);
  const aiScore = application?.aiScore;
  // skillMatch/experienceMatch aren't real API fields — derive them from
  // aiScore the same way the old mock-data legacy adapter used to.
  const skillMatch = aiScore != null ? Math.min(99, aiScore + 4) : undefined;
  const experienceMatch = aiScore != null ? Math.max(45, aiScore - 6) : undefined;

  const stageLabel = application ? application.stage.charAt(0).toUpperCase() + application.stage.slice(1) : '';
  const eyebrow = application
    ? `${stageLabel} · Applied ${new Date(application.createdAt).toLocaleDateString()}`
    : `${candidate.yearsOfExp} yrs experience · ${candidate.availability ?? ''}`;

  function scoreTone(value: number) {
    if (value >= 85) return { text: 'text-success', bg: 'bg-success' };
    if (value >= 65) return { text: 'text-warning', bg: 'bg-warning' };
    return { text: 'text-destructive', bg: 'bg-destructive' };
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Candidate Profile"
        eyebrow={eyebrow}
        actions={
          <div className="flex items-center gap-2">
            <Button
              data-testid="btn-back"
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/recruiter/candidates')}
              aria-label="Back to candidates"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </Button>
            <Button
              data-testid="btn-schedule-interview"
              variant="outline"
              onClick={() => setLocation('/recruiter/interviews')}
            >
              <Calendar className="w-[15px] h-[15px]" /> Schedule Interview
            </Button>
            <Button
              data-testid="btn-send-offer"
              onClick={() => setLocation('/recruiter/offers')}
            >
              <Mail className="w-[15px] h-[15px]" /> Send Offer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <Avatar className="w-20 h-20 mb-3 border border-border/70">
                <AvatarImage src={candidate.avatarUrl || ""} alt={candidate.name} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-2xl">
                  {candidate.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-[18px] font-semibold text-foreground tracking-[-0.01em]">{candidate.name}</h2>
              <p className="text-[13.5px] text-muted-foreground">{candidate.headline}</p>
              <div className="flex items-center gap-1 mt-1 text-[13px] text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" /> {candidate.location}
              </div>
            </div>

            {aiScore != null && (
              <div className="flex items-center justify-center gap-3 py-3 bg-info/[0.05] rounded-[10px] mb-4">
                <MatchScoreBadge score={aiScore} size="lg" />
                <div>
                  <div className="text-[12px] font-semibold text-foreground flex items-center gap-1"><AITag /></div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">Top 5% of candidates</div>
                </div>
              </div>
            )}

            <div className="space-y-2 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-medium text-foreground">{candidate.yearsOfExp} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Availability</span>
                <span className="font-medium text-success capitalize">{candidate.availability}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salary Expectation</span>
                <span className="font-medium text-foreground">${((candidate.salaryExpectation ?? 0) / 1000).toFixed(0)}k</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {candidate.linkedinUrl && (
                <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border/70 rounded-[9px] text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                </a>
              )}
              {candidate.githubUrl && (
                <a href={candidate.githubUrl} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border/70 rounded-[9px] text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" /> GitHub
                </a>
              )}
            </div>
          </Card>

          {/* AI Score breakdown */}
          {aiScore != null && (
            <Card className="p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <AITag />
                <span className="text-[13.5px] font-semibold text-foreground">Score Breakdown</span>
              </div>
              {[
                { label: 'Skill Match', value: skillMatch ?? 0 },
                { label: 'Experience Match', value: experienceMatch ?? 0 },
                { label: 'Culture Fit', value: Math.round(aiScore * 0.9) },
              ].map(({ label, value }) => {
                const tone = scoreTone(value);
                return (
                  <div key={label} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-[12.5px] mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={cn('font-semibold', tone.text)}>{value}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', tone.bg)} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>

        {/* Right: Detail */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">Summary</h3>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">{candidate.summary || 'No summary provided.'}</p>
            {application?.aiSummary && (
              <div className="mt-4 bg-info/[0.05] rounded-[10px] p-3">
                <div className="flex items-center gap-1.5 mb-1"><AITag>AI Assessment</AITag></div>
                <p className="text-[12.5px] text-foreground/90 leading-relaxed">{application.aiSummary}</p>
              </div>
            )}
          </Card>

          {/* Skills */}
          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(candidate.skills ?? []).map(skill => (
                <Badge key={skill} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </Card>

          {/* Experience */}
          {candidate.experience && candidate.experience.length > 0 && (
            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-4">Work Experience</h3>
              <div className="space-y-5">
                {candidate.experience.map((exp, i) => {
                  const years = `${new Date(exp.startDate).getFullYear()}${exp.current ? ' - Present' : exp.endDate ? ' - ' + new Date(exp.endDate).getFullYear() : ''}`;
                  return (
                    <div key={exp.id ?? i} className="flex gap-4">
                      <Avatar className="w-9 h-9 rounded-[10px] border border-border/70 shrink-0">
                        <AvatarFallback className="rounded-[10px] bg-muted text-muted-foreground font-semibold text-sm">
                          {exp.company[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-[13.5px]">{exp.title}</div>
                        <div className="text-[13px] text-muted-foreground">{exp.company} · {years}</div>
                        <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-relaxed">{exp.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Education */}
          {candidate.education && candidate.education.length > 0 && (
            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-foreground tracking-[-0.01em] mb-4">Education</h3>
              <div className="space-y-4">
                {candidate.education.map((edu, i) => (
                  <div key={edu.id ?? i} className="flex gap-4">
                    <Avatar className="w-9 h-9 rounded-[10px] border border-border/70 shrink-0">
                      <AvatarFallback className="rounded-[10px] bg-muted text-muted-foreground font-semibold text-sm">
                        {edu.institution[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-[13.5px]">{edu.degree} in {edu.field}</div>
                      <div className="text-[13px] text-muted-foreground">{edu.institution} · {edu.startYear} - {edu.endYear ?? 'Present'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
