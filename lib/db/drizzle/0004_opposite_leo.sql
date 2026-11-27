ALTER TABLE "companies" DROP CONSTRAINT "companies_pending_registration_requires_applicant";--> statement-breakpoint
DROP INDEX "companies_one_pending_registration_per_applicant";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "verification_status";--> statement-breakpoint
DROP TYPE "public"."company_verification_status";