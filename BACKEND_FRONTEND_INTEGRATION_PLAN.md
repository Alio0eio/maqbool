# Backend-to-Frontend Integration Plan

## Scope

This plan connects the `artifacts/maqbool` candidate frontend to the backend
implemented through candidate task 4.3.4. It covers authentication, candidate
profiles, published job discovery, job details, saved jobs, application
submission, application tracking, application details, and application
withdrawal.

The backend API is mounted at `/api` by
`artifacts/api-server/src/app.ts`. The frontend currently uses mock data and a
mock authentication provider, so this work is an integration migration rather
than a simple endpoint hookup.

## Current State and Integration Risks

1. `artifacts/maqbool/src/lib/auth.tsx` stores mock user and role IDs in
   localStorage and never calls the backend authentication endpoints.
2. Candidate pages under `artifacts/maqbool/src/pages/candidate` read from
   `@/lib/mock-data`.
3. `lib/api-client-react` contains generated operations from a broader API
   contract whose application response shapes do not match the implemented
   candidate routes. It should not be used for these routes until the contract
   is aligned.
4. `artifacts/maqbool/vite.config.ts` has no development proxy for `/api`.
   The frontend must either use a configured backend base URL or add a Vite
   proxy for local development.
5. The backend uses bearer access tokens and refresh tokens. The browser
   client must attach the access token to protected requests and refresh or
   sign out cleanly after a `401`.
6. The backend currently has no upload endpoint. The existing apply flow's
   local resume upload cannot become a server upload without a separate storage
   decision. Until then, application submission uses the candidate profile's
   existing `resumeUrl`.
7. Candidate interviews, messages, notifications, job alerts, and company
   profile data are outside the backend scope through task 4.3.4 and should
   remain explicitly mock-backed or be hidden behind a feature flag during this
   migration.

## Target Architecture

### 1. Runtime configuration

Add frontend environment configuration for the API origin, for example:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

For local development, alternatively proxy `/api` from Vite to the API server
and keep the browser URL relative. Production should use one documented API
origin and configure CORS accordingly.

### 2. API client boundary

Create a small typed client for the implemented backend contract, either by
updating the OpenAPI source and regenerating `lib/api-client-react`, or by
adding a focused client module in `artifacts/maqbool/src/lib/api` first. The
client must expose these operations:

| Operation | Backend route | Auth |
| --- | --- | --- |
| Register | `POST /api/auth/register` | Public |
| Login | `POST /api/auth/login` | Public |
| Refresh | `POST /api/auth/refresh` | Public with refresh token |
| Logout | `POST /api/auth/logout` | Access token |
| Current user | `GET /api/auth/me` | Access token |
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

Replace mock auth with a provider that owns:

- `accessToken`, `refreshToken`, and the authenticated user;
- storage and restoration of the session on page load;
- `login`, `register`, `logout`, and `refresh` actions;
- a bootstrap request to `GET /api/auth/me`;
- a single-flight refresh mechanism for concurrent `401` responses;
- clearing tokens and redirecting to `/` when refresh fails.

Do not store passwords. Prefer an in-memory access token plus a protected
refresh-token strategy when the deployment supports secure cookies. If the
current API contract remains bearer-token based, document the localStorage
tradeoff and keep all token access inside the auth provider/client boundary.

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
2. [ ] Wire sign-up to `POST /api/auth/register`, then log in or use the returned
   session according to the chosen UX.
3. [x] Store the returned access and refresh tokens through the auth provider.
4. [ ] Restore the session with `GET /api/auth/me` before rendering candidate
   routes.
5. [ ] Wire logout to `POST /api/auth/logout` and clear client state regardless of
   the response.
6. [x] Map backend `401` and validation errors to the existing form error/toast
   system.
7. [ ] Test candidate and recruiter role gating with real backend roles. Recruiter
   pages should remain blocked from candidate-only operations.

**Progress update (2026-10-07)**: Sign-in now posts JSON credentials to the
backend, resolves the authenticated user's role through `GET /api/auth/me`,
stores the returned access and refresh tokens in the existing auth provider,
and displays backend or network errors in the form. Token refresh, validated
session bootstrap, backend logout, registration, and real-role route-gating
tests remain incomplete, so the Phase 1 exit check is not yet met.

**Exit check:** a newly registered candidate can refresh the browser, remain
authenticated, and reach `/candidate/dashboard`; an invalid session returns to
the auth page.

### Phase 2: Candidate profile foundation

1. Replace mock candidate data in the candidate profile page with
   `GET /api/auth/me` and `GET /api/candidates/profile`.
2. Map the current UI fields to the backend profile fields, preserving backend
   validation for skills, experience, and URLs.
3. Wire profile create/update actions to `POST` and `PUT /api/candidates/profile`.
4. Use the profile's `resumeUrl` as the current application resume source.
5. Show the backend's `404 Candidate profile not found` state with a setup
   action instead of silently falling back to mock data.

**Exit check:** profile edits persist after reload and the apply flow reflects
the saved profile resume.

### Phase 3: Job discovery and job details

1. Replace `MOCK_JOBS` in candidate jobs with React Query data from
   `GET /api/jobs`.
2. Translate search controls into supported query parameters: pagination,
   company, job type, location type, experience level, salary range, skills,
   and posted/salary sorting.
3. Keep search and filter state in the URL where practical so refresh and share
   behavior are stable.
4. Add loading, empty, invalid-query, and retry states.
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

### Phase 4: Application submission

1. Replace mock job and candidate lookups in `apply-flow.tsx` with the job
   detail and current-profile queries.
2. Keep the existing multi-step UX, but make the review step submit
   `POST /api/jobs/:id/apply` with the optional `coverLetter`.
3. Do not claim that a locally selected resume was uploaded. Until a file
   storage endpoint exists, require a profile `resumeUrl` and explain that the
   application uses the saved resume.
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

- resume upload/storage and replacement;
- candidate interview APIs and interview submissions;
- notifications, messages, and job alerts;
- recruiter/company APIs and recruiter frontend migration;
- OpenAPI publication if the generated client is selected as the long-term
  contract source.