import { NextResponse } from "next/server";
import { relay, errorResponse } from "@/lib/data-client";
import { getCurrentUser } from "@/lib/auth/session";

/** Creates (or returns) the current volunteer's "Bring a Friend" link for a shift they've claimed. */
export async function POST(_req: Request, ctx: RouteContext<"/api/shifts/[id]/invite">) {
  try {
    const { id } = await ctx.params;
    const user = await getCurrentUser();
    const result = await relay({ op: "createInvite", userId: user.id, shiftId: id });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return errorResponse(err, "Failed to create invite link.");
  }
}
