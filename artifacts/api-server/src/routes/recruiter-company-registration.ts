import { Router, type IRouter, type Request } from "express";
import { and, desc, eq } from "drizzle-orm";
import { companies, companyMembers, db } from "@workspace/db";
import { recruiterCompanyRegistrationSchema } from "@workspace/api-zod/recruiter";
import { authenticate, authorize } from "../middlewares/auth";

type HttpError = Error & { statusCode: number; code?: string; details?: unknown };

function createHttpError(
  message: string,
  statusCode: number,
  code: string,
  details?: unknown,
): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

function getApplicantId(req: Request): number {
  const userId = Number(req.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw createHttpError("Invalid authentication token", 401, "UNAUTHENTICATED");
  }
  return userId;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export function createRecruiterCompanyRegistrationRouter(
  database: typeof db = db,
): IRouter {
  const router: IRouter = Router();
  router.use(authenticate);

  router.post("/recruiter/company-registration", authorize("recruiter"), async (req, res, next) => {
    const parsed = recruiterCompanyRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      next(
        createHttpError(
          "Invalid company registration data",
          400,
          "VALIDATION_ERROR",
          parsed.error.flatten(),
        ),
      );
      return;
    }

    let applicantUserId: number;
    try {
      applicantUserId = getApplicantId(req);
    } catch (error) {
      next(error);
      return;
    }

    try {
      const registration = await database.transaction(async (transaction) => {
        const [existingCompany] = await transaction
          .select({ id: companies.id })
          .from(companies)
          .where(eq(companies.applicantUserId, applicantUserId))
          .orderBy(desc(companies.createdAt))
          .limit(1);

        const [company] = existingCompany
          ? await transaction
              .update(companies)
              .set({
                ...parsed.data,
                updatedAt: new Date(),
              })
              .where(eq(companies.id, existingCompany.id))
              .returning({ id: companies.id })
          : await transaction
              .insert(companies)
              .values({
                ...parsed.data,
                applicantUserId,
              })
              .returning({ id: companies.id });

        const [membership] = await transaction
          .select({ id: companyMembers.id })
          .from(companyMembers)
          .where(
            and(
              eq(companyMembers.companyId, company.id),
              eq(companyMembers.userId, applicantUserId),
            ),
          )
          .limit(1);

        if (!membership) {
          await transaction
            .insert(companyMembers)
            .values({
              companyId: company.id,
              userId: applicantUserId,
              role: "owner",
              status: "active",
              joinedAt: new Date(),
            })
            .returning({ id: companyMembers.id });
        }

        return company;
      });

      if (!registration) {
        next(createHttpError("Unable to create the company workspace", 500, "WORKSPACE_CREATION_FAILED"));
        return;
      }

      res.status(201).json({
        registration: {
          id: registration.id,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        next(createHttpError("A company workspace already exists for this account", 409, "WORKSPACE_EXISTS"));
        return;
      }
      next(error);
    }
  });

  router.get("/recruiter/company-registration/me", authorize("recruiter"), async (req, res, next) => {
    let applicantUserId: number;
    try {
      applicantUserId = getApplicantId(req);
    } catch (error) {
      next(error);
      return;
    }

    try {
      const [registration] = await database
        .select({
          id: companies.id,
          company: {
            id: companies.id,
            name: companies.name,
            industry: companies.industry,
            website: companies.website,
            logoUrl: companies.logoUrl,
            size: companies.size,
            location: companies.location,
            description: companies.description,
            culture: companies.culture,
            benefits: companies.benefits,
          },
        })
        .from(companies)
        .where(eq(companies.applicantUserId, applicantUserId))
        .orderBy(desc(companies.createdAt))
        .limit(1);

      if (!registration) {
        next(
          createHttpError(
            "No company workspace was found for this account",
            404,
            "COMPANY_NOT_FOUND",
          ),
        );
        return;
      }

      res.status(200).json({ registration });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default createRecruiterCompanyRegistrationRouter();
