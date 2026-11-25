f# Recruiter Phase 0 Decisions

Phase 0 establishes recruiter backend contracts and policy. Recruiter
operations remain feature-flagged; company registration applications are
available separately and do not grant recruiter access.

## Approved product decisions

### Candidate visibility

A recruiter may see a candidate only through an application to a job posted by
that recruiter’s active authorized company.

Allowed SQL relationship:

```text
candidate
  -> application
  -> job
  -> job.companyId = active authorized companyId
```

The recruiter directory, candidate profile, candidate search, resume, applicant
list, comparison, pipeline, interview, offer, message, and report paths must
all enforce this relationship. Candidate access must not be granted because:

- the recruiter knows a candidate ID;
- the candidate profile exists;
- the candidate applied to a different company;
- the candidate is in a global user table;
- or the frontend hid or omitted an unrelated candidate.

If one candidate applied to jobs at two companies, each company may see only
its own application and application history. No recruiter API may disclose
another company's application, stage, activity, or interview/offer data.

The mock Add Candidate workflow and sourced-lead candidates are not supported.
These UI elements must be hidden or removed rather than implemented as
unverified global-candidate access.

### Company and membership

- A user's global role does not grant company access. Access requires an
  authenticated identity and an active membership in an approved company.
- `company_members.role` is tenant-scoped and separate from global `users.role`.
- Candidate accounts retain their global candidate role when they gain
  recruiter capabilities through company membership.
- Platform-admin privileges do not bypass company membership or tenant roles.
- A recruiter may belong to multiple companies, but only one active company
  is selected for a request/session context.
- A client-supplied company ID is never a grant of authority.
- Active company resolution and every resource authorization use
  `companyId + userId + active membership`.
- Missing, inactive, expired, revoked, or unknown memberships produce no
  company data. Prefer `404` for inaccessible resources to avoid leaking tenant
  ownership; use `403` only when the caller is authorized as a member of the
  context company but lacks the required capability.

### Recruiter provisioning

Users register and log in through the existing account system. An authenticated
user may submit a company registration application; it remains pending and
does not create an owner membership. Approval must create an active owner
membership, while rejection grants no recruiter access. Public user
registration remains candidate-only and must never accept a recruiter role or
company grant from a request body. Email verification is not implemented yet
and is deferred. A company invitation is a separate one-time token record;
accepting a valid invitation activates the membership.

The last owner of a company cannot be removed or demoted through normal team
APIs.

### Tenant role and capability matrix

| Capability | Owner | Admin | Recruiter | Hiring Manager | Billing Admin |
|---|---:|---:|---:|---:|---:|
| Read company | Yes | Yes | Yes | Yes | Yes |
| Update company | Yes | Yes | No | No | No |
| Manage team/invitations | Yes | Yes | No | No | No |
| Manage billing | Yes | Yes | No | No | Yes |
| Manage jobs | Yes | Yes | Yes | Job scope, if assigned | No |
| View applications | Yes | Yes | Yes | Job scope, if assigned | No |
| Manage applications | Yes | Yes | Yes | Job scope, if assigned | No |
| Manage interviews | Yes | Yes | Yes | Job scope, if assigned | No |
| Manage offers | Yes | Yes | Yes | No or job approval policy | No |
| Manage messages | Yes | Yes | Yes | Job scope, if assigned | No |
| View reports | Yes | Yes | Yes | Company aggregates, if approved | No |

Until job-level assignments are introduced, hiring managers have no implicit
application scope beyond company-level permission policy. A later migration
may add job assignment records, but the base implementation remains
company-scoped.

## Status transition decisions

The existing `applications.status` and `applications.stage` fields are
redundant until reconciled. The recruiter API uses stage as the user-facing
pipeline and status as the legacy/candidate-facing summary. Phase 3 must
define and test a single canonical transition service.

Initial canonical mapping:

| Stage | Legacy status |
|---|---|
| applied | applied |
| screening | reviewing or shortlisted |
| interview | interviewing |
| decision | interviewing |
| offer | offered |
| hired | offered initially, then a dedicated terminal outcome |
| rejected | rejected |

Terminal-state rules:

- An application cannot advance after `hired` or `rejected`.
- `withdrawn` is candidate-driven and cannot be reversed by a recruiter.
- `offer` creation requires `decision` or an approved explicit stage.
- Acceptance/rejection of an offer is atomic with the corresponding
  application outcome.
- `withdrawn` and `rejected` require audit provenance.
- All stage mutations use an expected version and return `409` on stale state.

Job transitions:

```text
draft -> published -> paused -> published -> closed
draft -> closed
published -> closed
paused -> closed
```

Only `published` jobs appear in candidate discovery. Draft or closed jobs
remain recruiter-only. Closing a job with applications is allowed, but does
not implicitly reject or withdraw applicants.

## Interview and offer visibility

- Interview records are visible only through an authorized application and
  company-owned job.
- Candidate-visible invitation fields exclude recruiter private notes and
  reviewer feedback.
- Reviewer feedback is internal until explicitly configured otherwise.
- Candidate questions and interview responses remain bound to the interview
  and application IDs.
- One active offer per application is the initial product policy.
- Offer acceptance and rejection require candidate authentication and cannot
  be mutated by a recruiter endpoint.
- Recruiter withdrawal is allowed only before candidate acceptance.
- Offer expiration is server-enforced and returned as canonical state.

## API conventions

Recruiter operations are mounted under `/api/recruiter/*` only after the
feature flag is enabled. Company registration and current-user status
endpoints are mounted independently so authenticated users can apply while
operations remain disabled. Contracts use Zod in `@workspace/api-zod/recruiter`.

- Success payloads use resource data plus a stable list envelope.
- List parameters use validated `page`, `limit`, allowlisted search/filter, and
  allowlisted sort values.
- Mutations use strict request objects and reject unknown fields.
- Errors use:

```json
{
  "error": {
    "code": "APPLICATION_STALE",
    "message": "The application changed before this update.",
    "details": {}
  }
}
```

- `401`: unauthenticated.
- `403`: authenticated but lacking role, capability, or membership.
- `404`: inaccessible or unknown tenant resource.
- `409`: stale version or invalid transition.
- `422`: structurally valid but semantically invalid request.
- `429`: request or action rate limit.

No recruiter route returns raw candidate storage URLs. Resume access is
application-authorized and uses short-lived or server-controlled download
behavior.

## Feature flag

`RECRUITER_LIVE_ENABLED=false` is the default. The server exposes
`config.recruiter.liveEnabled`; recruiter operational routes/UI live mode must
remain disabled until Phase 8. Company registration and status endpoints are
not governed by this flag. Invalid flag values fail startup instead of
silently using recruiter behavior.

## Phase 0 acceptance test matrix

| Scenario | Expected result |
|---|---|
| Recruiter belongs to company A and candidate applied to company A | Candidate and application visible |
| Recruiter belongs to company A and candidate has only company B application | Candidate not visible; profile/search returns no row |
| Recruiter belongs to company A and candidate applied to A and B | Recruiter A sees only company A application/history |
| Recruiter belongs to no company | No active company and no candidate/job data |
| Recruiter belongs to multiple companies | Context identifies memberships; only explicitly selected company is active |
| Membership is inactive | Membership ignored; no resource or count access |
| Recruiter tampers with companyId | Company membership and resource checks reject or hide it |
| Candidate profile ID is guessed directly | Profile is visible only if its applications include an authorized company job |
| Candidate resume URL is guessed directly | No raw URL or unrelated tenant download |
| Bulk application IDs span companies | Process only authorized IDs and report per-item failures |
| Search or dashboard is queried across tenants | Query filters by active company and cannot affect counts |
| Recruiter tries company update | Allowed only for owner/admin |
| Billing admin tries team management | Rejected |
| Owner is the only remaining owner | Owner removal/demotion is rejected |
| Public registration sends recruiter role | Request rejected; candidate role remains server-owned |
| A company application is pending or rejected | No active owner membership or recruiter access |
| An approved company has an active owner membership | Tenant access follows the membership role |
| A user has multiple active company memberships without selection | No company is selected automatically |
| Recruiter feature flag is invalid | Server startup fails |
| Recruiter feature flag is false | Recruiter live routes/screens remain disabled |

## Phase 0 deliverables

- [x] Candidate application-only visibility rule.
- [x] Company membership and active-company decision.
- [x] Controlled recruiter provisioning decision.
- [x] Tenant role/capability matrix.
- [x] Initial job/application/interview/offer transition policy.
- [x] API error/status and pagination conventions.
- [x] Recruiter Zod contract module.
- [x] Default-off recruiter feature flag.
- [x] Cross-tenant and direct-ID acceptance test matrix.

## Explicitly deferred to later phases

- Membership schema and migration: Phase 1.
- Recruiter context, invitation, and company routes: Phase 1.
- Job and application mutations: Phases 2–3.
- Interview question/response/feedback persistence: Phase 4.
- Offer and communication persistence: Phase 5.
- Billing provider integration: Phase 7.
- Live rollout and fixture retirement: Phase 8.
