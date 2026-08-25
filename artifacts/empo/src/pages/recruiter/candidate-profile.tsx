import { useLocation, useParams } from 'wouter';
import { ArrowLeft, MapPin, Linkedin, Github, Mail, Calendar } from 'lucide-react';
import { MatchScoreBadge, AITag } from '@/components/shared/badges';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@workspace/design-system/button';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/design-system/avatar';
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

  const eyebrow = application
    ? `${application.stage.toUpperCase()} · APPLIED ${new Date(application.createdAt).toLocaleDateString()}`
    : `${candidate.yearsOfExp} YRS EXP · ${(candidate.availability ?? '').toUpperCase()}`;

  return (
    <div>
      <PageHeader
        title="Candidate Profile"
        eyebrow={eyebrow}
        className="mb-6"
        actions={
          <div className="flex items-center gap-2">
            <Button
              data-testid="btn-back"
              variant="ghost"
              size="icon"
              className="rounded-lg text-muted-foreground"
              onClick={() => setLocation('/recruiter/candidates')}
              aria-label="Back to candidates"
            >
              <ArrowLeft size={18} />
            </Button>
            <Button
              data-testid="btn-schedule-interview"
              variant="outline"
              onClick={() => setLocation('/recruiter/interviews')}
            >
              <Calendar size={15} className="mr-2" /> Schedule Interview
            </Button>
            <Button
              data-testid="btn-send-offer"
              onClick={() => setLocation('/recruiter/offers')}
            >
              <Mail size={15} className="mr-2" /> Send Offer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <Avatar className="w-20 h-20 mb-3">
                <AvatarImage src={candidate.avatarUrl || ""} alt={candidate.name} />
                <AvatarFallback className="bg-primary text-white font-bold text-2xl">
                  {candidate.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-display font-bold text-foreground">{candidate.name}</h2>
              <p className="text-sm text-muted-foreground">{candidate.headline}</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin size={13} /> {candidate.location}
              </div>
            </div>

            {aiScore != null && (
              <div className="flex items-center justify-center gap-3 py-3 bg-[#e7eeff] rounded-xl mb-4">
                <MatchScoreBadge score={aiScore} size="lg" />
                <div>
                  <div className="text-xs font-semibold text-[#00236f] flex items-center gap-1"><AITag /> AI Match Score</div>
                  <div className="text-xs text-[#64748B] mt-0.5">Top 5% of candidates</div>
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-mono font-medium">{candidate.yearsOfExp} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Availability</span>
                <span className="font-medium text-emerald-600">{candidate.availability}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salary Expectation</span>
                <span className="font-mono font-medium">${((candidate.salaryExpectation ?? 0) / 1000).toFixed(0)}k</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {candidate.linkedinUrl && (
                <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 py-2 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-all"
                >
                  <Linkedin size={14} /> LinkedIn
                </a>
              )}
              {candidate.githubUrl && (
                <a href={candidate.githubUrl} target="_blank" rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 py-2 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-all"
                >
                  <Github size={14} /> GitHub
                </a>
              )}
            </div>
          </div>

          {/* AI Score breakdown */}
          {aiScore != null && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-center gap-1 mb-3">
                <AITag />
                <span className="text-sm font-semibold text-foreground">Score Breakdown</span>
              </div>
              {[
                { label: 'Skill Match', value: skillMatch ?? 0 },
                { label: 'Experience Match', value: experienceMatch ?? 0 },
                { label: 'Culture Fit', value: Math.round(aiScore * 0.9) },
              ].map(({ label, value }) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono font-semibold" style={{ color: value >= 85 ? '#4ac08f' : value >= 65 ? '#f59e0b' : '#ef4444' }}>{value}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${value}%`, backgroundColor: value >= 85 ? '#4ac08f' : value >= 65 ? '#f59e0b' : '#ef4444' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-display font-semibold text-foreground mb-3">Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{candidate.summary || 'No summary provided.'}</p>
            {application?.aiSummary && (
              <div className="mt-4 p-3 bg-[#e7eeff] rounded-lg">
                <div className="flex items-center gap-1 mb-1"><AITag /><span className="text-xs font-semibold text-[#00236f]">AI Assessment</span></div>
                <p className="text-xs text-[#00236f]">{application.aiSummary}</p>
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-display font-semibold text-foreground mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(candidate.skills ?? []).map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full font-medium">{skill}</span>
              ))}
            </div>
          </div>

          {/* Experience */}
          {candidate.experience && candidate.experience.length > 0 && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Work Experience</h3>
              <div className="space-y-5">
                {candidate.experience.map((exp, i) => {
                  const years = `${new Date(exp.startDate).getFullYear()}${exp.current ? ' - Present' : exp.endDate ? ' - ' + new Date(exp.endDate).getFullYear() : ''}`;
                  return (
                    <div key={exp.id ?? i} className="flex gap-4">
                      <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-bold text-sm shrink-0">
                        {exp.company[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground text-sm">{exp.title}</div>
                        <div className="text-sm text-muted-foreground">{exp.company} · <span className="font-mono">{years}</span></div>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{exp.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Education */}
          {candidate.education && candidate.education.length > 0 && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Education</h3>
              <div className="space-y-4">
                {candidate.education.map((edu, i) => (
                  <div key={edu.id ?? i} className="flex gap-4">
                    <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-bold text-sm shrink-0">
                      {edu.institution[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{edu.degree} in {edu.field}</div>
                      <div className="text-sm text-muted-foreground">{edu.institution} · {edu.startYear} - {edu.endYear ?? 'Present'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
