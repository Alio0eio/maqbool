import { z } from "zod";

const optionalNonNegativeInteger = z.coerce.number().int().min(0).optional();

export const getJobParamsSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

export const listJobsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    companyId: z.coerce.number().int().positive().optional(),
    jobType: z.enum(["full_time", "part_time", "contract", "internship"]).optional(),
    locationType: z.enum(["remote", "hybrid", "onsite"]).optional(),
    experienceLevel: z.string().trim().min(1).max(100).optional(),
    minSalary: optionalNonNegativeInteger,
    maxSalary: optionalNonNegativeInteger,
    skills: z
      .string()
      .transform((value) => value.split(",").map((skill) => skill.trim()).filter(Boolean))
      .refine((skills) => skills.length > 0 && skills.length <= 20, "Invalid skills filter")
      .optional(),
    sortBy: z.enum(["postedAt", "salary"]).default("postedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .refine(
    (query) => query.minSalary === undefined || query.maxSalary === undefined || query.minSalary <= query.maxSalary,
    { message: "minSalary must be less than or equal to maxSalary", path: ["minSalary"] },
  );

export type GetJobParams = z.infer<typeof getJobParamsSchema>;
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;
