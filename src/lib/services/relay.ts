/**
 * Relay business rules. Runs in two places:
 *  - the Cloudflare Worker (`worker/src/index.ts`) on D1, in production
 *  - the Next.js server on local SQLite, in development
 * Keep imports relative (no "@/" alias) so the Worker bundler can resolve them.
 */
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../db/schema";
import {
  SEED_CLAIMS,
  SEED_HUBS,
  SEED_INVITATIONS,
  SEED_ORGANIZATIONS,
  SEED_SHIFTS,
  SEED_USERS,
} from "../db/seed-data";

// Drizzle SQLite database over D1 or better-sqlite3. Both expose the same query builder.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RelayDb = any;

export class RelayError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
const newInviteToken = () => crypto.randomUUID().replace(/-/g, "");

/** Rows changed by a write, for both D1 (`meta.changes`) and better-sqlite3 (`changes`). */
function changesOf(result: unknown): number {
  const r = result as { changes?: number; meta?: { changes?: number } };
  return r?.changes ?? r?.meta?.changes ?? 0;
}

/** "Priya Patel" -> "Priya P." so public views never show full names. */
export function publicName(displayName: string | null | undefined): string {
  if (!displayName) return "A volunteer";
  const [first, ...rest] = displayName.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]}.` : first;
}

async function requireUser(db: RelayDb, userId: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user) throw new RelayError(401, "UNKNOWN_USER", "Unknown demo persona. Please switch persona and try again.");
  return user as typeof schema.users.$inferSelect;
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

export async function listShifts(db: RelayDb, viewerId: string | null) {
  const [allShifts, allHubs, allOrgs, allClaims, allUsers, allInvites] = await Promise.all([
    db.select().from(schema.shifts).where(eq(schema.shifts.status, "published")),
    db.select().from(schema.hubs),
    db.select().from(schema.organizations),
    db.select().from(schema.shiftClaims).where(eq(schema.shiftClaims.status, "confirmed")),
    db.select().from(schema.users),
    db.select().from(schema.invitations),
  ]);

  const hubs = new Map(allHubs.map((h: { id: string }) => [h.id, h]));
  const orgs = new Map(allOrgs.map((o: { id: string }) => [o.id, o]));
  const users = new Map<string, typeof schema.users.$inferSelect>(
    allUsers.map((u: typeof schema.users.$inferSelect) => [u.id, u])
  );
  const invites = new Map<string, typeof schema.invitations.$inferSelect>(
    allInvites.map((i: typeof schema.invitations.$inferSelect) => [i.id, i])
  );

  let totalBuddyPairs = 0;

  const shifts = (allShifts as (typeof schema.shifts.$inferSelect)[])
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((shift) => {
      const claims = (allClaims as (typeof schema.shiftClaims.$inferSelect)[])
        .filter((c) => c.shiftId === shift.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

      const participants = claims.map((c) => {
        const u = users.get(c.userId);
        const invite = c.invitationId ? invites.get(c.invitationId) : undefined;
        const inviter = invite ? users.get(invite.inviterUserId) : undefined;
        return {
          claimId: c.id,
          userId: c.userId,
          displayName: publicName(u?.displayName),
          avatarSeed: u?.avatarSeed ?? "volunteer",
          invitationId: c.invitationId,
          invitedBy: inviter ? publicName(inviter.displayName) : null,
        };
      });

      const buddyPairs = participants.filter((p) => p.invitedBy).length;
      totalBuddyPairs += buddyPairs;
      const spotsRemaining = Math.max(0, shift.capacity - claims.length);

      // Only the viewer's own invite link is returned; other people's tokens stay private.
      const myInvite = viewerId
        ? (allInvites as (typeof schema.invitations.$inferSelect)[]).find(
            (i) =>
              i.shiftId === shift.id &&
              i.inviterUserId === viewerId &&
              i.status === "active" &&
              new Date(i.expiresAt) > new Date()
          )
        : undefined;

      return {
        ...shift,
        requiredSkills: shift.requiredSkills ? JSON.parse(shift.requiredSkills) : [],
        hub: shift.hubId ? hubs.get(shift.hubId) ?? null : null,
        organization: orgs.get(shift.orgId) ?? null,
        claimedCount: claims.length,
        spotsRemaining,
        isFull: spotsRemaining === 0,
        participants,
        buddyPairs,
        myInviteToken: myInvite?.token ?? null,
      };
    });

  const uniqueVolunteers = new Set((allClaims as { userId: string }[]).map((c) => c.userId)).size;

  return {
    shifts,
    stats: {
      buddyPairs: totalBuddyPairs,
      volunteers: uniqueVolunteers,
      filledSpots: allClaims.length,
      openSpots: shifts.reduce((n, s) => n + s.spotsRemaining, 0),
    },
  };
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

const draftSchema = z.object({
  title: z.string().trim().min(3, "Each shift needs a title.").max(120),
  description: z.string().trim().min(1, "Each shift needs a description.").max(1000),
  locationType: z.enum(["in_person", "remote"]),
  hubId: z.string().nullish(),
  orgId: z.string().nullish(),
  startAt: z.string().trim().max(80).nullish(),
  endAt: z.string().trim().max(80).nullish(),
  durationMins: z.coerce.number().int().catch(60).transform((n) => Math.min(240, Math.max(15, n))),
  capacity: z.coerce.number().int().catch(2).transform((n) => Math.min(50, Math.max(1, n))),
  skills: z.array(z.string().trim().min(1).max(40)).max(10).catch([]),
});

const publishSchema = z.object({ drafts: z.array(draftSchema).min(1, "No shift drafts provided.").max(10) });

export async function publishShifts(db: RelayDb, userId: string, payload: unknown) {
  const user = await requireUser(db, userId);
  if (user.role !== "organizer" && user.role !== "admin") {
    throw new RelayError(403, "FORBIDDEN", "Only approved organizers can publish micro-shifts.");
  }

  const parsed = publishSchema.safeParse(payload);
  if (!parsed.success) {
    throw new RelayError(422, "INVALID_DRAFT", parsed.error.issues[0]?.message ?? "Invalid shift draft.");
  }

  const ownOrgs: (typeof schema.organizations.$inferSelect)[] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.ownerUserId, user.id));
  const approvedHubs = new Set(
    (await db.select().from(schema.hubs).where(eq(schema.hubs.isApproved, true))).map((h: { id: string }) => h.id)
  );

  // Validate every draft before writing any of them.
  const rows = parsed.data.drafts.map((d) => {
    if (d.locationType === "in_person" && (!d.hubId || !approvedHubs.has(d.hubId))) {
      throw new RelayError(
        422,
        "HUB_REQUIRED",
        `"${d.title}" is in person, so it must use an approved public community hub.`
      );
    }
    const org = ownOrgs.find((o) => o.id === d.orgId) ?? ownOrgs[0];
    if (user.role === "organizer" && (!org || !org.isApproved)) {
      throw new RelayError(403, "ORG_NOT_APPROVED", "Your organization isn't approved to publish yet.");
    }
    return {
      id: newId("shift"),
      orgId: org?.id ?? d.orgId ?? "org_st_jude",
      hubId: d.locationType === "in_person" ? d.hubId! : null,
      title: d.title,
      description: d.description,
      locationType: d.locationType,
      startAt: d.startAt || "Flexible — confirm with organizer",
      endAt: d.endAt || null,
      durationMins: d.durationMins,
      capacity: d.capacity,
      status: "published" as const,
      requiredSkills: JSON.stringify(d.skills),
      createdAt: new Date().toISOString(),
    };
  });

  for (const row of rows) await db.insert(schema.shifts).values(row);
  return { shiftIds: rows.map((r) => r.id) };
}

// ---------------------------------------------------------------------------
// Claims and invitations
// ---------------------------------------------------------------------------

async function loadValidInvite(db: RelayDb, token: string, shiftId: string, userId: string) {
  const [invite] = await db.select().from(schema.invitations).where(eq(schema.invitations.token, token));
  if (!invite || invite.shiftId !== shiftId) {
    throw new RelayError(404, "INVITE_NOT_FOUND", "This invite link isn't valid for this shift.");
  }
  if (invite.status === "revoked") throw new RelayError(410, "INVITE_REVOKED", "Your friend turned off this invite link.");
  if (invite.status === "claimed") throw new RelayError(410, "INVITE_USED", "Someone already joined with this invite link.");
  if (new Date(invite.expiresAt) < new Date()) throw new RelayError(410, "INVITE_EXPIRED", "This invite link has expired.");
  if (invite.inviterUserId === userId) {
    throw new RelayError(400, "OWN_INVITE", "That's your own invite link. Share it with a friend instead!");
  }
  return invite as typeof schema.invitations.$inferSelect;
}

export async function claimShift(db: RelayDb, userId: string, shiftId: string, invitationToken?: string | null) {
  const user = await requireUser(db, userId);
  if (user.role !== "volunteer") {
    throw new RelayError(403, "VOLUNTEERS_ONLY", "Switch to a volunteer persona to claim a spot.");
  }

  const [shift] = await db.select().from(schema.shifts).where(eq(schema.shifts.id, shiftId));
  if (!shift || shift.status !== "published") {
    throw new RelayError(404, "SHIFT_NOT_FOUND", "This micro-shift isn't available.");
  }

  const invite = invitationToken ? await loadValidInvite(db, invitationToken, shiftId, userId) : null;
  const claimId = newId("claim");
  const now = new Date().toISOString();

  // Atomic, capacity-aware insert: a single statement, so concurrent claims can never overbook.
  let inserted = 0;
  try {
    const result = await db.run(sql`
      INSERT INTO shift_claims (id, shift_id, user_id, status, invitation_id, created_at)
      SELECT ${claimId}, ${shiftId}, ${userId}, 'confirmed', ${invite?.id ?? null}, ${now}
      WHERE (SELECT COUNT(*) FROM shift_claims WHERE shift_id = ${shiftId} AND status = 'confirmed')
            < (SELECT capacity FROM shifts WHERE id = ${shiftId})
        AND NOT EXISTS (
          SELECT 1 FROM shift_claims WHERE shift_id = ${shiftId} AND user_id = ${userId} AND status = 'confirmed'
        )
    `);
    inserted = changesOf(result);
  } catch (err) {
    // The partial unique index catches a same-user race.
    if (String((err as Error)?.message ?? err).includes("UNIQUE")) {
      throw new RelayError(409, "ALREADY_CLAIMED", "You've already claimed a spot on this shift.");
    }
    throw err;
  }

  if (inserted === 0) {
    const [mine] = await db
      .select()
      .from(schema.shiftClaims)
      .where(
        and(
          eq(schema.shiftClaims.shiftId, shiftId),
          eq(schema.shiftClaims.userId, userId),
          eq(schema.shiftClaims.status, "confirmed")
        )
      );
    if (mine) throw new RelayError(409, "ALREADY_CLAIMED", "You've already claimed a spot on this shift.");
    throw new RelayError(409, "CAPACITY_EXCEEDED", "Sorry, every spot on this shift has been filled.");
  }

  if (invite) {
    // Single-use: only flip active -> claimed, so a second concurrent joiner can't reuse it.
    await db
      .update(schema.invitations)
      .set({ status: "claimed", claimedByUserId: userId })
      .where(and(eq(schema.invitations.id, invite.id), eq(schema.invitations.status, "active")));
  }

  const token = await getOrCreateInvite(db, userId, shiftId);
  const inviter = invite ? await requireUser(db, invite.inviterUserId) : null;

  return {
    claimId,
    invitationToken: token,
    shiftTitle: shift.title as string,
    volunteerName: publicName(user.displayName),
    joinedWith: inviter ? publicName(inviter.displayName) : null,
  };
}

async function getOrCreateInvite(db: RelayDb, userId: string, shiftId: string) {
  const existing: (typeof schema.invitations.$inferSelect)[] = await db
    .select()
    .from(schema.invitations)
    .where(
      and(
        eq(schema.invitations.shiftId, shiftId),
        eq(schema.invitations.inviterUserId, userId),
        eq(schema.invitations.status, "active")
      )
    );
  const live = existing.find((i) => new Date(i.expiresAt) > new Date());
  if (live) return live.token;

  const token = newInviteToken();
  await db.insert(schema.invitations).values({
    id: newId("inv"),
    token,
    shiftId,
    inviterUserId: userId,
    status: "active",
    expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
    createdAt: new Date().toISOString(),
  });
  return token;
}

/** A fresh "Bring a Friend" link for a volunteer who holds a confirmed claim (e.g. after revoking the old one). */
export async function createInvite(db: RelayDb, userId: string, shiftId: string) {
  const [claim] = await db
    .select()
    .from(schema.shiftClaims)
    .where(
      and(
        eq(schema.shiftClaims.shiftId, shiftId),
        eq(schema.shiftClaims.userId, userId),
        eq(schema.shiftClaims.status, "confirmed")
      )
    );
  if (!claim) throw new RelayError(403, "NO_CLAIM", "Claim a spot first, then you can invite a friend.");
  return { invitationToken: await getOrCreateInvite(db, userId, shiftId) };
}

export async function cancelClaim(db: RelayDb, userId: string, shiftId: string) {
  const result = await db
    .update(schema.shiftClaims)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(schema.shiftClaims.shiftId, shiftId),
        eq(schema.shiftClaims.userId, userId),
        eq(schema.shiftClaims.status, "confirmed")
      )
    );
  if (changesOf(result) === 0) {
    throw new RelayError(404, "NO_CLAIM", "You don't have an active claim on this shift.");
  }
  // A cancelled volunteer's open invite links stop working too.
  await db
    .update(schema.invitations)
    .set({ status: "revoked" })
    .where(
      and(
        eq(schema.invitations.shiftId, shiftId),
        eq(schema.invitations.inviterUserId, userId),
        eq(schema.invitations.status, "active")
      )
    );
  return { cancelled: true };
}

export async function getInvite(db: RelayDb, token: string) {
  const [invite] = await db.select().from(schema.invitations).where(eq(schema.invitations.token, token));
  if (!invite) throw new RelayError(404, "INVITE_NOT_FOUND", "This invite link doesn't exist.");

  const [shift] = await db.select().from(schema.shifts).where(eq(schema.shifts.id, invite.shiftId));
  if (!shift) throw new RelayError(404, "SHIFT_NOT_FOUND", "The shift for this invite no longer exists.");

  const [[inviter], [hub], [org], claims] = await Promise.all([
    db.select().from(schema.users).where(eq(schema.users.id, invite.inviterUserId)),
    shift.hubId ? db.select().from(schema.hubs).where(eq(schema.hubs.id, shift.hubId)) : Promise.resolve([null]),
    db.select().from(schema.organizations).where(eq(schema.organizations.id, shift.orgId)),
    db
      .select()
      .from(schema.shiftClaims)
      .where(and(eq(schema.shiftClaims.shiftId, shift.id), eq(schema.shiftClaims.status, "confirmed"))),
  ]);
  const claimUsers = await Promise.all(
    (claims as { userId: string }[]).map(async (c) => {
      const [u] = await db.select().from(schema.users).where(eq(schema.users.id, c.userId));
      return { displayName: publicName(u?.displayName), avatarSeed: u?.avatarSeed ?? "volunteer", userId: c.userId };
    })
  );

  const spotsRemaining = Math.max(0, shift.capacity - claims.length);
  const isExpired = new Date(invite.expiresAt) < new Date();

  return {
    invitation: { token: invite.token, status: invite.status, isExpired, expiresAt: invite.expiresAt },
    inviter: { displayName: publicName(inviter?.displayName), avatarSeed: inviter?.avatarSeed ?? "volunteer", userId: invite.inviterUserId },
    going: claimUsers,
    shift: {
      id: shift.id,
      title: shift.title,
      description: shift.description,
      locationType: shift.locationType,
      startAt: shift.startAt,
      durationMins: shift.durationMins,
      capacity: shift.capacity,
      spotsRemaining,
      isFull: spotsRemaining === 0,
      requiredSkills: shift.requiredSkills ? JSON.parse(shift.requiredSkills) : [],
      organization: org ? { name: org.name } : null,
      // Approved public venue only; never a private address.
      hub: hub ? { name: hub.name, address: hub.address, category: hub.category } : null,
    },
  };
}

export async function revokeInvite(db: RelayDb, userId: string, token: string) {
  const result = await db
    .update(schema.invitations)
    .set({ status: "revoked" })
    .where(
      and(
        eq(schema.invitations.token, token),
        eq(schema.invitations.inviterUserId, userId),
        eq(schema.invitations.status, "active")
      )
    );
  if (changesOf(result) === 0) {
    throw new RelayError(404, "INVITE_NOT_FOUND", "No active invite link of yours matches that token.");
  }
  return { revoked: true };
}

// ---------------------------------------------------------------------------
// Demo reset
// ---------------------------------------------------------------------------

export async function resetDemo(db: RelayDb) {
  const now = Date.now();
  // Stagger createdAt so seeded order is stable and newly published shifts sort first.
  const at = (offsetMins: number) => new Date(now - offsetMins * 60_000).toISOString();

  for (const table of [
    schema.shiftClaims,
    schema.invitations,
    schema.intakeRequests,
    schema.shifts,
    schema.hubs,
    schema.organizations,
    schema.users,
  ]) {
    await db.delete(table);
  }

  for (const u of SEED_USERS) {
    await db.insert(schema.users).values({ ...u, skills: JSON.stringify(u.skills), createdAt: at(600) });
  }
  for (const o of SEED_ORGANIZATIONS) {
    await db.insert(schema.organizations).values({ ...o, createdAt: at(600) });
  }
  for (const h of SEED_HUBS) {
    await db.insert(schema.hubs).values({ ...h, createdAt: at(600) });
  }
  for (const [i, s] of SEED_SHIFTS.entries()) {
    await db
      .insert(schema.shifts)
      .values({ ...s, requiredSkills: JSON.stringify(s.requiredSkills), createdAt: at(300 + i) });
  }
  for (const inv of SEED_INVITATIONS) {
    await db
      .insert(schema.invitations)
      .values({ ...inv, expiresAt: new Date(now + INVITE_TTL_MS).toISOString(), createdAt: at(200) });
  }
  for (const [i, c] of SEED_CLAIMS.entries()) {
    await db.insert(schema.shiftClaims).values({ ...c, status: "confirmed", createdAt: at(180 - i) });
  }

  return {
    users: SEED_USERS.length,
    shifts: SEED_SHIFTS.length,
    claims: SEED_CLAIMS.length,
    invitations: SEED_INVITATIONS.length,
  };
}
