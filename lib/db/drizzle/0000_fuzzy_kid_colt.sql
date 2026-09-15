CREATE TYPE "public"."application_stage" AS ENUM('applied', 'screening', 'interview', 'decision', 'offer', 'hired', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('applied', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."company_member_status" AS ENUM('active', 'invited', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('pending', 'invited', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('async_video', 'live_video', 'phone', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."job_location_type" AS ENUM('remote', 'hybrid', 'onsite');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'published', 'closed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('full_time', 'part_time', 'contract', 'internship');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('candidate', 'recruiter', 'admin');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"status" "application_status" DEFAULT 'applied' NOT NULL,
	"stage" "application_stage" DEFAULT 'applied' NOT NULL,
	"resume_url" text,
	"cover_letter" text,
	"ai_score" numeric(5, 2),
	"ai_summary" text,
	"notes" text,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_job_candidate_unique" UNIQUE("job_id","candidate_id")
);
--> statement-breakpoint
CREATE TABLE "candidate_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"headline" varchar(255),
	"location" varchar(255),
	"phone" varchar(30),
	"education" text,
	"experience" text,
	"address" text,
	"resume_url" text,
	"portfolio_url" text,
	"linkedin_url" text,
	"github_url" text,
	"summary" text,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"years_of_experience" numeric(4, 1),
	"availability" varchar(100),
	"salary_expectation" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"industry" varchar(150),
	"website" text,
	"logo_url" text,
	"size" varchar(50),
	"location" varchar(255),
	"description" text,
	"culture" text,
	"benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(100) NOT NULL,
	"status" "company_member_status" DEFAULT 'invited' NOT NULL,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_members_company_user_unique" UNIQUE("company_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"type" "interview_type" NOT NULL,
	"status" "interview_status" DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"deadline" timestamp with time zone,
	"duration_minutes" integer,
	"invitation_note" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"department" varchar(150),
	"location" varchar(255) NOT NULL,
	"location_type" "job_location_type" NOT NULL,
	"type" "job_type" NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" varchar(3),
	"description" text,
	"requirements" text,
	"responsibilities" text,
	"benefits" text,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"experience_level" varchar(100),
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"posted_at" timestamp with time zone,
	"closing_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"name" varchar(200) NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_candidate_profiles_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_job_id_idx" ON "applications" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "applications_candidate_id_idx" ON "applications" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "applications_stage_idx" ON "applications" USING btree ("stage");--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_profiles_user_unique" ON "candidate_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "interviews_application_id_idx" ON "interviews" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "jobs_company_id_idx" ON "jobs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");