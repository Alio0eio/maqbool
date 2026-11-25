import { Router, type IRouter, type Request } from "express";
import { and, desc, eq } from "drizzle-orm";
import { companies, db } from "@workspace/db";
import { recruiterCompanyRegistrationSchema } from "@workspace/api-zod/recruiter";
import { authenticate } from "../middlewares/auth";

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

  router.post("/recruiter/company-registration", async (req, res, next) => {
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
        const [pendingRegistration] = await transaction
          .select({ id: companies.id })
          .from(companies)
          .where(
            and(
              eq(companies.applicantUserId, applicantUserId),
              eq(companies.verificationStatus, "pending"),
            ),
          )
          .limit(1);

        if (pendingRegistration) return null;

        const [company] = await transaction
          .insert(companies)
          .values({
            ...parsed.data,
            applicantUserId,
            verificationStatus: "pending",
          })
          .returning({
            id: companies.id,
            verificationStatus: companies.verificationStatus,
          });

        return company;
      });

      if (!registration) {
        next(
          createHttpError(
            "A company registration is already pending for this account",
            409,
            "PENDING_REGISTRATION_EXISTS",
          ),
        );
        return;
      }

      res.status(201).json({
        registration: {
          id: registration.id,
          status: registration.verificationStatus,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        next(
          createHttpError(
            "A company registration is already pending for this account",
            409,
            "PENDING_REGISTRATION_EXISTS",
          ),
        );
        return;
      }
      next(error);
    }
  });

  router.get("/recruiter/company-registration/me", async (req, res, next) => {
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
          status: companies.verificationStatus,
          rejectionReason: companies.rejectionReason,
          submittedAt: companies.createdAt,
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
            "No company registration was found for this account",
            404,
            "REGISTRATION_NOT_FOUND",
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
