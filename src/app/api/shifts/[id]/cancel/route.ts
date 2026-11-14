import { NextResponse } from "next/server";
import { relay, errorResponse } from "@/lib/data-client";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(_req: Request, ctx: RouteContext<"/api/shifts/[id]/cancel">) {
  try {
    const { id } = await ctx.params;
    const user = await getCurrentUser();
    await relay({ op: "cancelClaim", userId: user.id, shiftId: id });
    return NextResponse.json({ success: true, message: "Claim cancelled. Your spot is open for someone else." });
  } catch (err) {
    return errorResponse(err, "Failed to cancel claim.");
  }
}
