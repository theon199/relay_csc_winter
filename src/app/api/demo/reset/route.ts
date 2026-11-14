import { NextResponse } from "next/server";
import { relay, errorResponse } from "@/lib/data-client";

export async function POST() {
  try {
    const details = await relay({ op: "resetDemo" });
    return NextResponse.json({
      success: true,
      message: "Demo data reset to the original sample baseline.",
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return errorResponse(err, "Failed to reset demo data.");
  }
}
