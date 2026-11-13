import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const db = getDb() as any;

    // Fetch all published shifts, hubs, organizations, and claims
    const allShifts = await db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.status, "published"))
      .orderBy(desc(schema.shifts.createdAt));

    const allHubs = await db.select().from(schema.hubs);
    const allOrgs = await db.select().from(schema.organizations);
    const allClaims = await db
      .select()
      .from(schema.shiftClaims)
      .where(eq(schema.shiftClaims.status, "confirmed"));
    const allUsers = await db.select().from(schema.users);
    const allInvitations = await db.select().from(schema.invitations);

    const hubsMap = new Map(allHubs.map((h: any) => [h.id, h]));
    const orgsMap = new Map(allOrgs.map((o: any) => [o.id, o]));
    const usersMap = new Map(allUsers.map((u: any) => [u.id, u]));

    const enrichedShifts = allShifts.map((shift: any) => {
      const shiftClaims = allClaims.filter((c: any) => c.shiftId === shift.id);
      const claimedCount = shiftClaims.length;
      const spotsRemaining = Math.max(0, shift.capacity - claimedCount);

      // Extract participants
      const participants = shiftClaims.map((c: any) => {
        const u = usersMap.get(c.userId) as any;
        return {
          claimId: c.id,
          userId: c.userId,
          displayName: u ? u.displayName : "Anonymous Volunteer",
          avatarSeed: u ? u.avatarSeed : "volunteer",
          invitationId: c.invitationId,
        };
      });

      // Find active invitations for this shift
      const activeInvites = allInvitations.filter(
        (inv: any) => inv.shiftId === shift.id && inv.status === "active"
      );

      return {
        ...shift,
        requiredSkills: shift.requiredSkills
          ? JSON.parse(shift.requiredSkills)
          : [],
        hub: shift.hubId ? hubsMap.get(shift.hubId) || null : null,
        organization: orgsMap.get(shift.orgId) || null,
        claimedCount,
        spotsRemaining,
        isFull: spotsRemaining === 0,
        participants,
        activeInviteToken: activeInvites[0]?.token || null,
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedShifts.length,
      shifts: enrichedShifts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch shifts." },
      { status: 500 }
    );
  }
}
