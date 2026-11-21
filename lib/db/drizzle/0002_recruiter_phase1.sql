DO $$ BEGIN
 CREATE TYPE "recruiter_tenant_role" AS ENUM('owner','admin','recruiter','hiring_manager','billing_admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "company_members" ADD COLUMN "role_new" "recruiter_tenant_role";
UPDATE "company_members"
SET "role_new" = CASE lower(trim("role"))
  WHEN 'owner' THEN 'owner'::"recruiter_tenant_role"
  WHEN 'admin' THEN 'admin'::"recruiter_tenant_role"
  WHEN 'hiring manager' THEN 'hiring_manager'::"recruiter_tenant_role"
  WHEN 'hiring_manager' THEN 'hiring_manager'::"recruiter_tenant_role"
  WHEN 'billing admin' THEN 'billing_admin'::"recruiter_tenant_role"
  WHEN 'billing_admin' THEN 'billing_admin'::"recruiter_tenant_role"
  ELSE 'recruiter'::"recruiter_tenant_role"
END;
ALTER TABLE "company_members" ALTER COLUMN "role_new" SET NOT NULL;
ALTER TABLE "company_members" DROP COLUMN "role";
ALTER TABLE "company_members" RENAME COLUMN "role_new" TO "role";

CREATE TABLE "company_invitations" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL,
  "email" varchar(320) NOT NULL,
  "role" "recruiter_tenant_role" NOT NULL,
  "invited_by_user_id" integer NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "accepted_at" timestamp with time zone,
  "accepted_by_user_id" integer,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "company_invitations_token_hash_unique" UNIQUE("token_hash")
);

ALTER TABLE "company_invitations" ADD CONSTRAINT "company_invitations_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company_invitations" ADD CONSTRAINT "company_invitations_invited_by_user_id_users_id_fk"
  FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company_invitations" ADD CONSTRAINT "company_invitations_accepted_by_user_id_users_id_fk"
  FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "company_invitations_company_email_idx"
  ON "company_invitations" USING btree ("company_id","email");
