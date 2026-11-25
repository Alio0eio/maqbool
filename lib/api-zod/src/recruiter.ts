import { z } from "zod";

export const recruiterTenantRoleSchema = z.enum([
  "owner",
  "admin",
  "recruiter",
  "hiring_manager",
  "billing_admin",
]);

export const recruiterMembershipStatusSchema = z.enum([
  "active",
  "invited",
  "inactive",
]);

export const recruiterCapabilitySchema = z.enum([
  "company.read",
  "company.update",
  "team.manage",
  "billing.manage",
  "jobs.manage",
  "applications.view",
  "applications.manage",
  "interviews.manage",
  "offers.manage",
  "messages.manage",
  "reports.view",
]);

const companyNameSchema = z.string().trim().min(1).max(255);
const companyIndustrySchema = z.string().trim().max(150).nullable().optional();
const companyWebsiteSchema = z.string().trim().url().nullable().optional();
const companyLogoUrlSchema = z.string().trim().url().nullable().optional();
const companySizeSchema = z.string().trim().max(50).nullable().optional();
const companyLocationSchema = z.string().trim().max(255).nullable().optional();
const companyDescriptionSchema = z.string().trim().max(5000).nullable().optional();
const companyCultureSchema = z.string().trim().max(5000).nullable().optional();
const companyBenefitsSchema = z.array(z.string().trim().min(1).max(150)).max(100).optional();

export const recruiterContextSchema = z
  .object({
    user: z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).max(200),
      email: z.string().email(),
      role: z.enum(["candidate", "recruiter", "admin"]),
    }),
    activeCompany: z
      .object({
        id: z.number().int().positive(),
        name: z.string().min(1).max(255),
        role: recruiterTenantRoleSchema,
        capabilities: z.array(recruiterCapabilitySchema),
      })
      .nullable(),
    memberships: z.array(
      z.object({
        companyId: z.number().int().positive(),
        companyName: z.string().min(1).max(255),
        role: recruiterTenantRoleSchema,
        status: recruiterMembershipStatusSchema,
      }),
    ),
  })
  .strict();

export const recruiterCompanyRegistrationSchema = z
  .object({
    name: companyNameSchema,
    industry: companyIndustrySchema,
    website: companyWebsiteSchema,
    logoUrl: companyLogoUrlSchema,
    size: companySizeSchema,
    location: companyLocationSchema,
    description: companyDescriptionSchema,
    culture: companyCultureSchema,
    benefits: companyBenefitsSchema,
  })
  .strict();

export const recruiterCompanyUpdateSchema = z
  .object({
    name: companyNameSchema.optional(),
    industry: companyIndustrySchema,
    website: companyWebsiteSchema,
    logoUrl: companyLogoUrlSchema,
    size: companySizeSchema,
    location: companyLocationSchema,
    description: companyDescriptionSchema,
    culture: companyCultureSchema,
    benefits: companyBenefitsSchema,
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    { message: "At least one company field is required" },
  );

export const recruiterActiveCompanySchema = z
  .object({
    companyId: z.coerce.number().int().positive(),
  })
  .strict();

export const recruiterInvitationCreateSchema = z
  .object({
    email: z.string().trim().email().max(320),
    role: z.enum(["admin", "recruiter", "hiring_manager", "billing_admin"]),
  })
  .strict();

export const recruiterInvitationAcceptSchema = z.object({}).strict();

export const recruiterTeamMemberUpdateSchema = z
  .object({
    role: recruiterTenantRoleSchema.optional(),
  })
  .strict()
  .refine((value) => value.role !== undefined, {
    message: "At least one team field is required",
  });

export const recruiterTeamParamsSchema = z
  .object({
    memberId: z.coerce.number().int().positive(),
  })
  .strict();

export const recruiterCandidateParamsSchema = z
  .object({
    candidateId: z.coerce.number().int().positive(),
  })
  .strict();

export const recruiterCandidateListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    jobId: z.coerce.number().int().positive().optional(),
    stage: z
      .enum(["applied", "screening", "interview", "decision", "offer", "hired", "rejected"])
      .optional(),
    sortBy: z.enum(["appliedAt", "updatedAt", "name"]).default("appliedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const recruiterApiErrorSchema = z
  .object({
    error: z.object({
      code: z.string().min(1).max(100),
      message: z.string().min(1).max(1000),
      details: z.unknown().optional(),
    }),
  })
  .strict();

export const recruiterListMetaSchema = z
  .object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
  .strict();

export type RecruiterTenantRole = z.infer<typeof recruiterTenantRoleSchema>;
export type RecruiterMembershipStatus = z.infer<typeof recruiterMembershipStatusSchema>;
export type RecruiterCapability = z.infer<typeof recruiterCapabilitySchema>;
export type RecruiterContext = z.infer<typeof recruiterContextSchema>;
export type RecruiterCompanyRegistration = z.infer<typeof recruiterCompanyRegistrationSchema>;
export type RecruiterCompanyUpdate = z.infer<typeof recruiterCompanyUpdateSchema>;
export type RecruiterActiveCompany = z.infer<typeof recruiterActiveCompanySchema>;
export type RecruiterInvitationCreate = z.infer<typeof recruiterInvitationCreateSchema>;
export type RecruiterInvitationAccept = z.infer<typeof recruiterInvitationAcceptSchema>;
export type RecruiterTeamMemberUpdate = z.infer<typeof recruiterTeamMemberUpdateSchema>;
export type RecruiterTeamParams = z.infer<typeof recruiterTeamParamsSchema>;
export type RecruiterCandidateParams = z.infer<typeof recruiterCandidateParamsSchema>;
export type RecruiterCandidateListQuery = z.infer<typeof recruiterCandidateListQuerySchema>;
export type RecruiterApiError = z.infer<typeof recruiterApiErrorSchema>;
