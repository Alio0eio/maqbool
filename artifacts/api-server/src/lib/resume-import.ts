import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export interface ExtractedResumeProfile {
  phone?: string;
  location?: string;
  education?: string;
  experience?: string;
  skills?: string[];
  summary?: string;
  yearsOfExperience?: number;
}

export type ResumeTextReader = (buffer: Buffer, extension: ".pdf" | ".docx") => Promise<string>;

const sectionHeadings = [
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
] as const;

function normalizeText(value: string): string {
  return value.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim();
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
  const labeledPhone = text.match(/(?:phone|mobile|telephone|tel)\s*:\s*([+()\d][+()\d\s.-]{7,})/i);
  const possiblePhone = text.split("\n").find((line) => {
    const digitCount = (line.match(/\d/g) ?? []).length;
    return digitCount >= 10 && digitCount <= 15;
  });
  const phone = labeledPhone?.[1] ?? possiblePhone;
  const explicitLocation = text.match(/^\s*(?:location|based in|address)\s*:\s*(.+)$/im);
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

  if (phone) profile.phone = phone.replace(/\s+/g, " ").trim().slice(0, 30);
  if (explicitLocation?.[1]) profile.location = explicitLocation[1].trim().slice(0, 255);
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

  return profile;
}
