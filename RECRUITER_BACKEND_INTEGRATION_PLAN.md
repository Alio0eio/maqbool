# Recruiter Backend Integration Plan

## 1. Scope and current-state summary

This plan connects **every recruiter route currently registered in
`artifacts\maqbool\src\App.tsx` (lines 73–102)** to persisted, tenant-scoped
backend behavior. It covers job authoring and management, applicant review,
candidate records, pipeline actions, interviews, offers, messaging,
notifications, activity, analytics, company/team settings, and billing.

The recruiter UI is currently a mock prototype: recruiter pages import fixture
arrays or keep business data in component state; there are no recruiter API
calls under `artifacts\maqbool\src\pages\recruiter`. The backend currently
mounts only health, auth, candidate, and jobs routers
(`artifacts\api-server\src\routes\index.ts:1–14`). In particular, existing
`GET /api/jobs` is a public, **published-only** candidate-discovery endpoint
(`artifacts\api-server\src\routes\jobs.ts:45–152`), not a recruiter job
management API.

The database already provides the beginnings of the domain—users, companies,
company memberships, jobs, candidate profiles, applications, and interviews—
in `lib\db\src\schema\core.ts:19–237`, but no recruiter route currently uses
these entities. Existing integration architecture, cookie-auth behavior,
error handling, query patterns, and package execution guidance are documented
in `BACKEND_FRONTEND_INTEGRATION_PLAN.md` (particularly “Target Architecture,”
“Suggested Frontend Modules,” and “Known Follow-up Backend Work”). The latter
explicitly lists recruiter/company APIs and recruiter frontend migration as
out of scope (lines 512–520); this plan is the next, separate vertical slice.

**Approved candidate-access decision:** Recruiters can view and search candidates
only when those candidates have an application to at least one job posted by
their authorized company. Candidates who have not applied to a company job,
including candidates visible only to another company, are outside that
recruiter's candidate directory. A candidate may legitimately appear for more
than one company if they applied independently to jobs at both companies, but
each recruiter may view only the applications and candidate information exposed
through their company's own jobs. No recruiter API may return a candidate's
cross-company application history, or reveal that another company has reviewed
the candidate. Sourced leads and the current mock "Add Candidate" workflow are
out of scope for this plan unless a later product decision changes this rule.

**Constraints:** Planning only. Do not pause or imply that missing recruiter
endpoints already exist. Do not ship recruiter mutations that only update
component state or silently substitute fixtures after an API failure.

## 2. Complete recruiter flow and screen inventory

All paths below are nested under the recruiter-only `RequireAuth` and
`RecruiterShell` in `artifacts\maqbool\src\App.tsx:73–103`. Route parameters
such as `:id` are currently numeric fixture IDs; after migration they must be
treated as opaque server resource IDs and verified by the API.

| Route / screen | Current behavior and source | Backend-backed target |
| --- | --- | --- |
| `/recruiter/dashboard` — `pages\recruiter\dashboard.tsx` | `MOCK_STATS`, `MOCK_JOBS`, `MOCK_ACTIVITY`, and `MOCK_CANDIDATES` drive KPIs, recent jobs, trends, and activity. | Company-scoped summary, job counts, application funnel, workload, recent activity, and recent jobs; links resolve to tenant-visible records. |
| `/recruiter/jobs` — `pages\recruiter\jobs.tsx` | `MOCK_JOBS`; local search, status tab, and location-type filters; local status and applicant totals. | Paginated company job list with server counts, search/filter/order, status changes, and applicant totals. |
| `/recruiter/jobs/new/:step` — `pages\recruiter\create-job.tsx` | Multi-step `react-hook-form` wizard. Form fields live in component state; skills and screening questions are local arrays seeded from `SCREENING_QUESTIONS`; publish/cancel navigate locally. `AppShell` deliberately avoids remounting this wizard between step URLs (`components\layout\app-shell.tsx`, `WIZARD_STEP_ROUTES`). | Create and persist a draft, autosave step changes, publish only after validation, resume editing by job ID, and preserve draft across reload/navigation. Screening questions require a new persisted model. |
| `/recruiter/jobs/:id/applicants` — `pages\recruiter\job-applicants.tsx` | Joins `MOCK_APPLICATIONS`, `MOCK_JOBS`, and `MOCK_CANDIDATES` in memory; stage and search filters plus selected candidates are local. Links to candidate, invite, compare, and bulk routes. | Tenant-checked job and paginated applications with candidate summary, stage/status, scores, and permitted actions. |
| `/recruiter/jobs/:id/applicants/bulk` — `pages\recruiter\bulk-selection.tsx` | Local selection/action state. “Advance,” “reject,” “invite,” and “message” update only the fixture-derived list/show a timeout confirmation; rejection uses shared `ConfirmAction`. | Validated bulk stage/status transitions and invitation/message jobs. Return per-application results; no false success on partial failure. |
| `/recruiter/jobs/:id/applicants/compare` — `pages\recruiter\candidate-comparison.tsx` | Joins fixture candidates/apps, computes display criteria locally, and keeps “invited” state in a local `Set`. | Load only this job’s authorized applicants; comparison criteria must be explicitly classified as user-provided or separately computed, not presented as persisted/AI facts without provenance. Invite action calls interview invitation API. |
| `/recruiter/candidates` — `pages\recruiter\candidates.tsx` | `MOCK_CANDIDATES`/`MOCK_APPLICATIONS`; local text/skill filtering, saved IDs, tabs, and Add Candidate dialog. Submit prepends a synthetic candidate only in state. | Search only candidates who applied to this company. Remove or hide sourced-lead and Add Candidate functionality. A candidate is visible only because at least one application joins to an authorized company job. |
| `/recruiter/candidates/:id` — `pages\recruiter\candidate-profile.tsx` | Looks up fixture candidate/application by ID; profile actions navigate to candidate list, interviews, or offers. | Tenant-scoped profile allowed only when the candidate has an application to an authorized company job. Return only that company's application history; never disclose applications or activity from other companies. Include protected resume access and permitted company-owned applications. |
| `/recruiter/pipeline` — `pages\recruiter\pipeline.tsx` | Fixture applications/candidates/jobs; job selector and drag-and-drop stage overrides are local. | Company-wide or selected-job pipeline query; drag/drop sends a guarded stage mutation and records audit history. |
| `/recruiter/interviews` — `pages\recruiter\interviews.tsx` | Joins `MOCK_INTERVIEWS`, applications, and candidates. | Company-scoped interview list with status, schedule, completion, job, and candidate labels. |
| `/recruiter/interviews/:id/invite` — `pages\recruiter\send-invitations.tsx` | `MOCK_CANDIDATES.slice(0, 3)`, local `react-hook-form` note/deadline and simulated send/redirect. | Create interview invitation(s) for selected authorized application(s), deliver notifications/email, and expose delivery/result states. |
| `/recruiter/interviews/:id/questions` — `pages\recruiter\interview-questions.tsx` | Local questions from `INTERVIEW_QUESTIONS`; add/remove/reorder/type/time-limit/retakes with local validation and a success timer. Removal uses `ConfirmAction`. | Persist versioned question sets and ordering; define whether changes apply to already-invited candidates or only future invitations. |
| `/recruiter/interviews/:id/feedback` — `pages\recruiter\interview-feedback.tsx` | Fixture interview/questions and hard-coded criteria/summaries. | Authorized interview response and reviewer feedback endpoints, with explicit provenance and visibility controls. |
| `/recruiter/interviews/:id/decision` — `pages\recruiter\interview-decision.tsx` | Fixture interview/questions; local hire/reject/reason state, then navigates to decision or interviews. | Persist a decision against the interview/application, enforce transition rules, and record actor/reason/time. |
| `/recruiter/decision/:id` — `pages\recruiter\final-decision.tsx` | Always selects first fixture candidate/application; offer/reject choice and confirmation live locally. | Load the identified application and persist offer/rejection outcome; require explicit candidate, job, and application linkage. |
| `/recruiter/completion-monitoring` — `pages\recruiter\completion-monitoring.tsx` | `INITIAL_COMPLETION_DATA`; reminders only announce local success; “extend” changes an in-memory deadline. | Query outstanding invitations; send a real reminder and persist deadline changes with audit data. |
| `/recruiter/status-updates` — `pages\recruiter\status-updates.tsx` | `MOCK_CANDIDATES`, local selection, hard-coded templates, editable message, and sent state; rejection uses `ConfirmAction`. | Bulk communication over authorized applications, validated status-specific templates, durable delivery status, and an audit record. |
| `/recruiter/offers` — `pages\recruiter\offers.tsx` | Local application array and offer-detail map; Create Offer dialog; local accept/decline/withdraw states. Dialog uses application selection and form values; withdraw uses `ConfirmAction`. | Persist offer terms and expiration, deliver offer to candidate, accept/decline state, withdraw/revoke rules, and audit history. |
| `/recruiter/messages` — `pages\recruiter\messages.tsx` plus shared `components\shared\inbox.tsx` | `getConversationsFor(user?.id)` from fixture conversations; local search/open thread/read count/draft/send; send appends a local message. | Tenant-authorized conversations, persisted messages, read receipts, pagination, and notifications. |
| `/recruiter/notifications` — `pages\recruiter\notifications.tsx` | `RECRUITER_NOTIFICATIONS`; local read/unread state. | User/company scoped paginated notifications and mark-one/read-all mutations. |
| `/recruiter/activity` — `pages\recruiter\activity.tsx` | `MOCK_ACTIVITY` and local category filter. | Paginated immutable audit/activity feed derived from persisted actions and scoped to company visibility. |
| `/recruiter/reports` — `pages\recruiter\reports.tsx` | `MOCK_STATS`, `MOCK_JOBS`, and `MOCK_CANDIDATES`; trends and funnel are calculated from fixtures. | Server-calculated, company-scoped metrics with documented definitions and time range; export only after access and privacy rules are defined. |
| `/recruiter/settings/company` — `pages\recruiter\settings\company.tsx` | Local company form/benefits and save indicator; initial values are hard-coded. | Read/update persisted `companies` profile under company-admin permission; version-safe updates and logo storage workflow. |
| `/recruiter/settings/enterprise` — `pages\recruiter\settings\enterprise.tsx` | Local tabs, hard-coded `TEAM`, invite email/role, security and notification toggles. Invite and member removal only change component state; remove uses `ConfirmAction`. | Persist company memberships/invitations, role changes, member deactivation, and explicitly supported settings. Do not label UI-only toggles as enforced security controls. |
| `/recruiter/settings/billing` — `pages\recruiter\settings\billing.tsx` | Hard-coded `PLANS`, local plan/cancel state; payment action is a toast explaining no secure form exists. Cancel uses `ConfirmAction`. | Provider-backed plan/subscription/checkout/portal and signed webhook synchronization; until implemented, gate billing mutations and clearly mark unavailable. |

### Shared recruiter navigation and UI components

- `components\layout\recruiter-shell.tsx:18–135` contains the primary/Workspace
  navigation, static “Stratos Financial” label, fixture unread count, and
  `RecruiterSearch` over mock jobs/candidates (local query/open state). Its
  links include dashboard, jobs, candidates, pipeline, interviews, offers,
  messages, reports, company, enterprise, and billing.
- `components\layout\app-shell.tsx` supplies the common responsive/pinnable
  sidebar, mobile `Sheet`, account dropdown/logout/profile link, notification
  link, header, and global command palette. Sidebar pin state is stored in
  `localStorage` (`maqbool_sidebar_pinned`); this is presentation state and
  may remain client-side. Current profile identity comes from `useAuth`.
- `components\shared\command-palette.tsx` has static recruiter page entries
  and fixture job/candidate results; `components\shared\confirm-action.tsx`
  is the destructive-action confirmation primitive. Keep confirmations but
  connect confirmation to a pending/error-aware mutation.
- `components\shared\inbox.tsx` implements the shared two-pane inbox and owns
  local conversation/thread/search/read/draft state. Refactor its data access
  behind role-aware API hooks rather than duplicating a second recruiter-only
  messaging UI.
- Existing design components (dialogs, tabs, selects, cards, tables, toasts,
  skeletons, empty states) can remain presentation components. Domain and
  persistence state must move out of them.

## 3. Component/page-to-backend mapping

Add a recruiter service boundary under
`artifacts\maqbool\src\lib\api\` (see frontend plan below), backed by shared
contracts in `lib\api-zod\src\` and routes in
`artifacts\api-server\src\routes\`. The table in §2 is the exhaustive screen
mapping; this table specifies the service ownership and cross-screen reuse:

| UI/service responsibility | Proposed API/domain source |
| --- | --- |
| Recruiter shell company identity, current workspace, global search | `GET /api/recruiter/context`; `GET /api/recruiter/search?q=...&types=jobs,candidates,interviews`; return only resources visible to the active company. |
| Dashboard, reports, activity, notifications | `GET /api/recruiter/dashboard`; `GET /api/recruiter/reports?...`; `GET /api/recruiter/activity?...`; `GET /api/recruiter/notifications?...`; `PATCH /api/recruiter/notifications/:id`; `POST /api/recruiter/notifications/read-all`. |
| Company settings/team | `GET/PATCH /api/recruiter/company`; `GET /api/recruiter/team`; `POST /api/recruiter/invitations`; `POST /api/recruiter/invitations/:token/accept`; `PATCH /api/recruiter/team/:memberId`; `DELETE /api/recruiter/team/:memberId`. |
| Jobs and wizard | `GET/POST /api/recruiter/jobs`; `GET/PATCH/DELETE /api/recruiter/jobs/:jobId`; `POST /api/recruiter/jobs/:jobId/publish`; `POST /api/recruiter/jobs/:jobId/close`; draft autosave through `PATCH`. |
| Applicants, candidate list/profile, comparison, pipeline | `GET /api/recruiter/jobs/:jobId/applications`; `GET /api/recruiter/applications/:applicationId`; `PATCH /api/recruiter/applications/:applicationId`; `POST /api/recruiter/applications/bulk`; `GET /api/recruiter/candidates` (application-derived company directory); `GET /api/recruiter/candidates/:candidateId` (authorized only through this company's applications); `GET /api/recruiter/jobs/:jobId/comparison?applicationIds=...`; `GET /api/recruiter/pipeline?...`. |
| Interviews and completion monitoring | `GET/POST /api/recruiter/interviews`; `GET/PATCH /api/recruiter/interviews/:interviewId`; `POST /api/recruiter/interviews/:interviewId/invitations`; `GET/PUT /api/recruiter/interviews/:interviewId/questions`; `GET/POST /api/recruiter/interviews/:interviewId/feedback`; `POST /api/recruiter/interviews/:interviewId/decision`; `POST /api/recruiter/interviews/:interviewId/reminders`; invitation deadline updates via a scoped `PATCH`. |
| Offers/final decisions | `GET/POST /api/recruiter/offers`; `GET/PATCH /api/recruiter/offers/:offerId`; `POST /api/recruiter/offers/:offerId/withdraw`; candidate response endpoint authenticated as candidate; decision endpoint always binds to a tenant-checked application. |
| Messages/status updates | `GET /api/recruiter/conversations`; `GET /api/recruiter/conversations/:conversationId/messages`; `POST /api/recruiter/conversations/:conversationId/messages`; `POST /api/recruiter/conversations/:conversationId/read`; `POST /api/recruiter/status-updates` for validated, application-scoped bulk sends. |
| Billing | `GET /api/recruiter/billing`; provider session creation and cancel/change-plan operations under `/api/recruiter/billing/...`; signed provider webhook on a separately protected webhook route. Keep payment instrument data at the provider. |

Prefer flat, resource-oriented operations and explicit action endpoints for
state transitions; do not expose unrestricted generic table CRUD. All list
routes need validated pagination, filter/sort allowlists, and stable response
envelopes. All mutations need schema validation, normalized
`{ error: { message, code, details? } }` errors, and explicit status codes.

## 4. Proposed recruiter domain model and API contracts

### Existing foundation and required additions

The current Drizzle schema (`lib\db\src\schema\core.ts`) has:

- `users` with global roles `candidate | recruiter | admin` (lines 19, 65–78);
- `companies` with profile/benefit fields (108–121);
- `company_members` with `companyId`, `userId`, free-form `role`, and
  `active | invited | inactive` status plus company/user uniqueness (123–139);
- `jobs` with company FK, content, status, view count, and dates (141–170);
- `applications` with job/candidate FKs, status/stage, notes/rejection reason,
  unique `(jobId,candidateId)` and indexes (191–218);
- `interviews` with application FK, type/status, schedule/deadline/note and
  timestamps (220–237).

Add migrations/schema/contracts for:

1. **Membership invitations**: `company_invitations` keyed by company and
   normalized email; role, inviter, hashed one-time token, expiry, accepted,
   revoked, and created timestamps. On accept, atomically create/activate a
   company member. The current `company_members.userId` is non-null and cannot
   model an email-only pending invite by itself.
2. **Constrained organization roles**: define and validate roles such as
   `owner`, `admin`, `recruiter`, `hiring_manager`, and `billing_admin`.
   Migrate existing free-form roles deliberately. Preserve distinction between
   global `users.role` (recruiter route eligibility) and tenant membership
   role (company permissions).
3. **Job authoring**: add `createdByUserId`, optional version/updated
   concurrency field, and a persisted ordered `screening_questions` model
   (or a validated JSON structure with a migration path). Current wizard's
   question template is not in `jobs`. Ensure publish/close transitions set
   dates and cannot expose drafts through public `GET /api/jobs`.
4. **Application history**: add an append-only `application_events` audit
   table (application, company via job, actor, previous/next stage/status,
   note/reason, timestamp, request/idempotency metadata). `applications.stage`
   and `applications.status` currently have separate enums; define one
   authoritative transition table and keep both consistent. Do not add a
   sourced-lead/company-candidate relationship unless the product explicitly
   replaces this application-only access model.
5. **Interview detail**: extend `interviews` or add interview question-set,
   question, candidate response, reviewer-feedback, and invitation-delivery
   tables. The current schema has only summary scheduling/status fields; the
   UI's typed questions, scores, and video/text responses are not represented.
6. **Offers**: `offers` with application FK, creator, amount/currency,
   expiration, status, response timestamps, message/terms, and audit. Enforce
   one active offer per application as product policy requires.
7. **Messaging/notifications/audit**: tenant-aware conversations and
   participants, messages and read receipts; user/company notifications;
   activity should derive from durable audit events, not a separately editable
   fixture. Define candidate-facing access to each message/notification.
8. **Billing**: provider customer/subscription identifiers, plan/status and
   webhook event idempotency. Store no raw card numbers/payment secrets.
9. **Company settings**: current `companies` fields cover the existing profile
   form. Decide whether enterprise security/notification controls are real
   server-enforced settings; model only controls with defined semantics.

### Contract conventions and endpoint set

All routes below are proposals, not existing implementations. Use shared Zod
schemas for query/params/body and response parsing, following the current
`lib\api-zod\src\candidates.ts` and `jobs.ts` contract style. Prefer company
context established by active membership (`GET /api/recruiter/context`) and
server-side company scoping. If the user belongs to multiple companies, make
the selected company explicit in the context/session or a validated company
route parameter; never trust a client-supplied ID without membership check.

**Context and company**

- `GET /api/recruiter/context` → authenticated recruiter identity, active
  company, permissible role/capabilities, and available memberships.
- `GET/PATCH /api/recruiter/company` → current company profile; only company
  admin/owner may edit.
- Team/invitation routes from §3; return pending/active/inactive status and
  allowed role options. `POST invitations` must be idempotent or conflict
  cleanly for duplicate pending invitations.

**Jobs and application management**

- `GET/POST /api/recruiter/jobs`; `GET/PATCH/DELETE
  /api/recruiter/jobs/:jobId`; publish/close/reopen endpoints.
- Job payload maps existing fields (`title`, `department`, `location`,
  `locationType`, `type`, salary/currency, description, requirements,
  responsibilities, benefits, skills, experience level, closing date) and
  validated screening questions. `companyId`, `status`, `postedAt`, `viewCount`,
  and creator must be server-owned or transition-controlled.
- `GET /api/recruiter/jobs/:jobId/applications` supports stage/status,
  search, pagination, sort, and safe candidate summary; detail includes
  candidate profile fields the recruiter is authorized to see, application
  timeline, and protected resume locator.
- `PATCH /api/recruiter/applications/:applicationId` accepts a narrow
  stage/status transition, optional internal note/rejection reason, and
  expected version. Use `POST /bulk` for application IDs plus one allowed
  action; validate every target under the same company and return per-item
  success/conflict/error.
- `GET /api/recruiter/candidates` and `/:candidateId` must not become an
  unscoped directory of every user/candidate. Restrict results to company
  applications only. Comparison receives only authorized application IDs,
  and profile responses exclude applications from all other companies.

**Pipeline, dashboard, analytics**

- `GET /api/recruiter/pipeline?jobId=&stage=&page=&limit=` returns stage groups
  and application identifiers; counts are computed from the same authorized
  filter.
- `GET /api/recruiter/dashboard` returns documented count/time-window
  summaries and recent records; `GET /api/recruiter/reports` accepts
  validated date range, job, and grouping. Use server aggregation; never trust
  client-calculated totals as security or billing facts.
- `GET /api/recruiter/activity` returns events actor is allowed to see, with
  cursor/page pagination.

**Interviews, offers, communication**

- Interview APIs in §3 must bind every interview to an existing application
  and tenant-owned job. Invitation create/reminder calls need deduplication
  keys, a deadline policy, and delivery status. Questions and feedback need
  author/time/version and an explicit distinction between internal recruiter
  notes and candidate-visible feedback.
- Offer create/update/withdraw/response operations bind to an application;
  enforce valid status transitions and expiration. Candidate accept/decline
  must be separately authenticated and cannot mutate another candidate's
  offer.
- Message conversation access is participant-based and tenant-scoped. Bulk
  status update input is a set of application IDs plus a supported template
  and message; do not accept arbitrary candidate IDs or allow client selection
  to bypass per-application authorization.
- Notifications support list, mark-read, and read-all. Completion monitoring
  must use persisted invitation status/deadline and return delivery errors.

## 5. Authorization, tenant boundaries, and ownership rules

`artifacts\maqbool\src\components\layout\require-auth.tsx` gates the current UI
by global role, while `artifacts\api-server\src\middlewares\auth.ts:62–141`
provides `authenticate` and global-role `authorize`. These are necessary but
not sufficient: the backend must additionally enforce company membership and
resource ownership on **every** recruiter request.

1. Require `authenticate` and global role `recruiter` for recruiter APIs.
   The existing public `POST /api/auth/register` currently creates
   `role: "candidate"` (`artifacts\api-server\src\routes\auth.ts:321+`); do not
   solve recruiter signup by trusting a client-supplied role. Bootstrap a
   company owner through a controlled invitation/admin process, then accept
   company invitations and create/activate memberships. Define an explicit,
   audited admin-provisioning process.
2. Resolve caller's active `company_members` row(s) from the authenticated
   user ID. Never derive authority from `companyId` in body, URL, localStorage,
   or frontend role label alone. Multi-company selection is a requested
   context, not a grant. Reject inactive, revoked, or expired memberships.
3. Every job read/mutation must include `jobs.companyId = authorizedCompanyId`.
   A job is company-owned, not owned solely by its creator. A recruiter from
   company A cannot discover, update, publish, close, or count company B jobs.
4. Every application/interview/offer is authorized through its parent job:
   join `applications.jobId → jobs.id` and require that job's company to be
   authorized. Every write also validates that the target application and
   referenced interview/offer belong together. Never authorize by comparing
   an application ID supplied by the browser alone.
5. Candidate profile access is application-based, not tenant membership-based.
   The relationship that grants recruiter access is an existing
   `applications` row joining the candidate to a job whose `companyId` is the
   active authorized company. There is no global candidate directory and no
   sourced-lead relationship in the current backend design. Candidate list and
   search endpoints must join `candidates → applications → jobs` and filter
   `jobs.companyId` to the active company. Profile endpoints must require at
   least one authorized application and must filter returned application
   history to the active company. Candidate resumes must use a private,
   short-lived or application-authorized download endpoint; do not expose raw
   private storage URLs. Avoid returning candidate email/phone/resume fields in
   list endpoints unless required by the job and permissions. Never infer
   company access from candidate visibility, a stored candidate ID, or a
   candidate's application to a different company.
6. Apply tenant scope to counts, exports, search, comparison, notifications,
   team, billing, messages, and all reporting queries—not only the main page
   list. A message is visible only to authorized participants; an invitation
   cannot enumerate arbitrary accounts.
7. Define tenant role permissions centrally (e.g. owner/admin manage company
   and team; recruiter manage jobs/applications/interviews; hiring manager
   view or act only within an explicitly assigned scope; billing admin manage
   billing). If job-level assignments are introduced, add a job-member or
   assignment table and check it in addition to company membership. Audit
   sensitive actions and deny by default.
8. Use consistent `401` unauthenticated, `403` authenticated but disallowed,
   `404` for inaccessible resource where non-disclosure is preferred, `409`
   stale/invalid transition, `422` semantically invalid payload, and `429`
   rate-limited actions. Never leak whether another tenant owns a supplied ID.

## 6. Frontend API, state, and navigation changes

Follow `BACKEND_FRONTEND_INTEGRATION_PLAN.md`'s same-origin `/api`, cookie
authentication, normalized errors, and focused-client recommendation. The
candidate-facing `AuthProvider` already restores `/auth/me`; recruiter pages
should wait for that state and then load company context. The current
`RecruiterShell` still hardcodes company and fixture-derived search/count
data, and the route guard redirects to `/` for role mismatch; change it to
show loading, no-company/invitation, multi-company selection, and recoverable
errors.

1. Add `lib\api-zod\src\recruiter.ts` with strict request and response schemas;
   export types from `lib\api-zod\src\index.ts`. Align or regenerate the
   generated API client only after route contracts match; the existing
   integration plan warns that the generated contract is broader and can
   mismatch implemented responses.
2. Add focused frontend modules, reusing the existing authenticated fetch and
   error helpers (`artifacts\maqbool\src\lib\authenticated-api.ts`,
   `authenticated-api.test.ts`):
   `lib\api\recruiter.ts`, `recruiter-query-keys.ts`, hooks/services for
   jobs, applications, interviews/offers, company/team, messages, and
   dashboard/notifications. Include cookie credentials, abort signals, one
   refresh-and-retry policy, response validation, and no token storage.
3. Use React Query as the server-state source. Keys include authenticated user
   and company context, for example
   `["recruiter", userId, companyId, "jobs", filters]`,
   `["recruiter", userId, companyId, "application", applicationId]`,
   `["recruiter", userId, companyId, "interviews", filters]`. Clear recruiter
   queries on logout, role change, membership/company switch, or expired
   session. Mutations invalidate all dependent dashboard/count/pipeline/list
   keys.
4. Move shareable job/applicant/pipeline/report filters, sort, and pagination
   into URL query state with validation and history support. Keep only
   presentation state (open tab/dialog, drag ghost, draft text not yet sent,
   selected rows) local. Route parameter IDs and query values must be parsed
   and validated; keep current navigation links but route to actual
   server-returned resource IDs.
5. Convert every page in §2 to explicit loading, retryable error, empty,
   forbidden, and stale/conflict states. Keep prior data during background
   refetch where safe. Do not show fixture content on `401`, `403`, network
   errors, or empty responses.
6. Wizard form state must survive step navigation and refresh: create a
   backend draft and use its ID in the route (or persist a server draft keyed
   by current user/company). Validate each step client-side for usability and
   validate the full draft/publish contract server-side. Prevent duplicate
   saves/publishes; show the API's canonical job state after mutation.
7. Keep `ConfirmAction` and offer/team dialogs, but disable duplicate submit,
   show pending state, preserve user input on recoverable errors, and close
   only after confirmed server success. Bulk actions show per-row result,
   including stale statuses and partial failures.
8. Replace both `RecruiterSearch` and `CommandPalette` fixture result lists
   with one debounced, cancellable search service and provide “no results,”
   loading, and authorization-aware navigation. Static page-jump entries can
   remain local.
9. Treat mock fixtures as design-only. If visual mock mode remains, require an
   explicit development-only flag and a visible “Mock data” indicator that
   cannot be enabled in production. Do not let mock mode be the error fallback.

## 7. Data migration, seed, and fixture requirements

1. **Inventory before migration:** confirm the deployed Drizzle migration
   journal and existing rows; do not infer production contents from
   `0000_fuzzy_kid_colt.sql`. `lib\db\drizzle\0000_fuzzy_kid_colt.sql` creates
   the core tables and `0001_saved_jobs.sql` adds candidate saved jobs.
2. **Schema migrations:** add migrations for invitations/role constraints,
   job creator/screening questions, application audit events and any status
   reconciliation, interview questions/responses/feedback, offers, messaging,
   notifications, and billing metadata. Add foreign keys, uniqueness,
   check constraints, indexes, created/updated timestamps, and safe
   `ON DELETE` behavior. Keep the existing unique application-per-job/candidate
   rule unless product explicitly changes it.
3. **Existing row compatibility:** current companies have no user ownership
   FK except through `company_members`; reconcile every existing recruiter
   account and company membership before requiring tenant checks. Resolve
   orphan companies, duplicate/pending memberships, invalid free-form member
   roles, and jobs without a valid company. Backfill owners/membership only
   from verified administrative data; never guess ownership from email domain
   or mock fixture identity. Migration must be resumable and auditable.
4. **Stage/status reconciliation:** existing enum values differ (`application
   status` includes `reviewing`, `shortlisted`, `interviewing`, `offered`,
   `withdrawn`; `application stage` includes `screening`, `interview`,
   `decision`, `offer`, `hired`, `rejected`). Specify one mapping and retain
   historical transitions. Decide the representation of hired/withdrawn and
   make terminal-state mutations explicit. Backfill `application_events`
   with an “initial/imported state” marker rather than fabricating historical
   actors or timestamps.
5. **Fixture policy:** do not bulk-import `MOCK_USERS`, `MOCK_JOBS`,
   `MOCK_CANDIDATES`, `MOCK_APPLICATIONS`, `MOCK_INTERVIEWS`, or mock messages,
   stats, notifications, and activity into production. Fixture IDs are not
   database identity and the fixtures contain illustrative candidate data.
   Keep them for explicitly isolated development/testing only.
6. **Seed design:** provide repeatable, idempotent development/test seeds for
   at least two companies, multiple recruiter membership roles, jobs in
   draft/published/paused/closed states, candidates/applications across stages,
   and interview/offer/message/notification/audit examples. Include a second
   tenant with deliberately similar job/candidate values to test isolation.
   Use environment-provided test passwords or generated credentials; do not
   hard-code production secrets. Add cleanup/reset instructions to the
   database package/seed tooling.
7. **Rollout:** deploy additive schema first, backfill/verify, deploy APIs,
   then frontend. Keep backfill checks and rollback instructions. Do not
   enable live recruiter pages for tenant records until owner membership and
   per-resource scoping are verified.

## 8. Validation, state transitions, and edge cases

- Validate IDs as positive bounded integers/UUIDs according to the final
  schema; reject malformed IDs and unknown query keys rather than coercing
  ambiguous data.
- Job create/update: required title, company-derived ownership, salary min
  ≤ max, valid currency, dates, status transitions, valid arrays/limits,
  description sizes, valid location/type/experience values. Publish requires
  required fields and screening questions if policy says so. Prevent
  publish/close races with a version or conditional update.
- Job wizard lifecycle: step refresh/back/forward, switching jobs, unsaved
  edits, failed autosave, two-tab edits, duplicate publish, expired session,
  closed job with active applications, and draft visibility on public API.
- Applications: one row selected multiple times in bulk; candidates applying
  concurrently; stale transition; withdrawn/duplicate/terminal states; reject
  reason visibility; application removed/deleted; invalid mixed-tenant bulk
  IDs. Return stable per-item results without applying unauthorized entries.
- Candidate privacy: missing profile, empty optional fields, candidate
  deletion/anonymization, profile changes after application, resume moved or
  inaccessible, and a candidate with applications to multiple companies.
- Interviews: invitation delivery failure/retry and idempotency, invalid or
  expired deadline, rescheduling/cancellation, candidate completion race,
  question-set edit after invitation, feedback visibility, duplicate reviewer
  feedback, and interview/application/company mismatch.
- Offers: only eligible application stage, expired offer, accept/decline race,
  two active offers, withdrawal after acceptance, currency/amount precision,
  and candidate-facing disclosure. Define whether offer action also updates
  application status atomically.
- Messages/notifications: pagination, read race, repeated send, blank/oversize
  message, inactive member, inaccessible conversation, delivery failure, and
  duplicate notification delivery. Escape/render untrusted content safely.
- Team/security settings: duplicate email, existing account in another
  company, role escalation, last owner removal/demotion, expired/reused invite,
  inactive member, concurrent membership change, and revocation of active
  sessions/permissions.
- Billing: provider timeout/webhook retries/out-of-order events, duplicate
  webhook event IDs, canceled/past-due state, plan downgrade with active jobs,
  permissions, and checkout return not being treated as payment confirmation.
- Reports/search: empty company, timezone boundaries, future/invalid date
  ranges, stable pagination when data changes, PII exclusion, and aggregate
  totals matching the same tenant filters used by detail pages.
- Every persistent mutation returns canonical server state; refresh after
  `409` and show a useful recovery path instead of overwriting newer data.

## 9. Testing strategy

Use the existing API server test runner (`artifacts\api-server\package.json`,
`test`: `tsx --test src/*.test.ts`) and current route-test patterns such as
`artifacts\api-server\src\jobs.test.ts`,
`candidate-applications.test.ts`, and `candidates.test.ts`. Add focused
schema and frontend helper tests; the existing integration plan notes that
React component tests are not currently configured for this package.

**Contract/unit tests**

- Zod request/response coverage for every new recruiter route, enum, pagination
  and mutation error shape.
- API client cookie credentials, refresh once on `401`, normalized errors,
  response parsing, aborts, and no token persistence.
- React Query key isolation by user/company, status mutation invalidation,
  company-switch/logout cache clearing, and stale-result handling.
- Shared stage transition matrix, role/capability matrix, validation,
  idempotency, and date/currency normalization.

**Backend route/DB tests**

- Unauthenticated, wrong global role, no membership, inactive membership,
  insufficient tenant role, own-company allowed, and cross-company `404/403`
  for every resource/action class.
- Verify IDs in bulk payloads, counts, search, exports, reports, comparisons,
  and notifications cannot leak another tenant's rows.
- CRUD and status-transition lifecycle for jobs, applications, interviews,
  offers, team invitations, messages, and company settings.
- Concurrent duplicate application, stale version, duplicate invitation,
  repeated bulk request, webhook replay/order, and transactional atomicity.
- Protected resume access, audit records, redacted logs, and candidate-visible
  versus internal fields.
- Migration and seed idempotency from empty DB and representative existing
  company/member/job/application rows; verify rollback/backfill checks.

**Frontend page and end-to-end flows**

- For every route in §2: loading, populated, truly empty, API failure/retry,
  forbidden, invalid/missing ID, and server conflict. Assert no mock fixture
  appears on an API failure.
- E2E as provisioned company owner: create/edit draft, refresh mid-wizard,
  publish, open applicants, update pipeline, bulk reject/advance, schedule and
  complete interview, submit feedback/decision, create/respond to offer, send
  message/status update, mark notification read, update company/team, and
  reload to verify durable state.
- E2E as ordinary recruiter and hiring manager: permitted actions succeed,
  restricted company/team/billing actions are denied in UI and API.
- E2E as two companies: attempt direct URL, altered company ID, guessed job,
  application, candidate, interview, offer, conversation, notification, and
  report IDs; verify neither data nor counts are disclosed.
- E2E auth/session: restore via `/auth/me`, one refresh retry, logout/cache
  clearing, role switch, expired membership, and no-company onboarding.
- Billing provider sandbox/webhook tests before exposing production billing.

Run API tests and typecheck/build at each phase; run the two-tenant E2E suite
before enabling recruiter endpoints in a production rollout. Include tests
for direct URL access and server enforcement—hidden buttons alone do not
constitute authorization.

## 10. Security and performance considerations

### Security and privacy

- Keep browser auth on the existing HttpOnly cookie model; use same-origin
  `/api` where possible. Retain `credentials: "include"` and configured
  credentialed CORS only for approved origins. Add CSRF protection/origin
  validation for state-changing cookie-auth requests if cross-site deployment
  permits requests; use SameSite/Secure/HttpOnly cookie settings appropriate
  to deployment.
- Centralize tenant resolution and permission checks in backend middleware or
  service functions. Include tenant predicates in the actual SQL query, not
  post-filtered response arrays. Add integration tests for every new route
  family. Never accept role or ownership claims from request bodies.
- Return only necessary candidate PII, protect resume downloads, and enforce
  retention/deletion policies. Separate candidate-facing fields from internal
  notes, scores, and rejection rationale. Do not expose AI/mock scores as
  authoritative; disclose provenance and require authorization.
- Validate and limit request body sizes, free text, arrays, file access,
  pagination, search patterns, and bulk sizes. Use rate limits for login,
  invite/reminder/send, bulk operations, search, and billing callbacks.
- Record security-sensitive changes in append-only audit history; redact
  tokens, invite tokens, message bodies, candidate PII, and payment data from
  request logs. Hash one-time invitation tokens and verify expiration/reuse.
- Escape/render messages and rich job content safely; defend against stored
  XSS. Validate outbound links and uploads. Prevent open redirects on return
  URLs. Use server-side idempotency for email, bulk actions, and payment
  operations.
- Protect public job visibility: recruiter-only drafts/paused/closed records
  remain unavailable to candidate `GET /api/jobs`; recruiter counts and
  applicants must not be joined into public response payloads.

### Performance and reliability

- Use database pagination and server-side filtering; never load the entire
  tenant's applicants/messages to filter in the browser. Add suitable
  composite indexes, including company/job + status/stage + created/updated
  time, membership user/company + status, interview status/schedule, message
  conversation + timestamp, and notification recipient + read/time. Confirm
  query plans before adding speculative indexes.
- Select only fields needed by list cards. Avoid N+1 candidate/job/company
  lookups; use joins or batched queries. Use one consistent filtered relation
  for result rows and counts. Use cursor pagination for large activity/message
  histories and cap bulk page sizes.
- Aggregate dashboard/report summaries in SQL with bounded date ranges and
  cache only with company/user-aware keys and explicit invalidation. Do not
  let stale cache cross a tenant switch. Defer email/video processing to
  background jobs with retries and durable delivery state; return queued vs
  sent accurately.
- Use conditional updates/version checks for pipeline and wizard writes.
  Add API timeouts, retry only safe/idempotent operations, cancellation for
  obsolete searches, and observability for request latency, database query
  time, delivery failures, and tenant-scoping errors.

## 11. Phased implementation and order

Ship vertical slices with backend contracts, authorization, tests, and UI
loading/error states together. Do not begin with reports or decorative
screens; establish tenant identity first.

### Phase 0 — Contract and tenancy decisions

**Status: Complete.**

1. Confirm production DB state, company ownership/membership, tenant-selection
   UX, recruiter provisioning, role matrix, the application-based candidate
   visibility rule, status transition policy, interview/offer visibility,
   and billing provider. The approved decisions are recorded in
   `RECRUITER_PHASE0_DECISIONS.md`.
2. Write Zod contracts and response/error conventions. Define the query
   scoping helper and route test harness. Reconcile generated API contract
   choice with the candidate integration plan. Recruiter contract schemas are
   in `lib\api-zod\src\recruiter.ts`, and contract behavior tests are in
   `artifacts\api-server\src\recruiter-phase0.test.ts`.
3. Add a feature flag default-off for recruiter live mode; decide production
   no-company/invitation states. `RECRUITER_LIVE_ENABLED=false` is the default
   server configuration; invalid values fail startup.

**Exit:** approved domain/authorization matrix and test cases exist; the API
can identify the caller's company context without using mock data. Phase 0
does not implement the context endpoint; that is the exit artifact and first
deliverable of Phase 1.

### Phase 1 — Membership and company context

1. Add schema migrations for constrained tenant roles, invitation lifecycle,
   and any required company/user ownership backfill.
2. Implement controlled recruiter provisioning, context/membership endpoint,
   team/invitation APIs, and company read/update.
3. Test missing/multiple/inactive memberships, duplicate invitations, role
   boundaries, and cross-company isolation.
4. Wire `RequireAuth`, recruiter shell company identity, no-company handling,
   team page, and company profile form.

**Exit:** a provisioned recruiter can load only their authorized company and
team; company settings persist.

### Phase 2 — Job authoring and management

1. Add job creator/version and screening question persistence; define
   publication validation and status transitions.
2. Implement company-scoped list/detail/create/update/publish/close APIs and
   route tests; preserve public candidate job visibility rules.
3. Wire job list and create/edit wizard; persist drafts before navigating
   between `:step` routes and after refresh.
4. Replace shell search and command-palette job results; add pagination,
   query URL state, conflict recovery, and no-fixture states.

**Exit:** job create/edit/publish/close persists, reload reflects server state,
and tenant A cannot see or mutate tenant B jobs.

### Phase 3 — Applications, candidates, and pipeline

1. Add application event history, transition service, and protected
   candidate/resume projections. Do not add sourced-lead or global-candidate
   access; candidate visibility must be derived from applications to
   company-owned jobs.
2. Implement job applicants, application detail, candidate list/profile,
   pipeline, comparison, single and bulk mutations.
3. Wire dashboard job/application counts and replace all candidate/job/app
   fixture lookup in the corresponding pages.
4. Add partial bulk result UI, stale-state recovery, and event timeline.

**Exit:** recruiter can review authorized applicants and persist/audit all
pipeline actions; no candidate detail or cross-company application history is
accessible unless the candidate applied to an authorized company job.

### Phase 4 — Interviews and completion

1. Add interview question/response/feedback schemas, invitation delivery
   lifecycle, reminders, deadlines, and transition rules.
2. Implement list/detail/create/invite/questions/feedback/decision/reminder
   endpoints and delivery retries.
3. Wire interview, invitation, question, feedback, decision, final decision,
   and completion-monitoring screens. Preserve URL navigation and show actual
   delivery and completion states.

**Exit:** invitation, question set, response/feedback, decision, reminder,
and completion deadline survive reload and have audit records.

### Phase 5 — Offers and candidate communications

1. Add offers and candidate response workflow; define transition and
   application-status coupling.
2. Add conversation/message/read receipts, notification generation, and
   status-update delivery. Reuse shared Inbox; implement idempotency and
   delivery state.
3. Wire offers, final decision, messages, status updates, and notifications.

**Exit:** offer and all recruiter-to-candidate communications are persisted,
authorized, and visibly distinguish queued, delivered, failed, and read.

### Phase 6 — Activity, dashboard, and reports

1. Derive activity feed from audit events; implement company-scoped dashboard
   and report aggregates with agreed definitions/time zones.
2. Replace mock values and trends; add filters/date range, empty/error states,
   and tenant-safe cache invalidation.

**Exit:** totals reconcile to the same underlying records and never include
another company.

### Phase 7 — Billing

1. Integrate the selected billing provider, secure checkout/portal, persisted
   subscription state, signed/idempotent webhooks, and role permissions.
2. Replace local plan/cancel state; disable actions until provider state is
   confirmed.

**Exit:** sandbox checkout/change/cancel/webhook/replay tests pass and UI
reflects authoritative subscription status.

### Phase 8 — Cutover and fixture retirement

1. Run migration/backfill checks, tenant isolation suite, full recruiter
   E2E, performance checks, and operational review.
2. Enable feature flag for a test tenant, monitor, then roll out gradually.
3. Remove recruiter imports/use of mock data and fake success timers; retain
   fixtures only for explicit non-production visual tests.

**Exit:** §12 readiness gate passes; rollback and support runbooks are
available.

## 12. Explicit definition of ready

Recruiter backend integration is **ready** only when all of the following are
true:

1. Every recruiter route in `artifacts\maqbool\src\App.tsx:73–102` is either
   backed by its documented, authorized API and durable storage or is
   intentionally hidden/disabled with a clear unavailable state. There is no
   visible recruiter workflow that reports a local-only action as successful.
2. No live recruiter screen or shell search uses `MOCK_*`,
   `RECRUITER_NOTIFICATIONS`, `INITIAL_COMPLETION_DATA`, local synthetic
   domain records, or stale fallback fixtures as server data. API errors never
   silently turn into empty success or mock success.
3. Company context, invitations, membership role checks, job ownership, and
   application/interview/offer/message/notification/report tenant scoping are
   enforced server-side and covered by cross-tenant tests, including direct
   URL/ID tampering and aggregate/search paths. Candidate directory, profile,
   search, comparison, resume, interview, offer, and pipeline access requires
   an application to an active authorized company job.
4. Job drafts/statuses, applicant transitions and audit history, interviews,
   feedback/questions, offers, messages, notification read state, company
   settings, and team membership persist across reloads. Billing is
   provider-backed and webhook-verified before billing actions are enabled.
5. Every page has tested loading, empty, retry/error, unauthorized, stale
   conflict, and mutation-pending/success behavior. Bulk and delivery actions
   report partial failures accurately; no duplicate mutation is created by a
   retry.
6. Schema migrations/backfills and repeatable seeds pass; seeded two-company
   fixtures demonstrate isolation and are not imported as production users.
   Resume/candidate PII access and audit/log redaction pass security checks.
7. API route/schema tests, relevant frontend helper/page tests, typecheck,
   production build, migration tests, and recruiter E2E flows pass. The
   two-tenant E2E suite demonstrates both authorized operation and denied
   cross-tenant access.
8. Operational readiness includes a feature-flagged rollout, health/error
   monitoring, migration/rollback steps, documented role and status
   semantics, and ownership of email/billing-provider configuration.

## Repository references

- `BACKEND_FRONTEND_INTEGRATION_PLAN.md` — current API client, cookie auth,
  React Query, environment, test and integration conventions; explicitly
  excludes recruiter/company APIs.
- `artifacts\maqbool\src\App.tsx:73–103` — recruiter route registry and
  role-gated shell.
- `artifacts\maqbool\src\components\layout\recruiter-shell.tsx:18–135` and
  `artifacts\maqbool\src\components\layout\app-shell.tsx` — recruiter nav,
  global search, notification count, account/navigation state.
- `artifacts\maqbool\src\lib\mock-data.ts:29–500+` — mock user, job,
  candidate, application, interview, notification, stats, conversations and
  activity sources; recruiter-specific imports are identified per screen in
  §2.
- `lib\db\src\schema\core.ts:19–247` and
  `lib\db\drizzle\0000_fuzzy_kid_colt.sql`,
  `lib\db\drizzle\0001_saved_jobs.sql` — current enums/tables/FKs/indexes and
  migration baseline.
- `artifacts\api-server\src\routes\index.ts:1–14`,
  `artifacts\api-server\src\middlewares\auth.ts:62–141`,
  `artifacts\api-server\src\routes\jobs.ts:45–369`,
  `artifacts\api-server\src\routes\candidates.ts:118–746`, and
  `artifacts\api-server\src\routes\auth.ts:78–321+` — current mounted
  endpoints, auth/role middleware, and candidate/public-job behavior.
- `lib\api-zod\src\candidates.ts` and `lib\api-zod\src\jobs.ts` — current
  request-schema conventions to extend.
- `artifacts\api-server\src\jobs.test.ts`,
  `artifacts\api-server\src\candidate-applications.test.ts`,
  `artifacts\api-server\src\candidates.test.ts` — existing backend test
  patterns.
