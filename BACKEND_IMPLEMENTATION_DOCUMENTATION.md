# Empo Backend Implementation Documentation

This document records the database and backend implementation completed so far, following `BACKEND_IMPLEMENTATION_PLAN.md` through Phase 3.2.1. It describes the code currently present in the repository.

## 1. Repository and Backend Foundation

1. The project uses a pnpm workspace monorepo.
2. The API server lives in `artifacts/api-server` and is a private ESM package.
3. The backend uses Node.js, Express 5, TypeScript, Drizzle ORM, PostgreSQL, Pino, dotenv, JWT, bcryptjs, and Zod-related workspace packages.
4. The API server has separate source areas for configuration, middleware, routes, and reusable libraries.
5. The server is built with the existing ESBuild-based build script and typechecked with the package TypeScript configuration.

## 2. Database Implementation

### 2.1 Database and ORM setup

1. PostgreSQL is the target database, with PostgreSQL 14 or newer specified by the plan.
2. Drizzle ORM is used for the schema and native query-building layer.
3. The database schema is defined in `lib/db/src/schema/core.ts`.
4. The database package exports the schema through its existing schema index and database package entry points.
5. Drizzle-Zod creates insert validation schemas from the database definitions.
6. The schema exports both table objects and TypeScript select/insert types for application code.

### 2.2 PostgreSQL enums

The schema defines the following PostgreSQL enums before defining the tables that use them:

1. `user_role`: `candidate`, `recruiter`, `admin`.
2. `company_member_status`: `active`, `invited`, `inactive`.
3. `job_status`: `draft`, `published`, `closed`, `paused`.
4. `job_location_type`: `remote`, `hybrid`, `onsite`.
5. `job_type`: `full_time`, `part_time`, `contract`, `internship`.
6. `application_status`: `applied`, `reviewing`, `shortlisted`, `interviewing`, `offered`, `rejected`, `withdrawn`.
7. `application_stage`: `applied`, `screening`, `interview`, `decision`, `offer`, `hired`, `rejected`.
8. `interview_type`: `async_video`, `live_video`, `phone`, `in_person`.
9. `interview_status`: `pending`, `invited`, `in_progress`, `completed`, `cancelled`.

Using database enums keeps role, status, stage, type, and workflow values constrained at the database level.

### 2.3 `users` table

The `users` table is the central identity and authentication table.

1. `id` is an auto-incrementing serial primary key.
2. `email` is required and supports up to 320 characters.
3. `password_hash` stores the bcrypt password hash, never the plaintext password.
4. `role` uses the `user_role` enum and is required.
5. `name` is required and supports up to 200 characters.
6. `avatar_url` is optional.
7. `created_at` and `updated_at` use timezone-aware timestamps and default to the current time.
8. `users_email_unique` is a unique index, preventing duplicate email addresses.

### 2.4 `candidate_profiles` table

This table stores candidate-specific information separately from the core user identity.

1. `id` is an auto-incrementing serial primary key.
2. `user_id` references `users.id` and cascades on user deletion.
3. The candidate profile includes headline, location, phone, address, resume URL, portfolio URL, LinkedIn URL, GitHub URL, and summary fields.
4. `skills` is a required JSONB string array with an empty-array default.
5. `years_of_experience` uses numeric precision and scale suitable for fractional years.
6. Availability and salary expectation are stored as optional fields.
7. Created and updated timestamps are included.
8. `candidate_profiles_user_unique` ensures each user has at most one candidate profile.

### 2.5 `companies` table

This table stores employer information.

1. It has a serial primary key and required company name.
2. Optional fields include industry, website, logo URL, company size, location, description, and culture.
3. `benefits` is a required JSONB string array with an empty-array default.
4. Created and updated timestamps are included.

### 2.6 `company_members` table

This junction table connects users to companies.

1. `company_id` references `companies.id` and cascades when a company is deleted.
2. `user_id` references `users.id` and cascades when a user is deleted.
3. A required role string stores the member's company-specific role.
4. `status` uses `company_member_status` and defaults to `invited`.
5. `joined_at` records when membership began and is optional.
6. `created_at` records membership creation.
7. `company_members_company_user_unique` prevents duplicate membership rows for the same company and user pair.

### 2.7 `jobs` table

This table stores recruiter-created job postings.

1. `company_id` references `companies.id` with restrict-on-delete behavior, preventing deletion of a company that still owns jobs.
2. Required job fields include title, location, location type, and job type.
3. Optional fields include department, salary range, salary currency, description, requirements, responsibilities, benefits, experience level, posted time, and closing date.
4. `skills` is a required JSONB string array with an empty-array default.
5. `status` uses `job_status` and defaults to `draft`.
6. `view_count` is required and defaults to zero.
7. Created and updated timestamps are included.
8. `jobs_company_id_idx` supports company-based job queries.
9. `jobs_status_idx` supports filtering by publication status.

### 2.8 `applications` table

This table connects candidates to jobs and tracks the recruitment workflow.

1. `job_id` references `jobs.id` and cascades when a job is deleted.
2. `candidate_id` references `candidate_profiles.id` and cascades when a candidate profile is deleted.
3. `status` uses `application_status` and defaults to `applied`.
4. `stage` uses `application_stage` and defaults to `applied`.
5. Resume URL and cover letter fields support application materials.
6. `ai_score`, `ai_summary`, notes, and rejection reason support later evaluation features.
7. Created and updated timestamps are included.
8. `applications_job_candidate_unique` prevents a candidate from applying to the same job more than once.
9. Indexes support job lookup, candidate lookup, and stage filtering.

### 2.9 `interviews` table

This table stores interviews associated with applications.

1. `application_id` references `applications.id` and cascades when an application is deleted.
2. `type` uses `interview_type`.
3. `status` uses `interview_status` and defaults to `pending`.
4. Scheduling, deadline, duration, invitation note, and completion timestamp fields are available.
5. Created and updated timestamps are included.
6. `interviews_application_id_idx` supports application-based interview lookup.

### 2.10 Generated database schemas and types

For each core table, the schema creates a Drizzle-Zod insert schema with the auto-generated `id` omitted:

- `insertUserSchema`
- `insertCandidateProfileSchema`
- `insertCompanySchema`
- `insertCompanyMemberSchema`
- `insertJobSchema`
- `insertApplicationSchema`
- `insertInterviewSchema`

The schema also exports inferred types for select and insert operations, including `User`, `CandidateProfile`, `Company`, `CompanyMember`, `Job`, `Application`, and `Interview`.

### 2.11 Database phase status

The core database schema is already designed and implemented in code. The plan still lists environment provisioning, pushing the schema to a live PostgreSQL database, verifying the generated database objects, and creating a backup strategy as operational tasks. Those database operations are not represented as completed by the current source files.

## 3. Backend Server Implementation

### 3.1 API server entry point

1. `artifacts/api-server/src/index.ts` imports the Express app, configuration, and logger.
2. The server calls `app.listen(config.port, ...)`.
3. A listen error is logged and exits the process with status `1`.
4. A successful startup logs the active port.

### 3.2 Express application and middleware order

The application in `artifacts/api-server/src/app.ts` configures the following request pipeline:

1. CORS is configured from `config.corsOrigins`; no configured list uses the default CORS behavior.
2. `express.json()` parses JSON bodies.
3. `cookie-parser` parses request cookies.
4. `pino-http` attaches request and response logging.
5. Request serialization records request id, method, and path without query parameters.
6. Response serialization records the status code.
7. `express.urlencoded({ extended: true })` parses URL-encoded bodies.
8. The application router is mounted at `/api`.
9. Unmatched routes use the not-found handler.
10. Errors use the centralized error handler.

### 3.3 Authentication middleware and RBAC

The authentication middleware is implemented in `artifacts/api-server/src/middlewares/auth.ts`.

1. Supported user roles are restricted to `candidate`, `recruiter`, and `admin`.
2. Express's `Request` type is extended with an optional authenticated user containing id, role, email, and name values.
3. `authenticate` reads the `Authorization` header.
4. The header must match `Bearer <token>`.
5. Missing authorization returns a `401` authentication-required error.
6. Malformed authorization returns a `401` invalid-credentials error.
7. The token is verified with the configured access secret and allowed algorithm.
8. The token payload must contain a non-empty string `sub` claim and a supported role.
9. Valid claims are copied to `req.user`.
10. `authorize(...roles)` checks that authentication exists and that the user role is allowed.
11. Missing authentication returns `401`; a disallowed role returns `403`.

### 3.4 Logging configuration

The logger is implemented in `artifacts/api-server/src/lib/logger.ts`.

1. Pino uses the validated configured log level.
2. Log timestamps use ISO time formatting.
3. Authorization headers, cookies, and `Set-Cookie` headers are redacted.
4. Development and test environments use `pino-pretty` for readable local logs.
5. Production uses structured Pino output without the pretty transport.
6. `pino-http` uses this logger for request and response events.

### 3.5 Environment configuration

The configuration module is implemented in `artifacts/api-server/src/config/index.ts`.

1. `dotenv/config` loads environment variables before configuration is evaluated.
2. `NODE_ENV` accepts `development`, `production`, or `test`, defaulting to `development`.
3. `PORT` is required and must be between 1 and 65535.
4. `LOG_LEVEL` is validated against the supported Pino levels.
5. Development defaults to `debug`; other environments default to `info`.
6. `JWT_ALGORITHM` accepts `HS256`, `HS384`, or `HS512`, defaulting to `HS256`.
7. `CORS_ORIGIN` supports comma-separated, trimmed origins.
8. `DATABASE_URL` is loaded when provided.
9. Access and refresh JWT secrets can be configured independently.
10. Legacy `JWT_SECRET` is supported as a fallback for both token secrets.
11. Test mode has a test-only fallback secret.
12. Production requires effective access and refresh secrets of at least 32 characters.
13. Access tokens default to a 15-minute lifetime and refresh tokens default to 7 days.

The root `.env.example` documents the server, CORS, logging, JWT, and database variables.

### 3.6 Authentication dependencies and development command (Task 3.1.1)

1. `bcryptjs` was added to hash and verify passwords.
2. `jsonwebtoken` is used for JWT creation and verification.
3. `@types/jsonwebtoken` supplies JWT TypeScript definitions.
4. `cross-env` was added for cross-platform environment variable assignment.
5. The API server development script now sets `NODE_ENV=development`, builds the server, and starts the generated output.
6. The pnpm lockfile records the added dependency versions and resolutions.

### 3.7 Reusable authentication utilities (Task 3.1.2)

The reusable utilities are implemented in `artifacts/api-server/src/lib/auth.ts`.

#### Password functions

1. `hashPassword(password)` hashes passwords with bcrypt using 12 salt rounds.
2. `verifyPassword(password, passwordHash)` compares a supplied password to its stored bcrypt hash.

#### Access-token functions

1. `generateAccessToken(userId)` creates a JWT with the user id in the `sub` claim.
2. It uses the access secret, configured algorithm, and access expiration setting.
3. `verifyAccessToken(token)` verifies the signature, algorithm, expiration, and required subject claim.

#### Refresh-token functions

1. `generateRefreshToken(userId)` creates a JWT with the user id in the `sub` claim.
2. It uses the separate refresh secret, configured algorithm, and refresh expiration setting.
3. `verifyRefreshToken(token)` verifies the refresh token with the refresh secret.

#### Shared token validation

1. String JWT payloads are rejected.
2. A non-empty string `sub` claim is required.
3. Invalid, expired, malformed, or subject-less tokens become a consistent `401` error.
4. Separate access and refresh secrets prevent cross-purpose token acceptance.

### 3.8 User registration endpoint (Task 3.1.3)

The registration endpoint is implemented through the existing API router hierarchy. Because the Express application mounts the root router at `/api`, the complete runtime URL is `POST /api/auth/register`.

#### Request validation

1. `registerRequestSchema` is defined in the shared `@workspace/api-zod/auth` module.
2. The request requires `email`, `password`, and `name`, matching the required fields in the `users` table.
3. Email input is trimmed and must pass Zod email validation.
4. Password input must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.
5. Name input is trimmed, must not be empty, and is limited to the database column's 200-character maximum.
6. Failed validation is converted to a safe `400 Invalid registration data` error through the existing centralized error handler.

#### User creation

1. The route normalizes the validated email to lowercase before querying or inserting it.
2. It checks the `users` table for an existing email before hashing or inserting.
3. Existing accounts return `409 An account with that email already exists` without database details.
4. The password is hashed with the existing `hashPassword` bcrypt utility using the configured 12 salt rounds.
5. New users receive the default `candidate` role.
6. The insert supplies only email, password hash, role, and name. The database generates the serial id and timestamp defaults.
7. A PostgreSQL unique-constraint violation (`23505`) is translated to the same safe `409` response, covering concurrent registration race conditions.

#### Response and security

1. Successful registration returns HTTP `201 Created`.
2. The response contains `message` and a public `user` object with only `id`, `email`, and `name`.
3. Plaintext passwords, password hashes, roles, timestamps, and database error details are not returned.
4. Unexpected errors are passed to the existing centralized error handler rather than handled in the route.

#### Tests added

The native Node test suite in `artifacts/api-server/src/register.test.ts` covers:

1. Successful registration and HTTP 201 response.
2. Email trimming and lowercase normalization.
3. Password hashing and verification against the stored hash.
4. Absence of password and password hash in the response.
5. Invalid email.
6. Password shorter than eight characters.
7. Missing uppercase, lowercase, number, and special character requirements.
8. Missing required fields.
9. Duplicate email conflict responses without internal database details.

The API server package now exposes a `test` script using the workspace's existing `tsx` runtime and Node's built-in test module. The router also exports `createAuthRouter(database)` so endpoint tests can use an isolated fake database without a live PostgreSQL instance.

### 3.9 User login endpoint (Task 3.1.4)

The login endpoint is implemented through the same auth router and is available at `POST /api/auth/login` because the Express application mounts the root router at `/api`.

#### Request validation and authentication

1. `loginRequestSchema` in the shared `@workspace/api-zod/auth` module requires a valid email and a provided password.
2. The validated email is trimmed by Zod and normalized to lowercase before the user lookup.
3. The route selects only the user id, email, password hash, and name needed for authentication and the response.
4. The stored password hash is checked with the existing `verifyPassword` bcrypt utility; plaintext comparison and duplicate password logic are not used.
5. Missing users and incorrect passwords return the same generic `401 Invalid email or password` response.
6. Successful authentication creates an access JWT with the existing `generateAccessToken` utility and the user id in the `sub` claim.

#### Response and security

1. Successful login returns HTTP `200` with `message`, `token`, and a user object containing only `id`, `email`, and `name`.
2. Passwords, password hashes, JWT secrets, roles, and other database fields are not returned.
3. Invalid email or missing password input returns HTTP `400 Invalid login data` through the existing centralized error handler.
4. Unexpected route errors are forwarded to the existing centralized error handler.

#### Tests added

The API server test suite covers successful login, JWT subject generation, safe user response fields, nonexistent email, incorrect password, invalid email, and missing password. The authentication failure cases verify that nonexistent and incorrect credentials receive the same generic response.

### 3.10 User logout endpoint (Task 3.1.5)

The logout endpoint is implemented through the existing auth router and is available at `POST /api/auth/logout` because the Express application mounts the root router at `/api`.

#### Token revocation flow

1. Access tokens now include a unique `jti` claim alongside the user `sub`, standard `iat`, and `exp` claims. Refresh tokens also receive a `jti` so existing refresh-token verification remains compatible.
2. The route uses the existing `Authorization: Bearer <token>` convention and the shared `authenticate` middleware.
3. The middleware verifies access tokens through the existing `verifyAccessToken` utility, then checks the token's `jti` against the revocation store.
4. Logout stores only the `jti` and original expiration timestamp, never the raw JWT or user credentials.
5. A revoked token returns `401 Invalid authentication token` from protected routes, while a different valid token remains accepted.
6. Logout returns HTTP `200` with `{ "message": "Logout successful" }` and no token data.

#### Revocation storage and limitation

No Redis, cache, or revocation table exists in the current project. Revocations are therefore stored in an in-memory `Map` in `artifacts/api-server/src/lib/token-revocation.ts`. Expired entries are removed lazily and are never retained beyond the JWT expiration time. This is suitable for the current development/student implementation, but it is not sufficient for a multi-instance production deployment because each process has its own store; a shared Redis or database-backed store should be introduced before horizontal scaling.

#### Tests added

The API server tests cover successful logout, missing and malformed credentials, repeated logout, protected-route rejection for revoked tokens, acceptance of a different valid token, expiration cleanup, and the absence of sensitive token data in the logout response.

### 3.11 Refresh token endpoint (Task 3.1.6)

The refresh endpoint is implemented through the existing auth router and is available at `POST /api/auth/refresh`. The project consistently returns tokens in JSON, so the request body contains `{ "refreshToken": "<token>" }` rather than using a cookie.

#### Refresh-token architecture

1. Login now issues a short-lived access token and a long-lived refresh token. The existing `token` response field remains the access-token alias, and `accessToken` plus `refreshToken` are also returned explicitly.
2. Access tokens use the configured access secret and include `sub`, unique `jti`, `type: "access"`, `iat`, `exp`, and the claims required by the existing RBAC middleware.
3. Refresh tokens use the separate configured refresh secret and include `sub`, unique `jti`, `type: "refresh"`, `iat`, and `exp`.
4. Shared verification utilities enforce the expected secret and token type, so refresh tokens cannot authenticate protected endpoints and access tokens cannot call the refresh endpoint.

#### Rotation and server-side state

1. Refresh-token state is stored in the in-memory `Map` in `artifacts/api-server/src/lib/refresh-token-store.ts`, keyed by `jti` and containing only the user id, expiration, and revoked status.
2. A valid refresh request verifies the JWT, checks its stored state, confirms the user still exists, revokes the presented refresh token, and creates a new access/refresh token pair.
3. Reusing a revoked refresh token returns a generic `401 Invalid refresh token` response and revokes the remaining active refresh tokens for that user.
4. Logout revokes the user's active refresh-token session in addition to the access-token blacklist, so a logged-out refresh token cannot issue new credentials.
5. Expired refresh records are removed lazily and are never usable after their original expiration.

#### Storage limitation and tests

No Redis, cache, or token-session database table exists in the current project. The in-memory refresh store is appropriate for the current development/student implementation but is not suitable for a multi-instance production deployment because each process has independent state. A shared Redis or database-backed token-session store should replace it before horizontal scaling.

The API server tests cover successful refresh, new access-token use on protected routes, refresh-token rotation, old-token reuse rejection, expired/invalid/access-token rejection, revoked-token rejection, nonexistent-user rejection, logout invalidation, and protection against exposing refresh tokens from protected responses.

### 3.12 Get current user endpoint (Task 3.2.1)

The current-user endpoint is available at `GET /api/auth/me` because the root router is mounted under `/api`.

#### Request and lookup flow

1. The route reuses the existing `authenticate` middleware; it does not parse or verify JWTs independently.
2. The middleware validates the bearer access token and stores the verified subject in `req.user.id`.
3. The route converts only that verified subject to the numeric database id and rejects invalid subject values with the existing `401` error format.
4. The user query uses Drizzle and `eq(users.id, userId)`, so request body, query parameters, and client-provided user ids cannot select another user.
5. The user projection includes id, email, role, name, avatar URL, and creation timestamp only.
6. A missing database user returns `404 User not found` through the centralized error handler.

#### Role-specific profile data and security

1. Candidate users are looked up in the existing `candidate_profiles` table and receive a `profile` object when a profile row exists.
2. Recruiter-specific and admin-specific profile tables are not currently implemented, so those roles return the public user object without a profile property.
3. Password hashes, refresh tokens, and other authentication secrets are not selected or returned.
4. The response is a direct JSON user object, matching the generated client contract for `getMe`.

#### Tests added

The API server test suite verifies that the endpoint rejects unauthenticated requests, uses the JWT subject even when a conflicting query parameter is supplied, includes candidate profile data, excludes sensitive fields, and returns `404` when the authenticated user is absent.

### 3.13 Update user profile endpoint (Task 3.2.2)

The basic profile update endpoint is available at `PUT /api/auth/profile` because the root router is mounted under `/api`.

#### Validation and authorization

1. The route reuses the existing `authenticate` middleware and reads the target user id only from `req.user.id`.
2. `updateProfileRequestSchema` in the shared API Zod package accepts optional `name` and `avatarUrl` fields.
3. Names are trimmed, required to be non-empty when supplied, and limited to 200 characters to match the database column.
4. Avatar values must be valid URLs; `null` is accepted to clear an existing avatar URL.
5. The schema is strict and requires at least one update field, so protected fields such as id, email, role, passwordHash, and createdAt are rejected rather than ignored.

#### Database update and response

1. The route updates only `users.name`, `users.avatarUrl`, and `users.updatedAt`.
2. The Drizzle `where(eq(users.id, userId))` condition scopes the update to the authenticated user.
3. A missing user returns `404 User not found` through the existing error handler.
4. The response returns only id, email, role, name, avatar URL, and creation timestamp.
5. Password hashes, refresh tokens, and other authentication data are never returned or accepted as update fields.

#### Tests added

The API server test suite covers updating name only, avatar URL only, both fields together, unauthenticated requests, invalid names, invalid avatar URLs, and attempts to modify protected fields. The shared API Zod declaration output was rebuilt so the API server consumes the new schema through the existing workspace package boundary.

## 3.14 Candidate profile management (Task 4.1.1)

Candidate profile management is available at `/api/candidates/profile` because
the root router is mounted under `/api`.

### Endpoints and authorization

1. `POST /api/candidates/profile` creates the authenticated candidate's profile.
2. `GET /api/candidates/profile` returns the authenticated candidate's profile.
3. `PUT /api/candidates/profile` applies partial updates to the authenticated
	candidate's profile.
4. All three routes reuse `authenticate` and `authorize("candidate")`; the
	authenticated JWT subject is the only source of profile ownership.
5. Requests cannot provide or change `userId`, `id`, role, or authentication
	fields. Duplicate creation returns `409`, missing profiles return `404`, and
	non-candidate users receive `403`.

### Validation and persistence

1. Candidate request schemas use strict Zod validation for phone, location,
	education, experience, and a bounded array of non-empty string skills.
2. `candidate_profiles.skills` remains a typed PostgreSQL JSONB string array.
3. The existing one-to-one `candidate_profiles.user_id` unique index and users
	foreign key are reused.
4. Education and experience are stored as candidate-owned text fields; user
	name, email, and avatar URL are returned through the existing users join
	rather than duplicated in the candidate profile table.
5. Updates set `candidate_profiles.updated_at` and only write supplied fields.

### Tests and database migration

The API test command now runs both `register.test.ts` and `candidates.test.ts`.
Candidate profile tests cover successful create/get/update flows, partial
updates, duplicate creation, invalid skills, ownership-field rejection,
authentication, candidate-role enforcement, and missing profiles. The complete
API suite passes with 32 tests.

Drizzle generated `lib/db/drizzle/0000_fuzzy_kid_colt.sql`. This is an initial
full-schema snapshot because the repository had no previous migration history;
it includes the two candidate profile columns and was not applied automatically.

## 4. Completion Boundary Through Phase 4.1.1

### Completed

- Core Drizzle/PostgreSQL schema definitions for users, candidates, companies, company members, jobs, applications, and interviews.
- Database enums, foreign keys, delete behavior, uniqueness constraints, indexes, generated insert schemas, and inferred types.
- Express application entry point and middleware stack.
- JWT authentication middleware and role-based authorization.
- Structured Pino logging with credential redaction.
- Environment loading and startup validation.
- Authentication dependencies from task 3.1.1.
- Password, access-token, and refresh-token utilities from task 3.1.2.
- User registration endpoint from task 3.1.3.
- User login endpoint from task 3.1.4.
- User logout endpoint from task 3.1.5.
- Refresh token endpoint from task 3.1.6.
- Get current user endpoint from task 3.2.1.
- Update user profile endpoint from task 3.2.2.
- Candidate profile management endpoints from task 4.1.1.

### Not yet implemented

The following tasks remain planned in the implementation plan:

- Later candidate, recruiter, interview, AI, notification, admin, testing, deployment, and API documentation work

## 5. Source Reference

- `lib/db/src/schema/core.ts`
- `lib/db/src/schema/index.ts`
- `lib/db/src/index.ts`
- `artifacts/api-server/src/index.ts`
- `artifacts/api-server/src/app.ts`
- `artifacts/api-server/src/config/index.ts`
- `artifacts/api-server/src/lib/auth.ts`
- `artifacts/api-server/src/lib/refresh-token-store.ts`
- `artifacts/api-server/src/routes/auth.ts`
- `artifacts/api-server/src/register.test.ts`
- `lib/api-zod/src/auth.ts`
- `lib/api-zod/package.json`
- `artifacts/api-server/src/lib/logger.ts`
- `artifacts/api-server/src/middlewares/auth.ts`
- `artifacts/api-server/src/middlewares/error.ts`
- `artifacts/api-server/src/routes/index.ts`
- `artifacts/api-server/package.json`
- `.env.example`
