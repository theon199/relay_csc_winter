import { NextRequest, NextResponse } from "next/server";
import { SEED_USERS } from "@/lib/db/seed-data";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    const user = SEED_USERS.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { error: `User with id "${userId}" not found in demo personas.` },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: `Switched active persona to ${user.displayName} (${user.role}).`,
      user: {
        id: user.id,
        displayName: user.displayName,
        role: user.role,
        avatarSeed: user.avatarSeed,
        email: user.email,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: encodeURIComponent(
        JSON.stringify({
          id: user.id,
          role: user.role,
          displayName: user.displayName,
        })
      ),
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to switch persona." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) {
    return NextResponse.json({
      activeUserId: "usr_marcus",
      personas: SEED_USERS,
    });
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(cookie.value));
    return NextResponse.json({
      activeUserId: parsed.id,
      personas: SEED_USERS,
    });
  } catch {
    return NextResponse.json({
      activeUserId: "usr_marcus",
      personas: SEED_USERS,
    });
  }
}
