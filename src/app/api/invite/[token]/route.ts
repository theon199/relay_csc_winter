import { NextResponse } from "next/server";
import { relay, errorResponse } from "@/lib/data-client";

export async function GET(_req: Request, ctx: RouteContext<"/api/invite/[token]">) {
  try {
    const { token } = await ctx.params;
    const data = await relay({ op: "getInvite", token });
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    return errorResponse(err, "Failed to load invitation.");
  }
}
