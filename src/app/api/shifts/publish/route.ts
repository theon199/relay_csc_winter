import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user.role !== "organizer" && user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Permission denied: Only approved organizers can publish volunteer micro-shifts.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { drafts } = body;

    if (!drafts || !Array.isArray(drafts) || drafts.length === 0) {
      return NextResponse.json(
        { error: "No shift drafts provided for publication." },
        { status: 400 }
      );
    }

    const db = getDb() as any;
    const now = new Date().toISOString();
    const publishedIds: string[] = [];

    for (const draft of drafts) {
      // Validate in-person shifts have a valid hubId
      if (draft.locationType === "in_person" && !draft.hubId) {
        return NextResponse.json(
          {
            error: `In-person shift "${draft.title}" must be mapped to an approved public community hub before publishing.`,
          },
          { status: 422 }
        );
      }

      const shiftId = `shift_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await db.insert(schema.shifts).values({
        id: shiftId,
        orgId: draft.orgId || "org_st_jude",
        hubId: draft.locationType === "in_person" ? draft.hubId : null,
        title: draft.title,
        description: draft.description,
        locationType: draft.locationType,
        startAt: draft.startAt || "This Weekend",
        endAt: draft.endAt || null,
        durationMins: Number(draft.durationMins) || 60,
        capacity: Number(draft.capacity) || 2,
        status: "published",
        requiredSkills: JSON.stringify(draft.skills || []),
        createdAt: now,
      });

      publishedIds.push(shiftId);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully published ${publishedIds.length} micro-shift(s) to community discovery!`,
      publishedCount: publishedIds.length,
      shiftIds: publishedIds,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to publish micro-shifts." },
      { status: 500 }
    );
  }
}
