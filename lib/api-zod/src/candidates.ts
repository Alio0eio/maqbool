import { z } from "zod";

export const applicationStatuses = [
  "applied",
  "reviewing",
  "shortlisted",
  "interviewing",
  "offered",
  "rejected",
  "withdrawn",
] as const;

export const applicationStages = [
  "applied",
  "screening",
  "interview",
  "decision",
  "offer",
  "hired",
  "rejected",
] as const;

const candidateProfileFields = {
  headline: z.string().trim().min(1, "Headline cannot be empty").max(255, "Headline is too long").optional(),
  phone: z.string().trim().max(30, "Phone number is too long").nullable().optional(),
  location: z.string().trim().max(255, "Location is too long").nullable().optional(),
  education: z.string().trim().max(2000, "Education is too long").nullable().optional(),
  experience: z.string().trim().max(4000, "Experience is too long").nullable().optional(),
  skills: z
    .array(z.string().trim().min(1, "Skills cannot be empty").max(100, "Skill is too long"))
    .min(1, "At least one skill is required")
    .max(100, "Too many skills")
    .refine((skills) => new Set(skills).size === skills.length, "Skills cannot contain duplicates")
    .optional(),
  yearsOfExperience: z.number().int("Years of experience must be a whole number").min(0, "Years of experience cannot be negative").max(100, "Years of experience is too high").optional(),
  portfolioUrl: z.string().trim().min(1, "Portfolio URL cannot be empty").url("Portfolio URL must be a valid URL").optional(),
  linkedinUrl: z.string().trim().min(1, "LinkedIn URL cannot be empty").url("LinkedIn URL must be a valid URL").optional(),
  githubUrl: z.string().trim().min(1, "GitHub URL cannot be empty").url("GitHub URL must be a valid URL").optional(),
};

export const createCandidateProfileRequestSchema = z
  .object(candidateProfileFields)
  .strict()
  .transform((value) => ({ ...value, skills: value.skills ?? [] }));

export const updateCandidateProfileRequestSchema = z
  .object(candidateProfileFields)
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one candidate profile field is required",
  });

export const listCandidateApplicationsQuerySchema = z
  .object({
    status: z.enum(applicationStatuses).optional(),
    stage: z.enum(applicationStages).optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type CreateCandidateProfileRequest = z.infer<
  typeof createCandidateProfileRequestSchema
>;
export type UpdateCandidateProfileRequest = z.infer<
  typeof updateCandidateProfileRequestSchema
>;
export type ListCandidateApplicationsQuery = z.infer<
  typeof listCandidateApplicationsQuerySchema
>;
