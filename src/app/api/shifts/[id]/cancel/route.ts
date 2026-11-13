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

    const [claim] = await db
      .select()
      .from(schema.shiftClaims)
      .where(
        and(
          eq(schema.shiftClaims.shiftId, shiftId),
          eq(schema.shiftClaims.userId, user.id),
          eq(schema.shiftClaims.status, "confirmed")
        )
      );

    if (!claim) {
      return NextResponse.json(
        { error: "No active claim found for your user on this shift." },
        { status: 404 }
      );
    }

    await db
      .update(schema.shiftClaims)
      .set({ status: "cancelled" })
      .where(eq(schema.shiftClaims.id, claim.id));

    return NextResponse.json({
      success: true,
      message: "Your volunteer claim has been cancelled. Spot reopened for others.",
      cancelledClaimId: claim.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to cancel claim." },
      { status: 500 }
    );
  }
}
