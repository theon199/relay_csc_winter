import { NextRequest, NextResponse } from "next/server";
import { resetAndSeedDatabase } from "@/lib/db/seed";

export async function POST(req: NextRequest) {
  try {
    const result = await resetAndSeedDatabase();
    return NextResponse.json({
      success: true,
      message: "Relay demo database has been reset to pristine baseline.",
      details: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to reset demo database.",
      },
      { status: 500 }
    );
  }
}
