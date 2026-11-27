import crypto from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  companies,
  companyInvitations,
  companyMembers,
  db,
  users,
} from "@workspace/db";
import {
  recruiterActiveCompanySchema,
  recruiterCompanyUpdateSchema,
  recruiterInvitationCreateSchema,
  recruiterTeamMemberUpdateSchema,
  recruiterTeamParamsSchema,
  type RecruiterCapability,
  type RecruiterTenantRole,
} from "../../../../lib/api-zod/src/recruiter";
import { authenticate } from "../middlewares/auth";

type HttpError = Error & { statusCode: number; code?: string; details?: unknown };

function createHttpError(
  message: string,
  statusCode: number,
  code: string,
  details?: unknown,
): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

function getUserId(req: { user?: { id: string } }): number {
  const userId = Number(req.user?.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw createHttpError("Invalid authentication token", 401, "UNAUTHENTICATED");
  }
  return userId;
}

const roleCapabilities: Record<RecruiterTenantRole, RecruiterCapability[]> = {
  owner: ["company.read","company.update","team.manage","billing.manage","jobs.manage","applications.view","applications.manage","interviews.manage","offers.manage","messages.manage","reports.view"],
  admin: ["company.read","company.update","team.manage","billing.manage","jobs.manage","applications.view","applications.manage","interviews.manage","offers.manage","messages.manage","reports.view"],
  recruiter: ["company.read","jobs.manage","applications.view","applications.manage","interviews.manage","offers.manage","messages.manage","reports.view"],
  hiring_manager: ["company.read","jobs.manage","applications.view","applications.manage","interviews.manage","messages.manage"],
  billing_admin: ["company.read","billing.manage"],
};

function requireCapability(role: RecruiterTenantRole, capability: RecruiterCapability): void {
  if (!roleCapabilities[role].includes(capability)) {
    throw createHttpError("You do not have permission to perform this action", 403, "FORBIDDEN");
  }
}

type RecruiterRequest = {
  user?: { id: string };
  query?: Record<string, unknown>;
  cookies?: Record<string, string>;
};

export function createRecruiterRouter(database: typeof db = db): IRouter {
  const router: IRouter = Router();
  router.use(authenticate);

  async function getActiveMembership(req: RecruiterRequest) {
    const userId = getUserId(req);
    const memberships = await database
      .select({
        membershipId: companyMembers.id,
        companyId: companyMembers.companyId,
        companyName: companies.name,
        role: companyMembers.role,
        status: companyMembers.status,
      })
      .from(companyMembers)
      .innerJoin(companies, eq(companies.id, companyMembers.companyId))
      .where(eq(companyMembers.userId, userId));

    const active = memberships.filter((membership) => membership.status === "active");
    if (active.length === 0) return { memberships, active: null };
    const requestedCompanyId =
      typeof req.query?.companyId === "string"
        ? Number(req.query.companyId)
        : typeof req.cookies?.recruiter_company_id === "string"
          ? Number(req.cookies.recruiter_company_id)
          : undefined;
    const selected = requestedCompanyId !== undefined
      ? active.find((membership) => membership.companyId === requestedCompanyId) ?? null
      : active.length === 1
        ? active[0]
        : null;
    return { memberships, active: selected };
  }

  router.get("/recruiter/context", async (req, res, next) => {
    try {
      const userId = getUserId(req);
      const [user] = await database
        .select({ id: users.id, name: users.name, email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!user) {
        next(createHttpError("User not found", 404, "USER_NOT_FOUND"));
        return;
      }
      const { memberships, active } = await getActiveMembership(req);
      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        activeCompany: active ? {
          id: active.companyId,
          name: active.companyName,
          role: active.role,
          capabilities: roleCapabilities[active.role],
        } : null,
        memberships: memberships.map((membership) => ({
          companyId: membership.companyId,
          companyName: membership.companyName,
          role: membership.role,
          status: membership.status,
        })),
      });
    } catch (error) { next(error); }
  });

  router.post("/recruiter/context/active", async (req, res, next) => {
    try {
      const parsed = recruiterActiveCompanySchema.safeParse(req.body);
      if (!parsed.success) {
        next(createHttpError("Invalid company selection", 400, "VALIDATION_ERROR", parsed.error.flatten()));
        return;
      }
      const { active } = await getActiveMembership({
        ...req,
        query: { companyId: String(parsed.data.companyId) },
      });
      if (!active || active.companyId !== parsed.data.companyId) {
        next(createHttpError("Company membership not found", 404, "MEMBERSHIP_NOT_FOUND"));
        return;
      }
      res.cookie("recruiter_company_id", String(parsed.data.companyId), {
        httpOnly: true,
        sameSite: "lax",
        secure: req.secure,
      });
      res.json({ activeCompany: {
        id: active.companyId,
        name: active.companyName,
        role: active.role,
        capabilities: roleCapabilities[active.role],
      } });
    } catch (error) { next(error); }
  });

  router.get("/recruiter/company", async (req, res, next) => {
    try {
      const { active } = await getActiveMembership(req);
      if (!active) { next(createHttpError("No active company membership", 404, "NO_ACTIVE_COMPANY")); return; }
      requireCapability(active.role, "company.read");
      const [company] = await database
        .select({
          id: companies.id,
          name: companies.name,
          industry: companies.industry,
          website: companies.website,
          logoUrl: companies.logoUrl,
          size: companies.size,
          location: companies.location,
          description: companies.description,
          culture: companies.culture,
          benefits: companies.benefits,
          createdAt: companies.createdAt,
          updatedAt: companies.updatedAt,
        })
        .from(companies)
        .where(eq(companies.id, active.companyId))
        .limit(1);
      if (!company) { next(createHttpError("Company not found", 404, "COMPANY_NOT_FOUND")); return; }
      res.json({ company });
    } catch (error) { next(error); }
  });

  router.patch("/recruiter/company", async (req, res, next) => {
    try {
      const parsed = recruiterCompanyUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        next(createHttpError("Invalid company update", 400, "VALIDATION_ERROR", parsed.error.flatten()));
        return;
      }
      const { active } = await getActiveMembership(req);
      if (!active) { next(createHttpError("No active company membership", 404, "NO_ACTIVE_COMPANY")); return; }
      requireCapability(active.role, "company.update");
      const [company] = await database.update(companies)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(companies.id, active.companyId))
        .returning({
          id: companies.id,
          name: companies.name,
          industry: companies.industry,
          website: companies.website,
          logoUrl: companies.logoUrl,
          size: companies.size,
          location: companies.location,
          description: companies.description,
          culture: companies.culture,
          benefits: companies.benefits,
          createdAt: companies.createdAt,
          updatedAt: companies.updatedAt,
        });
      if (!company) { next(createHttpError("Company not found", 404, "COMPANY_NOT_FOUND")); return; }
      res.json({ company });
    } catch (error) { next(error); }
  });

  router.get("/recruiter/team", async (req, res, next) => {
    try {
      const { active } = await getActiveMembership(req);
      if (!active) { next(createHttpError("No active company membership", 404, "NO_ACTIVE_COMPANY")); return; }
      requireCapability(active.role, "team.manage");
      const members = await database
        .select({
          id: companyMembers.id,
          userId: companyMembers.userId,
          name: users.name,
          email: users.email,
          role: companyMembers.role,
          status: companyMembers.status,
          joinedAt: companyMembers.joinedAt,
        })
        .from(companyMembers)
        .innerJoin(users, eq(users.id, companyMembers.userId))
        .where(eq(companyMembers.companyId, active.companyId));
      res.json({ members });
    } catch (error) { next(error); }
  });

  router.post("/recruiter/invitations", async (req, res, next) => {
    try {
      const parsed = recruiterInvitationCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        next(createHttpError("Invalid invitation", 400, "VALIDATION_ERROR", parsed.error.flatten()));
        return;
      }
      const { active } = await getActiveMembership(req);
      if (!active) { next(createHttpError("No active company membership", 404, "NO_ACTIVE_COMPANY")); return; }
      requireCapability(active.role, "team.manage");
      const email = parsed.data.email.toLowerCase();
      const pending = await database.select({ id: companyInvitations.id }).from(companyInvitations).where(
        and(
          eq(companyInvitations.companyId, active.companyId),
          eq(companyInvitations.email, email),
          isNull(companyInvitations.acceptedAt),
          isNull(companyInvitations.revokedAt),
          gt(companyInvitations.expiresAt, new Date()),
        ),
      ).limit(1);
      if (pending.length > 0) {
        next(createHttpError("An active invitation already exists", 409, "INVITATION_DUPLICATE"));
        return;
      }
      const token = crypto.randomBytes(32).toString("base64url");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const [invitation] = await database.insert(companyInvitations).values({
        companyId: active.companyId,
        email,
        role: parsed.data.role,
        invitedByUserId: getUserId(req),
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }).returning({
        id: companyInvitations.id,
        email: companyInvitations.email,
        role: companyInvitations.role,
        expiresAt: companyInvitations.expiresAt,
        createdAt: companyInvitations.createdAt,
      });
      res.status(201).json({ invitation: { ...invitation, token } });
    } catch (error) { next(error); }
  });

  router.post("/recruiter/invitations/:token/accept", async (req, res, next) => {
    try {
      const token = req.params.token;
      if (!token || token.length < 32) {
        next(createHttpError("Invitation is invalid", 404, "INVITATION_NOT_FOUND"));
        return;
      }
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const userId = getUserId(req);
      const [user] = await database.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user) { next(createHttpError("Recruiter account not found", 404, "USER_NOT_FOUND")); return; }
      const [invitation] = await database.select().from(companyInvitations).where(eq(companyInvitations.tokenHash, tokenHash)).limit(1);
      if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt <= new Date() || invitation.email !== user.email.toLowerCase()) {
        next(createHttpError("Invitation is invalid or expired", 404, "INVITATION_NOT_FOUND"));
        return;
      }
      const [company] = await database
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.id, invitation.companyId))
        .limit(1);
      if (!company) {
        next(createHttpError("Invitation is invalid or expired", 404, "INVITATION_NOT_FOUND"));
        return;
      }
      const [membership] = await database.insert(companyMembers).values({
        companyId: invitation.companyId,
        userId,
        role: invitation.role,
        status: "active",
        joinedAt: new Date(),
      }).onConflictDoUpdate({
        target: [companyMembers.companyId, companyMembers.userId],
        set: { role: invitation.role, status: "active", joinedAt: new Date() },
      }).returning();
      await database.update(companyInvitations).set({ acceptedAt: new Date(), acceptedByUserId: userId }).where(eq(companyInvitations.id, invitation.id));
      res.cookie("recruiter_company_id", String(invitation.companyId), { httpOnly: true, sameSite: "lax", secure: req.secure });
      res.json({ membership });
    } catch (error) { next(error); }
  });

  router.patch("/recruiter/team/:memberId", async (req, res, next) => {
    try {
      const parsedParams = recruiterTeamParamsSchema.safeParse(req.params);
      const parsedBody = recruiterTeamMemberUpdateSchema.safeParse(req.body);
      if (!parsedParams.success || !parsedBody.success) {
        next(createHttpError("Invalid team update", 400, "VALIDATION_ERROR"));
        return;
      }
      const { active } = await getActiveMembership(req);
      if (!active) { next(createHttpError("No active company membership", 404, "NO_ACTIVE_COMPANY")); return; }
      requireCapability(active.role, "team.manage");
      const [member] = await database.select().from(companyMembers).where(
        and(eq(companyMembers.id, parsedParams.data.memberId), eq(companyMembers.companyId, active.companyId)),
      ).limit(1);
      if (!member) { next(createHttpError("Team member not found", 404, "TEAM_MEMBER_NOT_FOUND")); return; }
      if (member.role === "owner" && parsedBody.data.role !== "owner") {
        const owners = await database.select({ id: companyMembers.id }).from(companyMembers).where(
          and(eq(companyMembers.companyId, active.companyId), eq(companyMembers.role, "owner"), eq(companyMembers.status, "active")),
        );
        if (owners.length <= 1) { next(createHttpError("The last owner cannot be demoted", 422, "LAST_OWNER")); return; }
      }
      const [updated] = await database.update(companyMembers).set({ role: parsedBody.data.role! }).where(eq(companyMembers.id, member.id)).returning();
      res.json({ member: updated });
    } catch (error) { next(error); }
  });

  router.delete("/recruiter/team/:memberId", async (req, res, next) => {
    try {
      const parsed = recruiterTeamParamsSchema.safeParse(req.params);
      if (!parsed.success) { next(createHttpError("Invalid team member", 400, "VALIDATION_ERROR")); return; }
      const { active } = await getActiveMembership(req);
      if (!active) { next(createHttpError("No active company membership", 404, "NO_ACTIVE_COMPANY")); return; }
      requireCapability(active.role, "team.manage");
      const [member] = await database.select().from(companyMembers).where(
        and(eq(companyMembers.id, parsed.data.memberId), eq(companyMembers.companyId, active.companyId)),
      ).limit(1);
      if (!member) { next(createHttpError("Team member not found", 404, "TEAM_MEMBER_NOT_FOUND")); return; }
      if (member.role === "owner") {
        const owners = await database.select({ id: companyMembers.id }).from(companyMembers).where(
          and(eq(companyMembers.companyId, active.companyId), eq(companyMembers.role, "owner"), eq(companyMembers.status, "active")),
        );
        if (owners.length <= 1) { next(createHttpError("The last owner cannot be removed", 422, "LAST_OWNER")); return; }
      }
      const [updated] = await database.update(companyMembers).set({ status: "inactive" }).where(eq(companyMembers.id, member.id)).returning();
      res.json({ member: updated });
    } catch (error) { next(error); }
  });

  return router;
}

export default createRecruiterRouter();
