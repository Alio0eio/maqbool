CREATE TYPE "public"."company_verification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "verification_status" "company_verification_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "applicant_user_id" integer;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_applicant_user_id_users_id_fk" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "companies_one_pending_registration_per_applicant" ON "companies" USING btree ("applicant_user_id") WHERE "companies"."verification_status" = 'pending';--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_pending_registration_requires_applicant" CHECK ("companies"."verification_status" <> 'pending' OR "companies"."applicant_user_id" IS NOT NULL);