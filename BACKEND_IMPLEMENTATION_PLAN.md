# Backend Implementation Plan - Empo Recruitment Platform

## 1. Project Overview

This document outlines the step-by-step implementation plan for the **Empo Recruitment Platform** backend system and PostgreSQL database. The platform is a comprehensive recruitment management system that connects candidates and recruiters, facilitating job applications, interview scheduling, and candidate evaluation through AI-assisted scoring.

### Key Objectives
- Build a scalable, production-ready backend API
- Implement robust database schema with proper constraints and indexes
- Create secure authentication and authorization system
- Develop RESTful API endpoints for all core features
- Integrate AI-powered candidate evaluation
- Enable real-time candidate and recruiter interactions

---

## 2. Tech Stack

### Backend Framework
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5.2.1
- **Language**: TypeScript 5.9.3
- **Package Manager**: pnpm (workspace monorepo)

### Database & ORM
- **Database**: PostgreSQL 14+
- **ORM**: Drizzle ORM v0.x
- **Migration Tool**: Drizzle Kit
- **Query Builder**: Native Drizzle

### Authentication & Security
- **Password Hashing**: bcryptjs (to be added)
- **JWT**: jsonwebtoken (to be added)
- **Validation**: Zod (schema validation)
- **CORS**: Express CORS middleware

### Utilities
- **Logging**: Pino v9.14.0 with pino-http middleware
- **HTTP Client**: Fetch API (native)
- **Environment Management**: dotenv

### Development Tools
- **Build**: ESBuild 0.27.3
- **Linting**: ESLint (to be configured)
- **Code Formatting**: Prettier 3.9.5
- **Type Checking**: TypeScript compiler

---

## 3. Database Schema Overview

### Core Tables (Already Designed)

#### 1. **users**
- Central authentication table for all users
- Columns: id, email, passwordHash, role, name, avatarUrl, createdAt, updatedAt
- Roles: `candidate`, `recruiter`, `admin`
- Indexes: `users_email_unique`

#### 2. **candidateProfiles**
- Extended profile information for candidates
- Links: Foreign key to `users` (cascade delete)
- Fields: headline, location, phone, skills (JSONB array), yearsOfExperience, salaryExpectation, etc.

#### 3. **companies**
- Company/employer information
- Fields: name, industry, website, logoUrl, size, location, benefits (JSONB array)

#### 4. **companyMembers**
- Team members within a company with different roles
- Links: Foreign keys to `companies` and `users`
- Status: `active`, `invited`, `inactive`
- Constraints: Unique (companyId, userId) pair

#### 5. **jobs**
- Job postings created by recruiters
- Links: Foreign key to `companies` (restrict delete)
- Types: Full-time, Part-time, Contract, Internship
- Status: Draft, Published, Closed, Paused
- Location Types: Remote, Hybrid, Onsite
- Indexed fields: company_id, status

#### 6. **applications**
- Job applications submitted by candidates
- Links: Foreign keys to `jobs` and `candidateProfiles` (cascade delete)
- Statuses: Applied, Reviewing, Shortlisted, Interviewing, Offered, Rejected, Withdrawn
- Stages: Applied, Screening, Interview, Decision, Offer, Hired, Rejected
- Features: AI scoring, AI summary, notes
- Indexes: job_id, candidate_id, stage

#### 7. **interviews**
- Interview scheduling and tracking
- Links: Foreign key to `applications` (cascade delete)
- Types: Async Video, Live Video, Phone, In-person
- Status: Pending, Invited, In-progress, Completed, Cancelled
- Fields: scheduledAt, deadline, durationMinutes, completedAt

### Enums Defined
- `user_role`: candidate, recruiter, admin
- `company_member_status`: active, invited, inactive
- `job_status`: draft, published, closed, paused
- `job_location_type`: remote, hybrid, onsite
- `job_type`: full_time, part_time, contract, internship
- `application_status`: applied, reviewing, shortlisted, interviewing, offered, rejected, withdrawn
- `application_stage`: applied, screening, interview, decision, offer, hired, rejected
- `interview_type`: async_video, live_video, phone, in_person
- `interview_status`: pending, invited, in_progress, completed, cancelled

---

## 4. Implementation Phases

### Phase 1: Foundation & Database Setup ✅ (Ready)
**Status**: Schema already designed
**Duration**: 1-2 days (implementation)

#### Tasks:
- [ ] 1.1 Create `.env` file with `DATABASE_URL`
- [ ] 1.2 Provision PostgreSQL database (cloud provider or local)
- [ ] 1.3 Run `pnpm run push` in `/lib/db` to push schema to database
- [ ] 1.4 Verify all tables and indexes created successfully
- [ ] 1.5 Create database backup strategy

**Deliverables**:
- ✅ Drizzle schema definitions (already in `lib/db/src/schema/core.ts`)
- Live PostgreSQL database with all tables
- Initial migration checkpoint

**Success Criteria**:
- All 7 tables exist in database
- All enums created
- All unique constraints in place
- All indexes created

---

### Phase 2: API Server Setup & Middleware
**Duration**: 1-2 days

#### Tasks:
- [ ] 2.1 Configure Express.js application entry point
  - Initialize Express app
  - Setup middleware order (cors, json, cookie-parser, pino-http)
  - Setup error handling middleware
  - Setup not-found handler

- [x] 2.2 Setup authentication middleware
  - JWT token verification middleware
  - Role-based access control (RBAC) middleware
  - Error messages for unauthorized access

- [x] 2.3 Setup logging configuration
  - Configure Pino logger with production/development levels
  - Setup pino-http for request/response logging
  - Log file rotation strategy

- [x] 2.4 Environment configuration
  - Load environment variables safely
  - Validate required env vars at startup
  - Setup different configs for dev/prod/test

**Deliverables**:
- Main server entry point (`artifacts/api-server/src/index.ts`)
- Middleware stack configured
- Error handling system
- Logging infrastructure

**Success Criteria**:
- Server starts without errors
- All middleware initialized
- Proper logging output visible

---

### Phase 3: Authentication & User Management
**Duration**: 2-3 days

#### 3.1 User Registration & Authentication
- [x] 3.1.1 Install auth dependencies: `bcryptjs`, `jsonwebtoken`, `@types/jsonwebtoken`
- [x] 3.1.2 Create authentication utilities
  - Password hashing/verification functions
  - JWT token generation/verification
  - Token refresh logic

**Progress update (2026-09-08)**: Authentication dependencies, reusable password/JWT utilities, registration, login, logout, and refresh-token rotation endpoints are implemented.

- [x] 3.1.3 Implement registration endpoint
  - `POST /auth/register` - User signup
  - Email validation
  - Password strength validation using Zod
  - Duplicate email check
  - Auto-generate user record

- [x] 3.1.4 Implement login endpoint
  - `POST /auth/login` - User login
  - Email/password verification
  - JWT token generation
  - Return user profile data

- [x] 3.1.5 Implement logout endpoint
  - `POST /auth/logout` - Token invalidation
  - Token blacklist strategy (optional)

- [x] 3.1.6 Implement refresh token endpoint
  - `POST /auth/refresh` - Get new access token
  - Token rotation strategy

#### 3.2 User Profile Management
- [x] 3.2.1 Get current user endpoint
  - `GET /auth/me` - Fetch authenticated user info
  - Join with role-specific profile data

**Implementation update (2026-09-14)**: `GET /auth/me` is implemented at `/api/auth/me` using the existing JWT middleware. It loads the user by the verified JWT subject, returns only public user fields, includes a candidate profile when one exists, and returns centralized `401` or `404` errors for authentication and missing-user cases. Tests cover authentication enforcement, JWT-subject lookup, profile inclusion, safe responses, and missing users.

- [x] 3.2.2 Update user profile endpoint
  - `PUT /auth/profile` - Update basic user info
  - Update name, avatar, etc.

**Implementation update (2026-09-14)**: `PUT /auth/profile` is implemented at `/api/auth/profile` using the existing JWT middleware, strict partial Zod validation, and Drizzle updates scoped to the authenticated JWT subject. It supports name and avatar URL updates, rejects protected or unknown fields, returns safe public user data, and is covered by authenticated, validation, and protected-field tests.

**Files to Create**:
- `artifacts/api-server/src/routes/auth.ts` - Auth routes
- `artifacts/api-server/src/middleware/auth.ts` - Auth middleware
- `artifacts/api-server/src/utils/auth.ts` - Auth utilities
- `lib/api-zod/src/auth.ts` - Auth schemas

**Deliverables**:
- JWT-based authentication system
- Secure password handling
- User registration and login flows
- Profile management endpoints

**Success Criteria**:
- User can register and login
- JWT tokens are generated correctly
- Protected endpoints reject unauthorized requests
- Tokens refresh properly

---

### Phase 4: Candidate Features
**Duration**: 2-3 days

#### 4.1 Candidate Profile Management
- [x] 4.1.1 Create/Setup candidate profile endpoint
  - `POST /candidates/profile` - Create initial profile
  - `GET /candidates/profile` - Get own profile
  - `PUT /candidates/profile` - Update profile
  - Autofill from user data
  - Handle JSONB skills array

- [x] 4.1.2 Implement profile validation schemas
  - Headline validation
  - Years of experience validation
  - Skills list validation
  - URL validation for portfolio, LinkedIn, GitHub

**Implementation update (2026-09-15)**: Candidate profile create and update
schemas now validate trimmed headlines, whole-number experience from 0 to 100,
bounded non-empty skills with duplicate prevention, and optional valid portfolio,
LinkedIn, and GitHub URLs. The update schema remains partial while requiring at
least one field.

#### 4.2 Job Browsing & Search
- [ ] 4.2.1 Get all jobs endpoint
  - `GET /jobs` - List all published jobs
  - Pagination support
  - Filter by:
    - Company
    - Job type (full-time, contract, etc.)
    - Location type (remote, hybrid, onsite)
    - Experience level
    - Salary range
    - Skills
  - Sort by (posted date, relevance, salary, etc.)

- [ ] 4.2.2 Get single job endpoint
  - `GET /jobs/:id` - Fetch job details
  - Include company info
  - Increment view count
  - Include application status (if candidate applied)

- [ ] 4.2.3 Save/unsave job endpoints
  - `POST /jobs/:id/save` - Save job as favorite
  - `DELETE /jobs/:id/save` - Unsave job
  - `GET /candidates/saved-jobs` - List saved jobs
  - *Note: Requires additional `saved_jobs` junction table*

#### 4.3 Job Application
- [ ] 4.3.1 Submit application endpoint
  - `POST /jobs/:id/apply` - Submit job application
  - Check if already applied (prevent duplicates)
  - Default to "applied" status
  - Auto-attach candidate's resume
  - Optional cover letter

- [ ] 4.3.2 Get application list endpoint
  - `GET /candidates/applications` - List all applications
  - Include job details
  - Include current stage/status
  - Filter by status/stage
  - Sort by date

- [ ] 4.3.3 Get single application endpoint
  - `GET /applications/:id` - Application details
  - Include interview info if applicable
  - Include feedback if rejected

- [ ] 4.3.4 Withdraw application endpoint
  - `DELETE /applications/:id` - Withdraw application
  - Only if in withdrawable status

**Files to Create**:
- `artifacts/api-server/src/routes/candidates.ts`
- `artifacts/api-server/src/routes/jobs.ts`
- `artifacts/api-server/src/routes/applications.ts`
- `lib/api-zod/src/candidates.ts`
- `lib/api-zod/src/jobs.ts`
- `lib/api-zod/src/applications.ts`

**Deliverables**:
- Complete candidate profile management
- Job discovery and search functionality
- Application submission and tracking

**Success Criteria**:
- Candidates can create/update profiles
- Job search filters work correctly
- Applications are created with proper validation
- Application status updates are tracked

---

### Phase 5: Recruiter Features
**Duration**: 2-3 days

#### 5.1 Company Management
- [ ] 5.1.1 Create company endpoint
  - `POST /companies` - Create new company
  - Only by authorized users
  - Auto-add creator as owner

- [ ] 5.1.2 Get company details endpoint
  - `GET /companies/:id` - Company profile
  - Include company members
  - Include job count

- [ ] 5.1.3 Update company endpoint
  - `PUT /companies/:id` - Update company info
  - Authorization check (owner/admin)

- [ ] 5.1.4 Manage company members
  - `POST /companies/:id/members` - Invite team member
  - `GET /companies/:id/members` - List members
  - `PUT /companies/:id/members/:memberId` - Update member role/status
  - `DELETE /companies/:id/members/:memberId` - Remove member

#### 5.2 Job Management
- [ ] 5.2.1 Create job endpoint
  - `POST /companies/:companyId/jobs` - Create job posting
  - Include all job details
  - Auto-set status to "draft"
  - Validate recruiter is company member

- [ ] 5.2.2 Get company jobs endpoint
  - `GET /companies/:companyId/jobs` - List all jobs for company
  - Filter by status (draft, published, closed, paused)

- [ ] 5.2.3 Update job endpoint
  - `PUT /jobs/:id` - Update job posting
  - Can update status (publish, close, pause)
  - Update job details

- [ ] 5.2.4 Delete job endpoint
  - `DELETE /jobs/:id` - Delete job (only if draft)
  - Authorization checks

- [ ] 5.2.5 Publish job endpoint
  - `PATCH /jobs/:id/publish` - Publish job
  - Set status to "published"
  - Set posted date

#### 5.3 Application Review Pipeline
- [ ] 5.3.1 Get applications for job
  - `GET /jobs/:jobId/applications` - List applications for a job
  - Filter by stage/status
  - Sort by AI score (highest first)
  - Include candidate preview info

- [ ] 5.3.2 Get candidate comparison
  - `GET /jobs/:jobId/candidates/compare` - Compare multiple candidates
  - *Note: Requires `candidate_comparison` table for saved comparisons*

- [ ] 5.3.3 Update application status
  - `PATCH /applications/:id/status` - Change application status
  - Update stage based on workflow
  - Log status changes

- [ ] 5.3.4 Add notes to application
  - `PUT /applications/:id/notes` - Add internal notes
  - Multiple notes per application
  - *Note: May require `application_notes` table*

- [ ] 5.3.5 Reject application
  - `PATCH /applications/:id/reject` - Reject candidate
  - Require rejection reason
  - Send notification to candidate

**Files to Create**:
- `artifacts/api-server/src/routes/companies.ts`
- `artifacts/api-server/src/routes/recruiter.ts` (dashboard routes)
- `lib/api-zod/src/companies.ts`
- `lib/api-zod/src/recruiter.ts`

**Deliverables**:
- Full company management system
- Job posting lifecycle management
- Application review and evaluation workflow

**Success Criteria**:
- Recruiters can create and manage companies
- Job postings can transition through all states
- Applications can be reviewed and updated
- Proper access control on all endpoints

---

### Phase 6: Interview Management
**Duration**: 2-3 days

#### 6.1 Interview Scheduling
- [ ] 6.1.1 Create interview endpoint
  - `POST /applications/:applicationId/interviews` - Schedule interview
  - Set type (async video, live video, phone, in-person)
  - Set scheduled date/deadline
  - Generate interview link (if applicable)
  - Auto-set status to "pending"

- [ ] 6.1.2 Get interviews endpoint
  - `GET /candidates/interviews` - List candidate's interviews
  - `GET /companies/:companyId/interviews` - List company's interviews
  - Filter by status
  - Sort by date

- [ ] 6.1.3 Get single interview endpoint
  - `GET /interviews/:id` - Interview details
  - Include application and candidate info
  - Include interview recording link (if completed)

#### 6.2 Interview Workflow
- [ ] 6.2.1 Send interview invitation
  - `POST /interviews/:id/invite` - Send invitation to candidate
  - Set status to "invited"
  - Send notification/email

- [ ] 6.2.2 Update interview status
  - `PATCH /interviews/:id/status` - Update interview status
  - Allowed transitions: pending → invited → in_progress → completed

- [ ] 6.2.3 Cancel interview
  - `PATCH /interviews/:id/cancel` - Cancel interview
  - Set status to "cancelled"
  - Notify both parties

- [ ] 6.2.4 Complete interview
  - `PATCH /interviews/:id/complete` - Mark as completed
  - Set completedAt timestamp
  - Trigger feedback request

#### 6.3 Interview Feedback
- [ ] 6.3.1 Submit interview feedback
  - `POST /interviews/:id/feedback` - Recruiter submits feedback
  - Rating/score
  - Comments
  - Recommendation (pass/fail)
  - *Note: Requires `interview_feedback` table*

- [ ] 6.3.2 Get interview feedback
  - `GET /interviews/:id/feedback` - Retrieve feedback
  - Only by interview participants

**Files to Create**:
- `artifacts/api-server/src/routes/interviews.ts`
- `lib/api-zod/src/interviews.ts`

**Schema Updates Needed**:
- Add `interview_feedback` table
- Add `feedback` field to applications (for final decision)

**Deliverables**:
- Complete interview scheduling system
- Interview status workflow
- Interview feedback collection

**Success Criteria**:
- Interviews can be scheduled with all details
- Status updates follow proper workflow
- Feedback is collected and stored

---

### Phase 7: AI Integration
**Duration**: 2-3 days

#### 7.1 AI Candidate Scoring
- [ ] 7.1.1 Setup AI service integration
  - Create service for external AI API calls
  - Implement rate limiting
  - Handle API errors gracefully

- [ ] 7.1.2 Score candidates on application
  - `POST /applications/:id/score` - Trigger AI scoring
  - Compare candidate skills to job requirements
  - Generate AI score (0-100)
  - Generate AI summary
  - Store results in application

- [ ] 7.1.3 Bulk score candidates
  - `POST /jobs/:jobId/score-all` - Score all applications for job
  - Run async job

- [ ] 7.1.4 Get AI insights
  - `GET /applications/:id/ai-insights` - Get detailed AI analysis
  - Skill gaps
  - Strengths
  - Recommendations

#### 7.2 AI Interview Analysis
- [ ] 7.2.1 Analyze async video interview
  - Process submitted async video
  - Extract and analyze responses
  - Generate transcript
  - Score performance
  - *Note: Requires `interview_analysis` table*

- [ ] 7.2.2 Generate interview report
  - `GET /interviews/:id/report` - AI-generated report
  - Key takeaways
  - Recommendation

**Files to Create**:
- `artifacts/api-server/src/services/ai.ts`
- `artifacts/api-server/src/routes/ai.ts`
- `lib/api-zod/src/ai.ts`

**Deliverables**:
- AI scoring and analysis integration
- Background job processing for bulk operations
- AI-generated insights and reports

**Success Criteria**:
- Candidates get AI scores based on job fit
- AI summaries are generated and stored
- Async video analysis works correctly

---

### Phase 8: Notifications & Communication
**Duration**: 2 days

#### 8.1 Email Notifications
- [ ] 8.1.1 Setup email service
  - Configure email provider (SendGrid, AWS SES, etc.)
  - Setup email templates

- [ ] 8.1.2 Implement notification triggers
  - Application submitted
  - Application status changed
  - Interview scheduled
  - Interview feedback received
  - Offer extended

#### 8.2 In-App Notifications
- [ ] 8.2.1 Create notifications table
- [ ] 8.2.2 Store notifications on events
- [ ] 8.2.3 Retrieve notifications endpoint
- [ ] 8.2.4 Mark notifications as read

**Files to Create**:
- `artifacts/api-server/src/services/notifications.ts`
- `artifacts/api-server/src/services/email.ts`
- `lib/db/src/schema/notifications.ts`

**Schema Updates Needed**:
- Add `notifications` table

---

### Phase 9: Admin Features
**Duration**: 1-2 days

#### 9.1 Admin Dashboard Endpoints
- [ ] 9.1.1 Get system statistics
  - Total users, companies, jobs, applications
  - Trends over time

- [ ] 9.1.2 User management
  - `GET /admin/users` - List all users
  - `PATCH /admin/users/:id` - Update user role
  - `DELETE /admin/users/:id` - Deactivate user

- [ ] 9.1.3 Content moderation
  - `GET /admin/jobs` - Flag inappropriate job postings
  - `GET /admin/profiles` - Review profiles

#### 9.2 Analytics
- [ ] 9.2.1 Recruitment funnel
  - Applications → Interviews → Offers → Hired
  - Conversion rates

- [ ] 9.2.2 Recruiter performance
  - Hiring speed metrics
  - Job posting success rates

---

### Phase 10: Testing & Validation
**Duration**: 2-3 days

#### 10.1 Unit Tests
- [ ] 10.1.1 Install testing framework (Jest, Vitest)
- [ ] 10.1.2 Test utility functions
- [ ] 10.1.3 Test validation schemas

#### 10.2 Integration Tests
- [ ] 10.2.1 Test API endpoints
- [ ] 10.2.2 Test database operations
- [ ] 10.2.3 Test authentication flows
- [ ] 10.2.4 Test error handling

---

#### 10.3 Performance Testing
- [ ] 10.3.1 Load testing with k6 or Artillery
- [ ] 10.3.2 Database query optimization
- [ ] 10.3.3 Identify bottlenecks

**Files to Create**:
- `artifacts/api-server/src/__tests__/` - Test directory
- `artifacts/api-server/jest.config.js` - Jest configuration
- `.github/workflows/test.yml` - CI/CD pipeline

**Deliverables**:
- Comprehensive test coverage (>80%)
- Performance benchmarks
- Load testing results

---

### Phase 11: Deployment & DevOps
**Duration**: 2 days

#### 11.1 Docker & Containerization
- [ ] 11.1.1 Create Dockerfile for API server
- [ ] 11.1.2 Create docker-compose.yml for local development
- [ ] 11.1.3 Setup container registry

#### 11.2 CI/CD Pipeline
- [ ] 11.2.1 Setup GitHub Actions workflows
  - On push: lint, build, test
  - On release: deploy to production

- [ ] 11.2.2 Database migration automation
- [ ] 11.2.3 Health checks and monitoring

#### 11.3 Production Setup
- [ ] 11.3.1 Configure production database
- [ ] 11.3.2 Setup environment variables for production
- [ ] 11.3.3 Configure logging and monitoring (Sentry, Datadog)
- [ ] 11.3.4 Setup backup and disaster recovery

**Files to Create**:
- `Dockerfile` - Container image
- `docker-compose.yml` - Local dev environment
- `.github/workflows/` - CI/CD workflows
- `vercel.json` - Vercel deployment config (already exists)

**Deliverables**:
- Containerized application
- Automated CI/CD pipeline
- Production-ready deployment

---

### Phase 12: Documentation & API Spec
**Duration**: 1-2 days

#### 12.1 API Documentation
- [ ] 12.1.1 Generate OpenAPI/Swagger spec
- [ ] 12.1.2 Setup Swagger UI for interactive docs
- [ ] 12.1.3 Document all endpoints with examples

#### 12.2 Developer Documentation
- [ ] 12.2.1 Setup guide for new developers
- [ ] 12.2.2 Architecture documentation
- [ ] 12.2.3 Database schema documentation
- [ ] 12.2.4 API authentication guide
- [ ] 12.2.5 Contributing guidelines

**Files to Create**:
- `docs/API.md` - API reference
- `docs/ARCHITECTURE.md` - System architecture
- `docs/SETUP.md` - Developer setup guide
- `docs/DATABASE.md` - Database schema guide

---

## 5. Folder Structure & Organization

```
artifacts/api-server/src/
├── index.ts                 # Server entry point
├── middleware/
│   ├── auth.ts             # JWT verification, RBAC
│   ├── error.ts            # Error handling
│   └── validation.ts       # Request validation
├── routes/
│   ├── auth.ts             # Authentication routes
│   ├── candidates.ts       # Candidate routes
│   ├── companies.ts        # Company routes
│   ├── jobs.ts             # Job posting routes
│   ├── applications.ts     # Application routes
│   ├── interviews.ts       # Interview routes
│   ├── ai.ts               # AI service routes
│   └── admin.ts            # Admin routes
├── services/
│   ├── auth.ts             # Authentication logic
│   ├── candidate.ts        # Candidate business logic
│   ├── company.ts          # Company logic
│   ├── job.ts              # Job posting logic
│   ├── application.ts      # Application logic
│   ├── interview.ts        # Interview logic
│   ├── ai.ts               # AI service integration
│   ├── notifications.ts    # Notification logic
│   └── email.ts            # Email service
├── utils/
│   ├── auth.ts             # Password hashing, JWT
│   ├── validation.ts       # Validation helpers
│   ├── errors.ts           # Custom error classes
│   ├── constants.ts        # App constants
│   └── logger.ts           # Logger setup
├── types/
│   └── index.ts            # Type definitions
└── __tests__/
    ├── unit/               # Unit tests
    ├── integration/        # Integration tests
    └── fixtures/           # Test data

lib/api-zod/src/
├── auth.ts                 # Auth schemas
├── candidates.ts           # Candidate schemas
├── companies.ts            # Company schemas
├── jobs.ts                 # Job schemas
├── applications.ts         # Application schemas
├── interviews.ts           # Interview schemas
├── ai.ts                   # AI schemas
└── index.ts                # Export all schemas

lib/db/src/
├── index.ts                # Database connection
├── schema/
│   ├── core.ts             # ✅ Main tables (done)
│   ├── notifications.ts    # Notifications table (to add)
│   ├── interview-feedback.ts # Interview feedback (to add)
│   └── index.ts            # Schema exports
└── migrations/             # Migration files (auto-generated)
```

---

## 6. Database Enhancement Tasks

### Tables to Add (Phase 8+)

#### `saved_jobs` (Candidate favorites)
```sql
id SERIAL PRIMARY KEY
candidate_id INTEGER REFERENCES candidate_profiles ON DELETE CASCADE
job_id INTEGER REFERENCES jobs ON DELETE CASCADE
saved_at TIMESTAMP DEFAULT NOW()
UNIQUE(candidate_id, job_id)
```

#### `notifications`
```sql
id SERIAL PRIMARY KEY
user_id INTEGER REFERENCES users ON DELETE CASCADE
title VARCHAR(255) NOT NULL
message TEXT NOT NULL
type VARCHAR(50) NOT NULL
related_id INTEGER (polymorphic - application, interview, etc.)
is_read BOOLEAN DEFAULT FALSE
created_at TIMESTAMP DEFAULT NOW()
```

#### `interview_feedback`
```sql
id SERIAL PRIMARY KEY
interview_id INTEGER REFERENCES interviews ON DELETE CASCADE
recruiter_id INTEGER REFERENCES users ON DELETE SET NULL
rating INTEGER (1-5)
comments TEXT
recommendation VARCHAR(50) (pass, fail, maybe)
created_at TIMESTAMP DEFAULT NOW()
```

#### `application_notes`
```sql
id SERIAL PRIMARY KEY
application_id INTEGER REFERENCES applications ON DELETE CASCADE
recruiter_id INTEGER REFERENCES users ON DELETE SET NULL
note TEXT NOT NULL
created_at TIMESTAMP DEFAULT NOW()
```

---

## 7. Key Implementation Considerations

### Security
1. ✅ Password hashing with bcryptjs (min 10 salt rounds)
2. ✅ JWT tokens with short expiry (15-30 min access, 7-30 days refresh)
3. ✅ Rate limiting on auth endpoints
4. ✅ CORS configuration with specific origins
5. ✅ SQL injection prevention (Drizzle ORM)
6. ✅ XSS protection via proper input validation
7. ✅ HTTPS requirement in production
8. ✅ Secrets management with environment variables

### Performance
1. ✅ Database indexes on frequently queried columns
2. ✅ Pagination for large result sets (default 20 per page)
3. ✅ Caching strategy for job listings (Redis optional)
4. ✅ Async processing for AI scoring
5. ✅ Connection pooling with pg Pool
6. ✅ Denormalization of frequently accessed data where needed

### Scalability
1. ✅ Monorepo structure for code sharing
2. ✅ Stateless API design for horizontal scaling
3. ✅ Background job queue for long-running tasks
4. ✅ Database read replicas (future consideration)
5. ✅ CDN for static assets

### Error Handling
1. ✅ Comprehensive error messages (not exposing internals)
2. ✅ Proper HTTP status codes
3. ✅ Error logging with Pino
4. ✅ Graceful degradation for external service failures

### Logging
1. ✅ Request/response logging with pino-http
2. ✅ Error stack traces in development
3. ✅ Performance metrics logging
4. ✅ Audit trail for sensitive operations

---

## 8. Development Workflow

### Prerequisites
```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL
```

### Database Workflows
```bash
# Push schema changes to database
cd lib/db && pnpm run push

# Force push (dev only)
cd lib/db && pnpm run push-force

# Generate migrations
drizzle-kit generate --config lib/db/drizzle.config.ts
```

### API Server Development
```bash
# Run dev server with hot reload
cd artifacts/api-server && pnpm run dev

# Type check
pnpm run typecheck

# Build
cd artifacts/api-server && pnpm run build
```

### Testing
```bash
# Run all tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage
pnpm run test:coverage
```

---

## 9. Timeline & Milestones

| Phase | Title | Duration | Start | End |
|-------|-------|----------|-------|-----|
| 1 | Database Setup | 1-2d | Week 1 | Week 1 |
| 2 | Server Foundation | 1-2d | Week 1 | Week 1 |
| 3 | Authentication | 2-3d | Week 1-2 | Week 2 |
| 4 | Candidate Features | 2-3d | Week 2 | Week 2-3 |
| 5 | Recruiter Features | 2-3d | Week 3 | Week 3-4 |
| 6 | Interview Management | 2-3d | Week 4 | Week 4-5 |
| 7 | AI Integration | 2-3d | Week 5 | Week 5-6 |
| 8 | Notifications | 2d | Week 6 | Week 6 |
| 9 | Admin Features | 1-2d | Week 6 | Week 6-7 |
| 10 | Testing | 2-3d | Week 7 | Week 7-8 |
| 11 | Deployment | 2d | Week 8 | Week 8 |
| 12 | Documentation | 1-2d | Week 8 | Week 8 |
| | **TOTAL** | **~25-35 days** | | |

**Estimated Start to Production: 5-7 weeks** (assuming full-time development)

---

## 10. Success Metrics

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] ESLint passes all checks
- [ ] Code coverage >80%
- [ ] No console errors in logs

### Performance
- [ ] API response time <200ms (p95)
- [ ] Database queries optimized
- [ ] Zero N+1 query problems
- [ ] Pagination implemented on all lists

### Security
- [ ] All endpoints require authentication (except public ones)
- [ ] Password hashing verified
- [ ] SQL injection tests pass
- [ ] CORS properly configured
- [ ] Secrets not in code

### User Experience
- [ ] All workflows are intuitive
- [ ] Error messages are helpful
- [ ] API documentation is complete
- [ ] Example requests provided

---

## 11. Rollback & Contingency Plan

### Database Migrations
- Before each migration, backup production database
- Test migrations on staging environment first
- Keep rollback scripts for critical changes
- Version migrations with timestamps

### Deployment Rollback
- Keep previous Docker image tags for quick rollback
- Monitor error rates post-deployment
- Have database restore procedure documented
- Setup automated alerts for errors

---

## 12. Next Steps

1. **Immediately**: 
   - [ ] Provision PostgreSQL database
   - [ ] Set DATABASE_URL in .env
   - [ ] Run `pnpm run push` to create tables

2. **This Week** (Phases 1-2):
   - [ ] Setup Express server foundation
   - [ ] Configure middleware stack
   - [ ] Setup logging and error handling

3. **Next**: 
   - Start Phase 3: Authentication
   - Begin API endpoint implementation
   - Setup test infrastructure

---

## 13. Resources & References

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [REST API Design](https://restfulapi.net/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Document Version**: 1.0  
**Last Updated**: 2026-08-31  
**Status**: Ready for Implementation

