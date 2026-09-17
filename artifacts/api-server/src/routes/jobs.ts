import { Router, type IRouter } from "express";
import { getJobParamsSchema, listJobsQuerySchema } from "@workspace/api-zod/jobs";
import { applications, candidateProfiles, companies, db, jobs, savedJobs } from "@workspace/db";
import { and, asc, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { authenticate, authorize, optionalAuthenticate } from "../middlewares/auth";

type HttpError = Error & { statusCode: number };

function createHttpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

function getUserId(req: Express.Request): number {
  const userId = Number(req.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw createHttpError("Invalid authentication token", 401);
  }

  return userId;
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

  router.get("/jobs/:id", optionalAuthenticate, async (req, res, next) => {
    const parsed = getJobParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      next(createHttpError("Invalid job ID", 400));
      return;
    }

    const { id } = parsed.data;

    try {
      const [job] = await database
        .update(jobs)
        .set({ viewCount: sql`${jobs.viewCount} + 1` })
        .where(and(eq(jobs.id, id), eq(jobs.status, "published")))
        .returning({
          id: jobs.id,
          title: jobs.title,
          companyId: jobs.companyId,
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
        });

      if (!job) {
        next(createHttpError("Job not found", 404));
        return;
      }

      const [company] = await database
        .select({
          id: companies.id,
          name: companies.name,
          logo: companies.logoUrl,
          description: companies.description,
        })
        .from(companies)
        .where(eq(companies.id, job.companyId))
        .limit(1);

      let applicationStatus: (typeof applications.$inferSelect)["status"] | null = null;
      const userId = Number(req.user?.id);
      if (req.user?.role === "candidate" && Number.isSafeInteger(userId) && userId > 0) {
        const [application] = await database
          .select({ status: applications.status })
          .from(applications)
          .innerJoin(candidateProfiles, eq(applications.candidateId, candidateProfiles.id))
          .where(and(eq(applications.jobId, id), eq(candidateProfiles.userId, userId)))
          .limit(1);
        applicationStatus = application?.status ?? null;
      }

      res.status(200).json({ ...job, company, applicationStatus });
    } catch (error) {
      next(error);
    }
  });

  router.post("/jobs/:id/save", authenticate, authorize("candidate"), async (req, res, next) => {
    const parsed = getJobParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      next(createHttpError("Invalid job ID", 400));
      return;
    }

    try {
      const userId = getUserId(req);
      const [candidate] = await database
        .select({ id: candidateProfiles.id })
        .from(candidateProfiles)
        .where(eq(candidateProfiles.userId, userId))
        .limit(1);
      if (!candidate) {
        next(createHttpError("Candidate profile not found", 404));
        return;
      }

      const [job] = await database
        .select({ id: jobs.id })
        .from(jobs)
        .where(eq(jobs.id, parsed.data.id))
        .limit(1);
      if (!job) {
        next(createHttpError("Job not found", 404));
        return;
      }

      const [existing] = await database
        .select({ id: savedJobs.id })
        .from(savedJobs)
        .where(and(eq(savedJobs.candidateId, candidate.id), eq(savedJobs.jobId, job.id)))
        .limit(1);
      if (existing) {
        next(createHttpError("Job already saved", 409));
        return;
      }

      const [savedJob] = await database
        .insert(savedJobs)
        .values({ candidateId: candidate.id, jobId: job.id })
        .returning({ id: savedJobs.id, jobId: savedJobs.jobId, savedAt: savedJobs.createdAt });

      if (!savedJob) {
        next(createHttpError("Job could not be saved", 500));
        return;
      }

      res.status(201).json(savedJob);
    } catch (error) {
      next(isUniqueViolation(error) ? createHttpError("Job already saved", 409) : error);
    }
  });

  router.delete("/jobs/:id/save", authenticate, authorize("candidate"), async (req, res, next) => {
    const parsed = getJobParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      next(createHttpError("Invalid job ID", 400));
      return;
    }

    try {
      const userId = getUserId(req);
      const [candidate] = await database
        .select({ id: candidateProfiles.id })
        .from(candidateProfiles)
        .where(eq(candidateProfiles.userId, userId))
        .limit(1);
      if (!candidate) {
        next(createHttpError("Candidate profile not found", 404));
        return;
      }

      const [deleted] = await database
        .delete(savedJobs)
        .where(and(eq(savedJobs.candidateId, candidate.id), eq(savedJobs.jobId, parsed.data.id)))
        .returning({ id: savedJobs.id });
      if (!deleted) {
        next(createHttpError("Saved job not found", 404));
        return;
      }

      res.status(200).json({ success: true, message: "Job unsaved" });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default createJobsRouter();