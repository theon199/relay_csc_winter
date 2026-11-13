import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shiftId } = await params;
    const user = await getCurrentUser();

    const db = getDb() as any;
    const now = new Date().toISOString();

    // 1. Check if shift exists
    const [shift] = await db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.id, shiftId));

    if (!shift) {
      return NextResponse.json(
        { error: "Micro-shift not found." },
        { status: 404 }
      );
    }

    // 2. Check if user already claimed this shift
    const [existingClaim] = await db
      .select()
      .from(schema.shiftClaims)
      .where(
        and(
          eq(schema.shiftClaims.shiftId, shiftId),
          eq(schema.shiftClaims.userId, user.id),
          eq(schema.shiftClaims.status, "confirmed")
        )
      );

    if (existingClaim) {
      return NextResponse.json(
        { error: "You have already claimed a spot on this shift.", code: "ALREADY_CLAIMED" },
        { status: 409 }
      );
    }

    // 3. Count active claims to verify capacity
    const activeClaims = await db
      .select()
      .from(schema.shiftClaims)
      .where(
        and(
          eq(schema.shiftClaims.shiftId, shiftId),
          eq(schema.shiftClaims.status, "confirmed")
        )
      );

    if (activeClaims.length >= shift.capacity) {
      return NextResponse.json(
        { error: "Sorry, all volunteer spots on this shift have been filled.", code: "CAPACITY_EXCEEDED" },
        { status: 409 }
      );
    }

    // Check if user is joining via an invitation token
    let invitationId: string | null = null;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // body empty is ok
    }

    const { invitationToken } = body;
    if (invitationToken) {
      const [invitation] = await db
        .select()
        .from(schema.invitations)
        .where(
          and(
            eq(schema.invitations.token, invitationToken),
            eq(schema.invitations.shiftId, shiftId)
          )
        );

      if (invitation && invitation.status === "active") {
        invitationId = invitation.id;
        // Mark invitation claimed
        await db
          .update(schema.invitations)
          .set({
            status: "claimed",
            claimedByUserId: user.id,
          })
          .where(eq(schema.invitations.id, invitation.id));
      }
    }

    // 4. Insert new claim
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await db.insert(schema.shiftClaims).values({
      id: claimId,
      shiftId,
      userId: user.id,
      status: "confirmed",
      invitationId,
      createdAt: now,
    });

    // 5. Generate a fresh shareable invitation token for this user to Bring a Friend
    const newInviteToken = `invite-${user.avatarSeed || "relay"}-${Math.random().toString(36).slice(2, 8)}`;
    const newInviteId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await db.insert(schema.invitations).values({
      id: newInviteId,
      token: newInviteToken,
      shiftId,
      inviterUserId: user.id,
      status: "active",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Spot claimed successfully! Bring a friend along.",
      claimId,
      invitationToken: newInviteToken,
      shiftTitle: shift.title,
      volunteerName: user.displayName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to claim shift." },
      { status: 500 }
    );
  }
}
