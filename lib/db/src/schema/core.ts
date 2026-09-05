import { createInsertSchema } from "drizzle-zod";
import {
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["candidate", "recruiter", "admin"]);
export const companyMemberStatusEnum = pgEnum("company_member_status", [
  "active",
  "invited",
  "inactive",
]);
export const jobStatusEnum = pgEnum("job_status", ["draft", "published", "closed", "paused"]);
export const jobLocationTypeEnum = pgEnum("job_location_type", ["remote", "hybrid", "onsite"]);
export const jobTypeEnum = pgEnum("job_type", [
  "full_time",
  "part_time",
  "contract",
  "internship",
]);
export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "reviewing",
  "shortlisted",
  "interviewing",
  "offered",
  "rejected",
  "withdrawn",
]);
export const applicationStageEnum = pgEnum("application_stage", [
  "applied",
  "screening",
  "interview",
  "decision",
  "offer",
  "hired",
  "rejected",
]);
export const interviewTypeEnum = pgEnum("interview_type", [
  "async_video",
  "live_video",
  "phone",
  "in_person",
]);
export const interviewStatusEnum = pgEnum("interview_status", [
  "pending",
  "invited",
  "in_progress",
  "completed",
  "cancelled",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const candidateProfiles = pgTable(
  "candidate_profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    headline: varchar("headline", { length: 255 }),
    location: varchar("location", { length: 255 }),
    phone: varchar("phone", { length: 30 }),
    address: text("address"),
    resumeUrl: text("resume_url"),
    portfolioUrl: text("portfolio_url"),
    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
    summary: text("summary"),
    skills: jsonb("skills").$type<string[]>().default([]).notNull(),
    yearsOfExperience: numeric("years_of_experience", { precision: 4, scale: 1 }),
    availability: varchar("availability", { length: 100 }),
    salaryExpectation: integer("salary_expectation"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("candidate_profiles_user_unique").on(table.userId)],
);

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 150 }),
  website: text("website"),
  logoUrl: text("logo_url"),
  size: varchar("size", { length: 50 }),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  culture: text("culture"),
  benefits: jsonb("benefits").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const companyMembers = pgTable(
  "company_members",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 100 }).notNull(),
    status: companyMemberStatusEnum("status").notNull().default("invited"),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("company_members_company_user_unique").on(table.companyId, table.userId)],
);

export const jobs = pgTable(
  "jobs",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 255 }).notNull(),
    department: varchar("department", { length: 150 }),
    location: varchar("location", { length: 255 }).notNull(),
    locationType: jobLocationTypeEnum("location_type").notNull(),
    type: jobTypeEnum("type").notNull(),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: varchar("salary_currency", { length: 3 }),
    description: text("description"),
    requirements: text("requirements"),
    responsibilities: text("responsibilities"),
    benefits: text("benefits"),
    skills: jsonb("skills").$type<string[]>().default([]).notNull(),
    experienceLevel: varchar("experience_level", { length: 100 }),
    status: jobStatusEnum("status").notNull().default("draft"),
    viewCount: integer("view_count").notNull().default(0),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    closingDate: date("closing_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("jobs_company_id_idx").on(table.companyId), index("jobs_status_idx").on(table.status)],
);

export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => candidateProfiles.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").notNull().default("applied"),
    stage: applicationStageEnum("stage").notNull().default("applied"),
    resumeUrl: text("resume_url"),
    coverLetter: text("cover_letter"),
    aiScore: numeric("ai_score", { precision: 5, scale: 2 }),
    aiSummary: text("ai_summary"),
    notes: text("notes"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("applications_job_candidate_unique").on(table.jobId, table.candidateId),
    index("applications_job_id_idx").on(table.jobId),
    index("applications_candidate_id_idx").on(table.candidateId),
    index("applications_stage_idx").on(table.stage),
  ],
);

export const interviews = pgTable(
  "interviews",
  {
    id: serial("id").primaryKey(),
    applicationId: integer("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    type: interviewTypeEnum("type").notNull(),
    status: interviewStatusEnum("status").notNull().default("pending"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    deadline: timestamp("deadline", { withTimezone: true }),
    durationMinutes: integer("duration_minutes"),
    invitationNote: text("invitation_note"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("interviews_application_id_idx").on(table.applicationId)],
);

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCandidateProfileSchema = createInsertSchema(candidateProfiles).omit({ id: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true });
export const insertCompanyMemberSchema = createInsertSchema(companyMembers).omit({ id: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true });
export const insertInterviewSchema = createInsertSchema(interviews).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CandidateProfile = typeof candidateProfiles.$inferSelect;
export type InsertCandidateProfile = z.infer<typeof insertCandidateProfileSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type CompanyMember = typeof companyMembers.$inferSelect;
export type InsertCompanyMember = z.infer<typeof insertCompanyMemberSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

export type CoreSchema = {
  users: typeof users;
  candidateProfiles: typeof candidateProfiles;
  companies: typeof companies;
  companyMembers: typeof companyMembers;
  jobs: typeof jobs;
  applications: typeof applications;
  interviews: typeof interviews;
};
