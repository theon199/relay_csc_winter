import { NextResponse } from "next/server";
import { relay, errorResponse } from "@/lib/data-client";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const { shifts, stats } = await relay({ op: "listShifts", viewerId: user.id });
    return NextResponse.json({ success: true, count: shifts.length, shifts, stats });
  } catch (err) {
    return errorResponse(err, "Failed to fetch shifts.");
  }
}
