import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const db = getDb() as any;

    const [invitation] = await db
      .select()
      .from(schema.invitations)
      .where(eq(schema.invitations.token, token));

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found or link has expired." },
        { status: 404 }
      );
    }

    const [shift] = await db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, invitation.shiftId));

    if (!shift) {
      return NextResponse.json(
        { error: "Associated micro-shift not found." },
        { status: 404 }
      );
    }

    const [inviter] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, invitation.inviterUserId));

    const [hub] = shift.hubId
      ? await db
          .select()
          .from(schema.hubs)
          .where(eq(schema.hubs.id, shift.hubId))
      : [null];

    const activeClaims = await db
      .select()
      .from(schema.shiftClaims)
      .where(
        and(
          eq(schema.shiftClaims.shiftId, shift.id),
          eq(schema.shiftClaims.status, "confirmed")
        )
      );

    const spotsRemaining = Math.max(0, shift.capacity - activeClaims.length);
    const isExpired = new Date(invitation.expiresAt) < new Date();

    return NextResponse.json({
      success: true,
      invitation: {
        token: invitation.token,
        status: invitation.status,
        isExpired,
      },
      inviter: {
        displayName: inviter?.displayName || "A fellow volunteer",
        avatarSeed: inviter?.avatarSeed || "volunteer",
      },
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
        requiredSkills: shift.requiredSkills
          ? JSON.parse(shift.requiredSkills)
          : [],
        hub: hub
          ? {
              name: hub.name,
              address: hub.address,
              category: hub.category,
            }
          : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve invitation." },
      { status: 500 }
    );
  }
}
