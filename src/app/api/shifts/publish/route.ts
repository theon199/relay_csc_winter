import { NextRequest, NextResponse } from "next/server";
import { relay, errorResponse } from "@/lib/data-client";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const payload = await req.json().catch(() => null);
    const { shiftIds } = await relay({ op: "publishShifts", userId: user.id, payload });
    return NextResponse.json({
      success: true,
      message: `Published ${shiftIds.length} micro-shift${shiftIds.length === 1 ? "" : "s"} to community discovery!`,
      publishedCount: shiftIds.length,
      shiftIds,
    });
  } catch (err) {
    return errorResponse(err, "Failed to publish micro-shifts.");
  }
}
