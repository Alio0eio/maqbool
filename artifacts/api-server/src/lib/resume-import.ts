import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export interface ExtractedResumeProfile {
  headline?: string;
  location?: string;
  education?: string;
  experience?: string;
  skills?: string[];
  summary?: string;
  yearsOfExperience?: number;
  availability?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export type ResumeTextReader = (buffer: Buffer, extension: ".pdf" | ".docx") => Promise<string>;

const sectionHeadings = [
  "headline",
  "professional headline",
  "summary",
  "professional summary",
  "profile",
  "objective",
  "experience",
  "work experience",
  "employment history",
  "professional experience",
  "education",
  "skills",
  "technical skills",
  "portfolio",
  "portfolio url",
  "availability",
] as const;

function normalizeText(value: string): string {
  return value.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
}

function normalizeUrl(value: string | undefined): string | undefined {
  const candidate = value?.match(/(?:https?:\/\/|www\.)[^\s<>()]+/i)?.[0].replace(/[),.;]+$/, "");
  if (!candidate) return undefined;

  try {
    return new URL(candidate.startsWith("www.") ? `https://${candidate}` : candidate).toString();
  } catch {
    return undefined;
  }
}

function extractSection(text: string, headings: readonly string[]): string | undefined {
  const lines = text.split("\n");
  const headingPattern = new RegExp(`^\\s*(?:${headings.join("|")})\\s*:?\\s*$`, "i");
  const sectionPattern = new RegExp(`^\\s*(?:${sectionHeadings.join("|")})\\s*:?\\s*$`, "i");
  const start = lines.findIndex((line) => headingPattern.test(line));
  if (start < 0) return undefined;

  const content: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (sectionPattern.test(line)) break;
    content.push(line);
  }

  const section = content.join("\n").trim();
  return section || undefined;
}

export const readResumeText: ResumeTextReader = async (buffer, extension) => {
  const text = extension === ".pdf"
    ? (await pdfParse(buffer)).text
    : (await mammoth.extractRawText({ buffer })).value;
  return normalizeText(text);
};

export function extractResumeProfile(text: string): ExtractedResumeProfile {
  const profile: ExtractedResumeProfile = {};
  const headline =
    text.match(/^\s*(?:professional\s+)?headline\s*:\s*(.+)$/im)?.[1] ??
    extractSection(text, ["headline", "professional headline"]);
  const explicitLocation = text.match(/^\s*(?:location|based in)\s*:\s*(.+)$/im);
  const availability = text.match(/^\s*availability\s*:\s*(.+)$/im)?.[1];
  const years = text.match(/\b(\d{1,2})\+?\s+years?\s+(?:of\s+)?experience\b/i);
  const summary = extractSection(text, ["summary", "professional summary", "profile", "objective"]);
  const experience = extractSection(text, [
    "experience",
    "work experience",
    "employment history",
    "professional experience",
  ]);
  const education = extractSection(text, ["education"]);
  const skillsText = extractSection(text, ["skills", "technical skills"]);

  if (headline) profile.headline = headline.trim().slice(0, 255);
  if (explicitLocation?.[1]) profile.location = explicitLocation[1].trim().slice(0, 255);
  if (availability) profile.availability = availability.trim().slice(0, 100);
  if (years) profile.yearsOfExperience = Number(years[1]);
  if (summary) profile.summary = summary.slice(0, 4000);
  if (experience) profile.experience = experience.slice(0, 4000);
  if (education) profile.education = education.slice(0, 2000);
  if (skillsText) {
    const skills = skillsText
      .split(/[,;|\n•●▪]/)
      .map((skill) => skill.replace(/^\s*[-*]\s*/, "").trim())
      .filter((skill) => skill.length > 0 && skill.length <= 100);
    const uniqueSkills = [...new Set(skills)].slice(0, 100);
    if (uniqueSkills.length > 0) profile.skills = uniqueSkills;
  }

  const urls = [...text.matchAll(/(?:https?:\/\/|www\.)[^\s<>()]+/gi)]
    .map(([value]) => normalizeUrl(value))
    .filter((url): url is string => url !== undefined);
  const linkedInUrl = urls.find((url) => {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com");
  });
  const githubUrl = urls.find((url) => {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "github.com" || hostname.endsWith(".github.com");
  });
  const portfolioContent =
    text.match(/^\s*portfolio(?:\s+url)?\s*:\s*(.+)$/im)?.[1] ??
    extractSection(text, ["portfolio", "portfolio url"]);
  const portfolioUrl = normalizeUrl(portfolioContent);
  if (portfolioUrl) profile.portfolioUrl = portfolioUrl;
  if (linkedInUrl) profile.linkedinUrl = linkedInUrl;
  if (githubUrl) profile.githubUrl = githubUrl;

  return profile;
}
