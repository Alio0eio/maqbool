import { Router, type IRouter } from "express";
import {
  createCandidateProfileRequestSchema,
  updateCandidateProfileRequestSchema,
} from "@workspace/api-zod/candidates";
import { candidateProfiles, companies, db, jobs, savedJobs, users } from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { listJobsQuerySchema } from "@workspace/api-zod/jobs";
import { authenticate, authorize } from "../middlewares/auth";

type HttpError = Error & { statusCode: number };

function createHttpError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function getUserId(req: Express.Request): number {
  const userId = Number(req.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw createHttpError("Invalid authentication token", 401);
  }

  return userId;
}

async function findCandidateProfile(database: typeof db, userId: number) {
  const [profile] = await database
    .select({
      id: candidateProfiles.id,
      userId: candidateProfiles.userId,
      phone: candidateProfiles.phone,
      location: candidateProfiles.location,
      education: candidateProfiles.education,
      experience: candidateProfiles.experience,
      skills: candidateProfiles.skills,
      createdAt: candidateProfiles.createdAt,
      updatedAt: candidateProfiles.updatedAt,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(candidateProfiles)
    .innerJoin(users, eq(candidateProfiles.userId, users.id))
    .where(eq(candidateProfiles.userId, userId))
    .limit(1);

  return profile;
}

export function createCandidatesRouter(database: typeof db = db): IRouter {
  const router: IRouter = Router();

  router.post(
    "/candidates/profile",
    authenticate,
    authorize("candidate"),
    async (req, res, next) => {
      const parsed = createCandidateProfileRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        next(createHttpError("Invalid candidate profile data", 400));
        return;
      }

      try {
        const userId = getUserId(req);
        const [user] = await database
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user) {
          next(createHttpError("User not found", 404));
          return;
        }

        const existingProfile = await findCandidateProfile(database, userId);
        if (existingProfile) {
          next(createHttpError("Candidate profile already exists", 409));
          return;
        }

        await database.insert(candidateProfiles).values({
          userId,
          phone: parsed.data.phone,
          location: parsed.data.location,
          education: parsed.data.education,
          experience: parsed.data.experience,
          skills: parsed.data.skills,
        });

        const profile = await findCandidateProfile(database, userId);
        if (!profile) {
          next(createHttpError("Candidate profile could not be created", 500));
          return;
        }

        res.status(201).json(profile);
      } catch (error) {
        next(
          isUniqueViolation(error)
            ? createHttpError("Candidate profile already exists", 409)
            : createHttpError("Candidate profile creation failed", 500),
        );
      }
    },
  );

  router.get(
    "/candidates/profile",
    authenticate,
    authorize("candidate"),
    async (req, res, next) => {
      try {
        const profile = await findCandidateProfile(database, getUserId(req));
        if (!profile) {
          next(createHttpError("Candidate profile not found", 404));
          return;
        }

        res.status(200).json(profile);
      } catch (_error) {
        next(createHttpError("Candidate profile retrieval failed", 500));
      }
    },
  );

  router.get(
    "/candidates/saved-jobs",
    authenticate,
    authorize("candidate"),
    async (req, res, next) => {
      const parsed = listJobsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        next(createHttpError("Invalid saved jobs query parameters", 400));
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

        const { page, limit } = parsed.data;
        const where = eq(savedJobs.candidateId, candidate.id);
        const [{ count }] = await database
          .select({ count: sql<number>`count(*)` })
          .from(savedJobs)
          .where(where);
        const total = Number(count);
        const result = await database
          .select({
            id: savedJobs.id,
            jobId: jobs.id,
            savedAt: savedJobs.createdAt,
            job: {
              id: jobs.id,
              title: jobs.title,
              companyId: jobs.companyId,
              company: companies.name,
              companyLogoUrl: companies.logoUrl,
              location: jobs.location,
              locationType: jobs.locationType,
              type: jobs.type,
              experienceLevel: jobs.experienceLevel,
              salaryMin: jobs.salaryMin,
              salaryMax: jobs.salaryMax,
              salaryCurrency: jobs.salaryCurrency,
              postedAt: jobs.postedAt,
              createdAt: jobs.createdAt,
            },
          })
          .from(savedJobs)
          .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
          .innerJoin(companies, eq(jobs.companyId, companies.id))
          .where(where)
          .orderBy(desc(savedJobs.createdAt))
          .limit(limit)
          .offset((page - 1) * limit);

        res.status(200).json({
          jobs: result,
          pagination: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
        });
      } catch (error) {
        next(error);
      }
    },
  );

  router.put(
    "/candidates/profile",
    authenticate,
    authorize("candidate"),
    async (req, res, next) => {
      const parsed = updateCandidateProfileRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        next(createHttpError("Invalid candidate profile data", 400));
        return;
      }

      try {
        const userId = getUserId(req);
        const existingProfile = await findCandidateProfile(database, userId);
        if (!existingProfile) {
          next(createHttpError("Candidate profile not found", 404));
          return;
        }

        await database
          .update(candidateProfiles)
          .set({
            ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
            ...(parsed.data.location !== undefined
              ? { location: parsed.data.location }
              : {}),
            ...(parsed.data.education !== undefined
              ? { education: parsed.data.education }
              : {}),
            ...(parsed.data.experience !== undefined
              ? { experience: parsed.data.experience }
              : {}),
            ...(parsed.data.skills !== undefined ? { skills: parsed.data.skills } : {}),
            updatedAt: new Date(),
          })
          .where(eq(candidateProfiles.userId, userId));

        const profile = await findCandidateProfile(database, userId);
        if (!profile) {
          next(createHttpError("Candidate profile not found", 404));
          return;
        }

        res.status(200).json(profile);
      } catch (_error) {
        next(createHttpError("Candidate profile update failed", 500));
      }
    },
  );

  return router;
}

export default createCandidatesRouter();