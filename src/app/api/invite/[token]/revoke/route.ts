import { NextResponse } from "next/server";
import { relay, errorResponse } from "@/lib/data-client";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(_req: Request, ctx: RouteContext<"/api/invite/[token]/revoke">) {
  try {
    const { token } = await ctx.params;
    const user = await getCurrentUser();
    await relay({ op: "revokeInvite", userId: user.id, token });
    return NextResponse.json({ success: true, message: "Invite link turned off." });
  } catch (err) {
    return errorResponse(err, "Failed to revoke invite.");
  }
}
