import { z } from "zod";

const candidateProfileFields = {
  phone: z.string().trim().max(30, "Phone number is too long").nullable().optional(),
  location: z.string().trim().max(255, "Location is too long").nullable().optional(),
  education: z.string().trim().max(2000, "Education is too long").nullable().optional(),
  experience: z.string().trim().max(4000, "Experience is too long").nullable().optional(),
  skills: z
    .array(z.string().trim().min(1, "Skills cannot be empty").max(100, "Skill is too long"))
    .max(100, "Too many skills")
    .optional(),
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

export type CreateCandidateProfileRequest = z.infer<
  typeof createCandidateProfileRequestSchema
>;
export type UpdateCandidateProfileRequest = z.infer<
  typeof updateCandidateProfileRequestSchema
>;