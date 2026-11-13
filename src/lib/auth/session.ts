import { cookies } from "next/headers";
import { SEED_USERS, SeedUser } from "@/lib/db/seed-data";

export const SESSION_COOKIE_NAME = "relay_session_user";

export interface SessionUser {
  id: string;
  displayName: string;
  role: "organizer" | "volunteer" | "admin";
  avatarSeed: string;
  email: string;
  safeNeighborhood?: string;
  skills?: string[];
}

// Default persona if no cookie is set
export const DEFAULT_USER: SessionUser = {
  id: "usr_marcus",
  displayName: "Marcus Vance",
  role: "volunteer",
  avatarSeed: "marcus",
  email: "marcus.v@student.edu",
  safeNeighborhood: "University District",
  skills: ["Organization", "Spanish", "Outdoors"],
};

export async function getCurrentUser(): Promise<SessionUser> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie?.value) {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
      const matched = SEED_USERS.find((u) => u.id === parsed.id);
      if (matched) {
        return {
          id: matched.id,
          displayName: matched.displayName,
          role: matched.role,
          avatarSeed: matched.avatarSeed,
          email: matched.email,
          safeNeighborhood: matched.safeNeighborhood,
          skills: matched.skills,
        };
      }
    }
  } catch (err) {
    // Fall back to default
  }

  return DEFAULT_USER;
}
