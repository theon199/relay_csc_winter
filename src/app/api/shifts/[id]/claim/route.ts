import { NextRequest, NextResponse } from "next/server";
import { relay, errorResponse } from "@/lib/data-client";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/shifts/[id]/claim">) {
  try {
    const { id } = await ctx.params;
    const user = await getCurrentUser();
    const body = (await req.json().catch(() => ({}))) as { invitationToken?: string };
    const result = await relay({
      op: "claimShift",
      userId: user.id,
      shiftId: id,
      invitationToken: body.invitationToken ?? null,
    });
    return NextResponse.json({
      success: true,
      message: result.joinedWith
        ? `You're going with ${result.joinedWith}!`
        : "Spot claimed! Bring a friend along.",
      ...result,
    });
  } catch (err) {
    return errorResponse(err, "Failed to claim shift.");
  }
}
