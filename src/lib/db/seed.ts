import { getDb, schema } from "./index";
import {
  SEED_USERS,
  SEED_ORGANIZATIONS,
  SEED_HUBS,
  SEED_SHIFTS,
} from "./seed-data";

export async function resetAndSeedDatabase(d1Binding?: any) {
  const db = getDb(d1Binding) as any;
  const now = new Date().toISOString();

  // 1. Clear existing data in reverse order of foreign keys
  await db.delete(schema.shiftClaims);
  await db.delete(schema.invitations);
  await db.delete(schema.intakeRequests);
  await db.delete(schema.shifts);
  await db.delete(schema.hubs);
  await db.delete(schema.organizations);
  await db.delete(schema.users);

  // 2. Insert Users
  for (const user of SEED_USERS) {
    await db.insert(schema.users).values({
      id: user.id,
      displayName: user.displayName,
      role: user.role,
      avatarSeed: user.avatarSeed,
      email: user.email,
      safeNeighborhood: user.safeNeighborhood,
      skills: JSON.stringify(user.skills),
      createdAt: now,
    });
  }

  // 3. Insert Organizations
  for (const org of SEED_ORGANIZATIONS) {
    await db.insert(schema.organizations).values({
      id: org.id,
      ownerUserId: org.ownerUserId,
      name: org.name,
      description: org.description,
      isApproved: org.isApproved,
      createdAt: now,
    });
  }

  // 4. Insert Hubs
  for (const hub of SEED_HUBS) {
    await db.insert(schema.hubs).values({
      id: hub.id,
      name: hub.name,
      address: hub.address,
      latitude: hub.latitude,
      longitude: hub.longitude,
      category: hub.category,
      isApproved: hub.isApproved,
      createdAt: now,
    });
  }

  // 5. Insert Shifts
  for (const shift of SEED_SHIFTS) {
    await db.insert(schema.shifts).values({
      id: shift.id,
      orgId: shift.orgId,
      hubId: shift.hubId,
      title: shift.title,
      description: shift.description,
      locationType: shift.locationType,
      startAt: shift.startAt,
      endAt: shift.endAt,
      durationMins: shift.durationMins,
      capacity: shift.capacity,
      status: shift.status,
      requiredSkills: JSON.stringify(shift.requiredSkills),
      createdAt: now,
    });
  }

  // 6. Pre-seed 1 initial claim: Marcus claims 1 spot on Shift 1 (Pantry Box Sorting)
  const initialClaimId = "claim_marcus_pantry";
  await db.insert(schema.shiftClaims).values({
    id: initialClaimId,
    shiftId: "shift_pantry_sorting",
    userId: "usr_marcus",
    status: "confirmed",
    createdAt: now,
  });

  // 7. Pre-seed an active invitation token for Marcus inviting a buddy
  await db.insert(schema.invitations).values({
    id: "inv_marcus_pantry",
    token: "invite-marcus-pantry",
    shiftId: "shift_pantry_sorting",
    inviterUserId: "usr_marcus",
    status: "active",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: now,
  });

  return {
    success: true,
    message: "Database successfully reset and seeded to pristine demo baseline.",
    counts: {
      users: SEED_USERS.length,
      organizations: SEED_ORGANIZATIONS.length,
      hubs: SEED_HUBS.length,
      shifts: SEED_SHIFTS.length,
      initialClaims: 1,
      initialInvitations: 1,
    },
  };
}

// Allow CLI execution via `node` or `pnpm tsx` if run directly
if (typeof process !== "undefined" && process.argv[1]?.endsWith("seed.ts")) {
  resetAndSeedDatabase()
    .then((res) => {
      console.log("Seed result:", res);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    });
}
