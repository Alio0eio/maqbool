# Backend-to-Frontend Integration Plan

## Scope

This plan connects the `artifacts/maqbool` candidate frontend to the backend
implemented through candidate task 4.3.4. It covers authentication, candidate
profiles, published job discovery, job details, saved jobs, application
submission, application tracking, application details, and application
withdrawal.

The backend API is mounted at `/api` by
`artifacts/api-server/src/app.ts`. The frontend has a backend-backed
authentication provider and the candidate profile page now loads the
authenticated user's real profile. Other candidate feature pages remain in
their existing migration phases.

## Current State and Integration Risks

1. Authentication uses the backend login, registration, current-user, refresh,
   and logout endpoints. `GET /api/auth/me` restores the cookie-authenticated
   session before protected routes render.
2. `artifacts/maqbool/src/pages/candidate/profile.tsx` now uses the authenticated
   user and `GET /api/candidates/profile`; other candidate feature pages remain
   in the mock-data migration queue.
3. `lib/api-client-react` contains generated operations from a broader API
   contract whose application response shapes do not match the implemented
   candidate routes. It should not be used for these routes until the contract
   is aligned.
4. The API server serves the built frontend and API from one origin. The
   combined development command builds the frontend with `VITE_API_BASE_URL=/api`
   so browser authentication cookies and API calls remain same-origin.
   Standalone Vite development reads the workspace-root `.env` and uses
   `VITE_API_BASE_URL` (for example `http://localhost:5000/api`) to call the API
   server on its separate origin.
5. The backend supports bearer tokens for existing clients and HttpOnly access
   and refresh cookies for the browser. A separate frontend origin still
   requires the backend `CORS_ORIGIN` allowlist and credentialed CORS.
6. Candidate resumes are uploaded to private S3-compatible storage through the
   authenticated API. The profile stores an owner-checked API download path,
   and application submissions use that saved path.
7. Candidate interviews, messages, notifications, job alerts, and company
   profile data are outside the backend scope through task 4.3.4 and should
   remain explicitly mock-backed or be hidden behind a feature flag during this
   migration.

## Target Architecture

### 1. Runtime configuration

For the combined server, the frontend uses the relative API base:

```text
VITE_API_BASE_URL=/api
```

Run `pnpm --filter @workspace/api-server dev` from the repository root. This
builds the frontend and API, then starts one Express server that serves both on
the configured backend `PORT`. The frontend and API share one browser origin;
do not set `VITE_API_BASE_URL` to a different host when using this mode.

### 2. API client boundary

Create a small typed client for the implemented backend contract, either by
updating the OpenAPI source and regenerating `lib/api-client-react`, or by
adding a focused client module in `artifacts/maqbool/src/lib/api` first. The
client must expose these operations:

| Operation | Backend route | Auth |
| --- | --- | --- |
| Register | `POST /api/auth/register` | Public |
| Login | `POST /api/auth/login` | Public |
| Refresh | `POST /api/auth/refresh` | HttpOnly refresh cookie or legacy body token |
| Logout | `POST /api/auth/logout` | HttpOnly access cookie or bearer token |
| Current user | `GET /api/auth/me` | HttpOnly access cookie or bearer token |
| Update user profile | `PUT /api/auth/profile` | Access token |
| Candidate profile | `GET/POST/PUT /api/candidates/profile` | Candidate |
| List jobs | `GET /api/jobs` | Public |
| Job details | `GET /api/jobs/:id` | Optional candidate auth |
| Apply | `POST /api/jobs/:id/apply` | Candidate |
| Save job | `POST /api/jobs/:id/save` | Candidate |
| Unsave job | `DELETE /api/jobs/:id/save` | Candidate |
| Saved jobs | `GET /api/candidates/saved-jobs` | Candidate |
| Applications | `GET /api/candidates/applications` | Candidate |
| Application details | `GET /api/applications/:id` | Candidate |
| Withdraw application | `DELETE /api/applications/:id` | Candidate |

The client must normalize backend errors from `{ error: { message } }` into a
single `ApiError` shape containing at least `status` and `message`. Preserve
`400`, `401`, `403`, `404`, and `409` so pages can show the correct state.

### 3. Authentication state

The existing provider owns:

- the authenticated backend user and its role;
- an initialization/loading state and session restoration from `GET /api/auth/me`;
- `login`, `register`, and `logout` actions;
- one refresh-and-retry attempt for candidate profile and application requests
  after a `401`;
- clearing auth state and redirecting to `/` when restoration fails.

The browser uses HttpOnly access and refresh cookies and does not persist token
values in localStorage. Bearer authentication remains available to non-browser
clients.

Update `RequireAuth` to use the backend user role, loading state, and session
bootstrap result. Remove the candidate lookup by mock email from all protected
pages.

## Delivery Phases

### Phase 0: Contract and environment preparation

1. Confirm the API response contracts against the route implementations and
   `lib/api-zod` schemas.
2. Decide whether OpenAPI regeneration or a focused handwritten client is the
   short-term source of truth. Do not mix both for the same endpoint.
3. Add `VITE_API_BASE_URL` documentation and local proxy configuration.
4. Add a health-check or startup diagnostic that reports the configured API
   origin without logging tokens.
5. Add frontend test fixtures for backend-shaped users, jobs, profiles, saved
   jobs, and applications.

**Exit check:** the frontend can make one unauthenticated request to
`GET /api/jobs` and display a typed response in a temporary development view.

### Phase 1: Authentication and session migration

1. [x] Wire the sign-in form to `POST /api/auth/login` with email and password.
2. [x] Wire sign-up to `POST /api/auth/register` with the backend schema's
   `{ email, password, name }` JSON body. Registration returns no session, so
   the UI directs the new candidate to sign in. Email verification remains
   blocked on backend support (see below).
3. [x] Set HttpOnly access and refresh cookies on login/refresh; do not persist
   token values in browser storage.
4. [x] Restore the session with `GET /api/auth/me` before rendering protected
   routes, refreshing once after an expired access token.
5. [x] Wire logout to `POST /api/auth/logout` and clear client auth state even
   when the server request fails.
6. [x] Map backend `401` and validation errors to the existing form error/toast
   system.
7. [x] Gate candidate and recruiter routes by the backend user role; admin and
   other-role users cannot enter either dashboard.

**Progress update (2026-10-11)**: The existing auth provider now initializes
from the backend's cookie-authenticated `GET /api/auth/me` response before any
protected route renders. A `401` triggers one refresh attempt; authentication
failures and network errors fail closed and end the loading state. Login
updates the provider from the current-user response, logout invalidates the
backend session and always clears client state, and `RequireAuth` checks the
actual backend role. Tokens are not persisted in localStorage. Backend tests
cover HttpOnly cookie issuance, cookie authentication, refresh rotation, and
cookie clearing; the frontend package currently has no test runner configured
for React component tests.

**Progress update (2026-10-08)**: The sign-up form posts trimmed email and
name plus the password to `POST /api/auth/register`, prevents duplicate
submissions, applies the server's password and name constraints in the browser,
and shows server/network errors. On `201`, it switches to Sign In with the
registered email and does not create a session. The backend has no email
verification implementation, so `/verify-email`, verification-code submission,
and resend are intentionally not simulated. Registration and verification are
not equivalent: email verification is still a backend prerequisite before the
requested verification flow and its end-to-end exit check can be completed.

#### Email verification backend prerequisites

- Add an email-verification status field to `users` and a migration.
- Add secure verification-code storage with expiration and one-time-use handling.
- Add an email delivery service and configuration.
- Implement `POST /api/auth/verify-email` with its actual request/response schema.
- Implement `POST /api/auth/resend-verification` with server-enforced cooldowns
  if resend throttling is part of the contract.
- Decide whether successful verification returns an authenticated session or
  requires the user to sign in, then cover that behavior with backend tests.

**Exit check:** a newly registered candidate can refresh the browser, remain
authenticated, and reach `/candidate/dashboard`; an invalid session returns to
the auth page. This remains blocked until session bootstrap is complete; the
email-verification user flow additionally requires the backend prerequisites.

### Phase 2: Candidate profile foundation

1. [x] Reuse the existing `AuthProvider` session restoration from
   `GET /api/auth/me`; only request candidate data after the candidate role is
   established.
2. [x] Replace mock candidate and application objects in the profile page with
   the authenticated user and `GET /api/candidates/profile`.
3. [x] Display real identity, profile, experience, skills, portfolio, LinkedIn,
   and GitHub fields, with explicit empty-field states.
4. [x] Wire profile creation and headline/summary updates to the existing
   `POST` and `PUT /api/candidates/profile` routes.
5. [x] Handle loading, retryable request failures, expired/unauthorized
   sessions, and the missing-profile `404` without mock fallback.
6. [x] Use the authenticated profile's `resumeUrl` as the current application
   resume source in the apply flow; the backend resolves the latest value on
   submission and never trusts a client-supplied resume URL.
7. [x] Add candidate-only PDF/DOCX upload, private object storage, protected
   resume retrieval, and resume text extraction with reviewable profile-field
   suggestions.

**Progress update (2026-10-12)**: The profile page now uses React Query with a
candidate-specific key and abortable requests through the cookie-authenticated
API client. It shows `/auth/me` name/email and profile fields from the profile
endpoint, supports creating a missing profile and persisting headline/summary
edits, and redirects after a `401` remains after refresh. A `403` is shown as
an authorization error without clearing the authenticated session. The
backend profile projection now returns the stored professional fields and the
update schema persists the displayed editable fields. `education` and
`experience` are plain text in the actual database/API, so the page renders
them as text rather than assuming the arrays described in the generated
OpenAPI client model. React component tests are not configured in this package;
backend route/schema coverage and frontend typecheck/build are the available
automated checks. Runtime integration still requires a configured backend and
authenticated candidate account.

**Progress update (2026-10-17)**: The application page now loads the
authenticated candidate profile through the existing profile API, displays
the saved resume, and blocks progression when it is missing or invalid. Both
legacy HTTP(S) references and the protected profile-resume path are supported.
Review submission calls the existing authenticated
`POST /api/jobs/:id/apply` endpoint without sending a candidate ID or resume
URL; the endpoint resolves the candidate from the session and snapshots the
profile's current resume into the application. Missing or invalid profile
resume references receive `422` and are never inserted. The initial
local-only file picker was removed while no upload endpoint existed; the
authenticated upload/import capability is now implemented as described in
Phase 2. Focused route tests cover the latest resume being used on a
subsequent submission, invalid/missing references, client attempts to supply
a resume URL, and preserved cover-letter/status behavior. Job lookup remains
separate integration work.

**Progress update (2026-10-17)**: The profile page now opens the browser file
picker through **Upload resume** / **Update resume**, uploads PDF/DOCX files to
the authenticated backend, and shows fields extracted from recognizable resume
sections for candidate review. Choosing **Fill profile with these details**
persists the detected phone, location, education, experience, skills, summary,
and years of experience through the existing profile update API. Resume files
are stored in a private S3-compatible bucket; the API returns a protected
download path that verifies the authenticated candidate owns the profile's
current resume. Server storage credentials are configured with the
`RESUME_S3_*` environment variables. Image-only/scanned PDFs are not OCRed.

**Exit check:** profile edits persist after reload and the apply flow reflects
the saved profile resume.

### Phase 3: Job discovery and job details

1. [x] Replace `MOCK_JOBS` in candidate jobs with React Query data from
   `GET /api/jobs`.
2. [x] Translate search controls into supported query parameters: pagination,
   company, job type, location type, experience level, salary range, skills,
   and posted/salary sorting.
3. [x] Keep search and filter state in the URL so refresh, sharing, and browser
   history restore the same result set.
4. [x] Add loading, empty, invalid-query, and retry states.
5. Replace job detail lookup with `GET /api/jobs/:id` and use the returned
   `applicationStatus` to disable or change the Apply action.
6. Replace local bookmark state with `POST /api/jobs/:id/save` and
   `DELETE /api/jobs/:id/save`, invalidating the saved-jobs and job-detail
   queries after mutation.
7. Adapt backend company fields to the existing card/detail presentation;
   do not assume the mock `company` string has the same shape as the backend
   `company` object.

**Exit check:** published jobs only are shown, job views increment through the
backend detail request, and saving/unsaving survives reload.

**Progress update (2026-10-19)**: Candidate job discovery now uses the existing
React Query provider and authenticated API client to load
`GET /api/jobs?page=N&limit=100`. The endpoint returns `{ jobs, pagination }`;
each job has a flat `company` name and nullable `companyLogoUrl`, salary, and
posted-date fields. Its published-only response is read across all pages so
the existing client-side title/company/skills, location, and work-type search
continues to cover the complete result set; the endpoint's `total` remains the
open-role count. The page now distinguishes initial loading, request errors
with retry, a truly empty result, and filters with no matches. A failed
background refetch keeps the existing cards visible. Job details and save-job
integration remain separate work in this phase.

**Progress update (2026-10-22)**: Candidate job discovery now sends the active
search, location, company ID, job type, location type, experience level, salary
bounds, skills, sort field/direction, page, and page size to the existing
`GET /api/jobs` endpoint. Results are paginated server-side and the React Query
key includes all request controls; changing any control resets the page to 1.
The backend validates the query, filters the published-job database query, and
uses the same filtered query for total counts and returned rows. Multiple
requested skills use JSONB containment (all selected skills must be present).
Salary bounds use range overlap and retain postings with missing salary bounds
as unknown rather than excluding them. Free-text search covers title, company,
and skills; location search also recognizes the Remote location type. The
company selector currently accepts the database company ID because no company
directory endpoint exists. Query state is kept for page navigation but is not
serialized into the browser URL.

**Progress update (2026-10-23)**: Candidate job query state is now synchronized
with the existing Wouter URL search-parameter hook. The shared URL restores
keyword (`q`), company ID, location, job type, location type, experience,
salary bounds, skills, sorting, page, and page size. Default and empty values
are omitted; valid query values are canonicalized without dropping unrelated
query parameters. At this stage malformed or unsupported values were silently
normalized; the follow-up below replaces that behavior with explicit
validation. The React Query key and request are derived from URL state, and
search/location/skills text is debounced while
remaining immediately editable. Filter/sort/page-size changes reset the page;
pagination changes only the page, and Wouter history navigation restores the
matching controls and results. The page now renders the server-filtered page
instead of filtering a partial page a second time in the browser. The API
contract remains unchanged: the UI's `q` is sent as `search`, and `limit` is
the backend page-size parameter. Keyword, location, skills, company ID, and
salary inputs remain responsive while their URL/API updates are debounced.
Validation performed: candidate frontend TypeScript check and production
build, plus the focused jobs API contract tests (14 passing). Component-level
React tests and lint scripts are not configured in this package.

**Progress update (2026-10-24)**: Candidate job URL parameters are now
validated against the `GET /api/jobs` schema before a request runs. Invalid
values show field-specific messages and can be reset without dropping valid
filters or unrelated URL parameters. Initial loads use job-card skeletons;
filter changes keep previous cards visible with an updating indicator, while
stale results are not shown after a failed request for the new filters.
Successful empty responses distinguish no published jobs, no matches for
active filters, and an out-of-range page. Requests retry once automatically,
and the visible Retry action uses React Query's `refetch`. Added focused
frontend query/state tests; the API contract and backend remain unchanged.

### Phase 4: Application submission

1. Replace the mock job lookup in `apply-flow.tsx` with the job-detail query;
   this is part of the separate job-integration task.
2. [x] Replace mock candidate data with the current-profile query and keep the
   existing multi-step UX while submitting the review through
   `POST /api/jobs/:id/apply` with the optional `coverLetter`.
3. [x] Require the saved profile `resumeUrl` and explain that the application
   uses the current saved resume; the backend resolves it from the
   authenticated candidate profile.
4. Treat `201` as success and navigate to the success state using the returned
   application ID.
5. Handle `409 Application already exists`, `409 Job is not accepting
   applications`, missing profile, and expired authentication explicitly.
6. Invalidate the candidate applications list and job-detail queries after a
   successful application.

**Exit check:** one candidate can apply once, sees the submitted state after a
   reload, and cannot submit a duplicate application.

### Phase 5: Applications dashboard and withdrawal

1. Replace mock applications in the candidate dashboard with
   `GET /api/candidates/applications`.
2. Use backend pagination, status/stage filters, and sort order rather than
   filtering the full mock array in the browser.
3. Add an application details view or route that calls
   `GET /api/applications/:id`; keep interview nullable and show feedback only
   when the application is rejected.
4. Add a visible Withdraw action only for `applied`, `reviewing`, `shortlisted`,
   and `interviewing` applications.
5. Confirm withdrawal before calling `DELETE /api/applications/:id`.
6. On success, invalidate the application list, application detail, and any
   dashboard summary queries. Preserve the application row and render the
   `withdrawn` status.
7. Map `409 Application cannot be withdrawn in its current status` to a
   refreshed detail state rather than treating it as a generic failure.
8. Leave interviews, messages, and notifications clearly marked as mock-backed
   until their backend tasks are implemented.

**Exit check:** withdrawal changes the status in the UI after reload, does not
remove the application from history, and cannot be repeated.

### Phase 6: Saved jobs and remaining candidate shell cleanup

1. Replace `MOCK_JOBS` in the saved-jobs page with
   `GET /api/candidates/saved-jobs`.
2. Preserve job-alert UI as mock or remove it from the live-data claim because
   no alert endpoint exists yet.
3. Remove mock candidate/application/job imports from live candidate screens.
4. Keep shared display adapters in one place, such as
   `artifacts/maqbool/src/lib/api/adapters.ts`, rather than duplicating field
   mapping in every page.
5. Add a feature flag or explicit mock mode for visual development only; live
   mode must never silently fall back to mock data after an API error.

**Exit check:** all candidate screens in the supported scope use backend data,
and a network failure is visible to the user.

## Suggested Frontend Modules

```text
artifacts/maqbool/src/lib/
├── api/
│   ├── client.ts          # fetch wrapper, base URL, auth headers, errors
│   ├── auth.ts            # login, register, refresh, logout, me
│   ├── candidates.ts      # profile and candidate application operations
│   ├── jobs.ts            # job listing, detail, save/unsave, apply
│   ├── query-keys.ts      # stable React Query keys
│   └── adapters.ts        # backend-to-UI display mapping
├── auth.tsx               # live session provider
└── mock-data.ts           # retained only for explicit mock mode
```

Recommended query keys:

```text
["auth", "me"]
["candidate", "profile"]
["jobs", searchParams]
["jobs", jobId]
["saved-jobs", searchParams]
["applications", searchParams]
["applications", applicationId]
```

## Test Strategy

### Client and hook tests

- Login, registration, logout, refresh, and expired-session behavior.
- Authorization header attachment and normalized API errors.
- Query invalidation after save, unsave, apply, profile update, and withdraw.
- Correct visibility of candidate-only controls.

### Page-level tests

- Job list loading, filtering, pagination, and empty states.
- Job detail application status and save state.
- Apply flow validation, duplicate submission, and success navigation.
- Application list/detail rendering for every status, including withdrawn.
- Withdraw confirmation, success, `404`, `409`, and already-withdrawn states.

### End-to-end smoke flow

1. Register a candidate.
2. Create or load a candidate profile with a resume URL.
3. Browse published jobs and open a detail page.
4. Save and unsave a job.
5. Submit an application with a cover letter.
6. Confirm it appears in the dashboard and detail view.
7. Withdraw it and confirm the status remains `withdrawn` after reload.
8. Sign out, sign back in, and verify protected data is still scoped to the
   same candidate.

## Rollout Order and Completion Criteria

Use a vertical-slice rollout: authentication first, then profile, jobs, apply,
applications/withdrawal, and saved jobs. Keep each slice behind a small live
data flag until its tests and error states pass. Do not delete mock fixtures
until the corresponding live screen has passed the end-to-end smoke flow.

The integration is complete when:

- the candidate can use real registration and login;
- all in-scope candidate pages read from the backend;
- protected requests survive access-token refresh;
- saved jobs and applications persist across reloads;
- application withdrawal follows the backend's four withdrawable statuses;
- backend errors are visible and actionable;
- no in-scope page silently falls back to mock data;
- frontend typecheck, build, unit tests, and the end-to-end smoke flow pass.

## Known Follow-up Backend Work

The following are intentionally outside this integration scope:

- candidate interview APIs and interview submissions;
- notifications, messages, and job alerts;
- recruiter/company APIs and recruiter frontend migration;
- OpenAPI publication if the generated client is selected as the long-term
  contract source.