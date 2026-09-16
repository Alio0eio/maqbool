import { Router, type IRouter } from "express";
import { listJobsQuerySchema } from "@workspace/api-zod/jobs";
import { companies, db, jobs } from "@workspace/db";
import { and, asc, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";

type HttpError = Error & { statusCode: number };

function createHttpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

export function createJobsRouter(database: typeof db = db): IRouter {
  const router: IRouter = Router();

  router.get("/jobs", async (req, res, next) => {
    const parsed = listJobsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      next(createHttpError("Invalid job query parameters", 400));
      return;
    }

    const { page, limit, companyId, jobType, locationType, experienceLevel, minSalary, maxSalary, skills, sortBy, sortOrder } = parsed.data;
    const filters = [eq(jobs.status, "published")];

    if (companyId !== undefined) filters.push(eq(jobs.companyId, companyId));
    if (jobType !== undefined) filters.push(eq(jobs.type, jobType));
    if (locationType !== undefined) filters.push(eq(jobs.locationType, locationType));
    if (experienceLevel !== undefined) filters.push(eq(jobs.experienceLevel, experienceLevel));
    if (minSalary !== undefined) {
      filters.push(or(isNull(jobs.salaryMax), gte(jobs.salaryMax, minSalary))!);
    }
    if (maxSalary !== undefined) {
      filters.push(or(isNull(jobs.salaryMin), lte(jobs.salaryMin, maxSalary))!);
    }
    if (skills !== undefined) {
      filters.push(sql`${jobs.skills} @> ${JSON.stringify(skills)}::jsonb`);
    }

    const where = and(...filters);
    const orderColumn = sortBy === "salary" ? jobs.salaryMin : jobs.postedAt;
    const order = sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn);

    try {
      const [{ count }] = await database
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(where);
      const total = Number(count);
      const result = await database
        .select({
          id: jobs.id,
          title: jobs.title,
          companyId: jobs.companyId,
          company: companies.name,
          companyLogoUrl: companies.logoUrl,
          location: jobs.location,
          locationType: jobs.locationType,
          type: jobs.type,
          salaryMin: jobs.salaryMin,
          salaryMax: jobs.salaryMax,
          salaryCurrency: jobs.salaryCurrency,
          description: jobs.description,
          requirements: jobs.requirements,
          responsibilities: jobs.responsibilities,
          benefits: jobs.benefits,
          skills: jobs.skills,
          status: jobs.status,
          viewCount: jobs.viewCount,
          postedAt: jobs.postedAt,
          closingDate: jobs.closingDate,
          createdAt: jobs.createdAt,
          department: jobs.department,
          experienceLevel: jobs.experienceLevel,
        })
        .from(jobs)
        .innerJoin(companies, eq(jobs.companyId, companies.id))
        .where(where)
        .orderBy(order)
        .limit(limit)
        .offset((page - 1) * limit);

      res.status(200).json({
        jobs: result,
        pagination: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default createJobsRouter();